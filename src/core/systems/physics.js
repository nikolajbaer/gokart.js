import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent, ApplyVelocityComponent, SetRotationComponent, KinematicCharacterComponent, PhysicsControllerComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
//import * as RAPIER from  '@dimforge/rapier3d-compat'
import { OnGroundComponent } from "../../common/components/movement.js";
import { DebugNormalComponent } from "../../common/components/debug.js";
import { Vector3 } from "three";
import * as AMMO from "ammo.js/builds/ammo.js";

let Ammo = null

const AXIS = {
    X: new THREE.Vector3(1,0,0),
    Y: new THREE.Vector3(0,1,0),
    Z: new THREE.Vector3(0,0,1),
}

export class PhysicsSystem extends System {
    init(attributes) {
        this.body_entity_map = {}

        AMMO().then( _ammo => {
            Ammo = _ammo
            console.log("hello from ammo",Ammo)
            const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
            const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
            const overlappingPairCache = new Ammo.btDbvtBroadphase()
            const solver = new Ammo.btSequentialImpulseConstraintSolver()
            this.physics_world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration)
            this.physics_world.setGravity(new Ammo.btVector3(0, -10, 0));

            // Per https://discourse.threejs.org/t/ammo-js-with-three-js/12530/45 for Kinematic Controllers
            this.physicsWorld.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback())
        })

        if(attributes && attributes.collision_handler){
            this.collision_handler = attributes.collision_handler
        }else{
            this.collision_handler = null
        }

    }

    create_heightfield_shape(e,body,locrot,quat){
        const hfield = e.getComponent(HeightfieldDataComponent)

        // Reference https://github.com/kripken/ammo.js/blob/main/examples/webgl_demo_terrain/index.html#L238
        const terrainWidth = hfield.width
        const terrainDepth = hfield.height
        //const heightData = this.generateHeight(terrainWidth,terrainDepth,-2,8) //hfield.data // column major order 
        const heightData = hfield.data // column major order 
        // NOTE: terrain is vertically centered between min/max, so we need to adjust
        const terrainMaxHeight = Math.max(...heightData);
        const terrainMinHeight = Math.min(...heightData);

        var heightScale = 1; // maybe hfield.scale.y?

        // Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
        var upAxis = 1;

        // hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
        var hdt = "PHY_FLOAT";

        // Set this to your needs (inverts the triangles)
        var flipQuadEdges = false;

        // Creates height data buffer in Ammo heap
        const ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

        // Copy the javascript height data array to the Ammo one.
        var p = 0;
        var p2 = 0;
        for ( var j = 0; j < terrainDepth; j ++ ) {
            for ( var i = 0; i < terrainWidth; i ++ ) {

                // write 32-bit float data to memory
                Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightData[ p ];

                p ++;

                // 4 bytes/float
                p2 += 4;
            }
        }

        // Creates the heightfield physics shape
        var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
            terrainWidth,
            terrainDepth,
            ammoHeightData,
            heightScale,
            terrainMinHeight,
            terrainMaxHeight,
            upAxis,
            hdt,
            flipQuadEdges
        );

        heightFieldShape.setLocalScaling( new Ammo.btVector3( hfield.scale.x/(terrainWidth-1), hfield.scale.y, hfield.scale.z/(terrainDepth-1) ) );
        heightFieldShape.setMargin( 0.05 );
        console.log("Creating Heightfield Shape",heightFieldShape,"from",ammoHeightData)

        return heightFieldShape;
    }

    create_physics_body(e){
        const body = e.getComponent(BodyComponent)
        const locrot = e.getComponent(LocRotComponent)
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(locrot.rotation.x,locrot.rotation.y,locrot.rotation.z,'YZX'))

        let shape;
        switch(body.bounds_type){
            case BodyComponent.BOX_TYPE:
                shape = new Ammo.btBoxShape(new Ammo.btVector3(body.bounds.x/2,body.bounds.y/2,body.bounds.z/2))
                break
            case BodyComponent.SPHERE_TYPE:
                shape = new Ammo.btSphereShape(body.bounds.x/2)
                break
            case BodyComponent.CYLINDER_TYPE:
                shape = new Ammo.btCylinderShape(body.bounds.y/2, body.bounds.z/2)
                break
            case BodyComponent.CAPSULE_TYPE:
                shape = new Ammo.btCapsuleShape(body.bounds.y/2, body.bounds.z/2)
                break
            case BodyComponent.HEIGHTFIELD_TYPE:
                if(!e.hasComponent(HeightfieldDataComponent)){ 
                    console.error("height field bodies must have a HeightfieldDataComponent, defaulting to a Plane") 
                    break
                }else{
                    shape = this.create_heightfield_shape(e,body,locrot,quat)
                }
                break
            default:
                console.error("Unknown body type",body.body_type)
                e.removeComponent(BodyComponent)
                return
        }

        const transform = new Ammo.btTransform()
        transform.setIdentity()
        transform.setOrigin(new Ammo.btVector3(locrot.location.x,locrot.location.y,locrot.location.z))
        transform.setRotation(new Ammo.btQuaternion(quat.x,quat.y,quat.z,quat.w))

        // TODO handle kinematic character controller:
        // Refernece:
        // https://discourse.threejs.org/t/ammo-js-with-three-js/12530/36

        if( e.hasComponent(KinematicCharacterComponent) && 
            !e.hasComponent(PhysicsControllerComponent) && 
            body.body_type == BodyComponent.KINEMATIC_CHARACTER ){
            this.create_kinematic_character_controller(shape,e,transform)
        }else{
            const mass = (body.body_type == BodyComponent.STATIC)?0:body.mass
            const isDynamic = mass != 0
            const localInertia  = new Ammo.btVector3(0, 0, 0);

            if(isDynamic){
                shape.calculateLocalInertia(mass, localInertia);
            }

            const myMotionState = new Ammo.btDefaultMotionState(transform)
            const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, shape, localInertia)
            const btBody = new Ammo.btRigidBody(rbInfo)
            this.physics_world.addRigidBody(btBody)

            // consider do i need to clean up colliders?
            e.addComponent(PhysicsComponent, { body: btBody })

            // TODO figure out how to link up entity to body in Ammo.js
            //this.body_entity_map[body.debugBodyId] = e 

        }
    }

    create_kinematic_character_controller(shape,e,transform){
        const body = e.getComponent(BodyComponent)

         // https://github.com/enable3d/enable3d/blob/kinematicCharacterController/packages/enable3d/src/ammoWrapper/kinematicCharacterController.ts#L32

        // https://github.com/kripken/ammo.js/issues/254
        const kchar = e.getComponent(KinematicCharacterComponent)
        const ghost = new Ammo.btPairCachingGhostObject();
        ghost.setWorldTransform(transform);
        ghost.setCollisionShape(shape);
        ghost.setCollisionFlags(ghost.getCollisionFlags() | 15 ); // CF_CHARACTER_OBJECT
        //this.overlappingPairCache.getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());

        const controller = new Ammo.btKinematicCharacterController(ghost, shape, kchar.step_height, 1);
        controller.setUseGhostSweepTest(true)
        controller.setGravity(kchar.gravity) // default 9.8*3
        controller.setMaxSlope(kchar.max_slope) // default Math.PI / 4
        controller.setJumpSpeed(kchar.jump_speed)
        this.physics_world.addCollisionObject(ghost, 32, -1)
        this.physics_world.addAction(controller)

        // consider do i need to clean up colliders?
        // TODO where do I store this kinematic controller action? 
        e.addComponent(PhysicsControllerComponent, { ctrl: controller })
    }

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized.results.forEach( e => {
            this.create_physics_body(e)
        })

        this.queries.set_rotation.results.forEach( e => {
            const rot = e.getComponent(SetRotationComponent)
            const body = e.getComponent(PhysicsComponent).body

            const quat = new THREE.Quaternion()
            if(rot.x != null) {
                quat.setFromAxisAngle(AXIS.X,rot.x)
            }
            if(rot.y != null) {
                quat.setFromAxisAngle(AXIS.Y,rot.y)
            }
            if(rot.z != null) {
                quat.setFromAxisAngle(AXIS.Z,rot.z)
            }
            const tr = body.getCenterOfMassTransform()
            const btquat = new Ammo.btQuaternion(quat.x,quat.y,quat.z,quat.w)
            tr.setRotation(btquat)
            body.setCenterOfMassTransform(tr)
            e.removeComponent(SetRotationComponent)
        })

        // TODO also remove controllers
        this.queries.remove.results.forEach( e => {
            const body = e.getComponent(PhysicsComponent).body
            Ammo.destroy(body)
            //delete this.body_entity_map[body.handle]
            e.removeComponent(PhysicsComponent)
        })

        // clean up old collisions
        // we are assuming here that physics is the last system to register/run
        // and when run, any collision components are added in the event system
        // so every system that wants a chance to process a collision can do so
        // CONSIDER what about multiple collisions? How do we handle that?
        this.queries.colliders.results.forEach( e => {
            e.removeComponent(CollisionComponent)
        })

        this.queries.kinematic_characters.results.forEach( e => {
            // TODO step any kinematic character controllers?
        })

        this.physics_world.stepSimulation(delta , 2)
    }
 }

PhysicsSystem.queries = {
    uninitialized: { components: [LocRotComponent, BodyComponent, Not(PhysicsComponent)]},
    entities: { 
        components: [PhysicsComponent] ,
        listen: {
            removed: true
        }
    },
    updated_velocity: {
        components: [PhysicsComponent,ApplyVelocityComponent],
    },
    set_rotation: {
        components: [SetRotationComponent,PhysicsComponent],
    },
    kinematic_characters: {
        components: [PhysicsComponent,KinematicCharacterComponent]
    },
    colliders: {
        components: [CollisionComponent,PhysicsComponent],
    },
    remove: {
        components: [PhysicsComponent,Not(BodyComponent)]
    },
};


export class PhysicsMeshUpdateSystem extends System {
    execute(delta){
        let entities = this.queries.entities.results;
        entities.forEach( e => {
            const btBody = e.getComponent(PhysicsComponent).body
            const obj3d = e.getComponent(Obj3dComponent).obj
            const loc = e.getMutableComponent(LocRotComponent) 

            const btTransform = btBody.getCenterOfMassTransform()
            const pos = btTransform.getOrigin()
            obj3d.position.copy(new THREE.Vector3(pos.x(),pos.y(),pos.z()))
            const btQuat = btTransform.getRotation()
            obj3d.quaternion.copy(new THREE.Quaternion(btQuat.x(),btQuat.y(),btQuat.z(),btQuat.w()))

            // update our locrot component
            loc.location.x = pos.x()
            loc.location.y = pos.y()
            loc.location.z = pos.z()
            loc.rotation.x = obj3d.rotation.x
            loc.rotation.y = obj3d.rotation.y
            loc.rotation.z = obj3d.rotation.z
        })
    }
}

PhysicsMeshUpdateSystem.queries = {
  entities: { components: [PhysicsComponent, Obj3dComponent] }
};