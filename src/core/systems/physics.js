import { System, Not, Types, cloneClonable } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent, ApplyVelocityComponent, SetRotationComponent, KinematicCharacterComponent, PhysicsControllerComponent, JumpComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
import { OnGroundComponent } from "../../common/components/movement.js";
import AMMO from "ammo.js";
import { Vector3 } from "../ecs_types.js";

let Ammo = null

const AXIS = {
    X: new THREE.Vector3(1,0,0),
    Y: new THREE.Vector3(0,1,0),
    Z: new THREE.Vector3(0,0,1),
}

export class PhysicsSystem extends System {
    init(attributes) {
        // track Ammo.js body id of ghost to associate
        console.log("initing physics")
        this.ghost_entity_id_map = {}
   
        // we might preload Ammo and pass it in here
        if(attributes && attributes.ammo){
            Ammo = attributes.ammo
            this.init_ammo()
        }else{
            new AMMO().then((_ammo)  => {
                Ammo = _ammo
                this.init_ammo()
            })
        }

        if(attributes && attributes.collision_handler){
            this.collision_handler = attributes.collision_handler
        }else{
            this.collision_handler = null
        }
    }

    init_ammo(){
        const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
        const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
        const overlappingPairCache = new Ammo.btDbvtBroadphase()
        const solver = new Ammo.btSequentialImpulseConstraintSolver()
        this.physics_world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration)
        this.physics_world.setGravity(new Ammo.btVector3(0, -10, 0));
    }

    create_heightfield_shape(e,body,locrot,quat){
        const hfield = e.getComponent(HeightfieldDataComponent)

        // Reference https://github.com/kripken/Ammo.js/blob/main/examples/webgl_demo_terrain/index.html#L238
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
        const AmmoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

        // Copy the javascript height data array to the Ammo one.
        var p = 0;
        var p2 = 0;
        for ( var j = 0; j < terrainDepth; j ++ ) {
            for ( var i = 0; i < terrainWidth; i ++ ) {

                // write 32-bit float data to memory
                Ammo.HEAPF32[AmmoHeightData + p2 >> 2] = heightData[ p ];

                p ++;

                // 4 bytes/float
                p2 += 4;
            }
        }

        // Creates the heightfield physics shape
        var heightFieldShape = new Ammo.btHeightfieldTerrainShape(
            terrainWidth,
            terrainDepth,
            AmmoHeightData,
            heightScale,
            terrainMinHeight,
            terrainMaxHeight,
            upAxis,
            hdt,
            flipQuadEdges
        );

        heightFieldShape.setLocalScaling( new Ammo.btVector3( hfield.scale.x/(terrainWidth-1), hfield.scale.y, hfield.scale.z/(terrainDepth-1) ) );
        heightFieldShape.setMargin( 0.05 );
        //console.log("Creating Heightfield Shape",heightFieldShape,"from",AmmoHeightData)

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
                shape = new Ammo.btCylinderShape(new Ammo.btVector3(body.bounds.x/2, body.bounds.y/2, body.bounds.z/2))
                break
            case BodyComponent.CAPSULE_TYPE:
                shape = new Ammo.btCapsuleShape(body.bounds.z/2, body.bounds.y)
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
        // https://discourse.threejs.org/t/Ammo-js-with-three-js/12530/36

        if( e.hasComponent(KinematicCharacterComponent)){
            if(!e.hasComponent(PhysicsControllerComponent) && body.body_type == BodyComponent.KINEMATIC_CHARACTER ){
                this.create_kinematic_character_controller(shape,e,transform)
            }
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
            this.physics_world.addRigidBody(btBody, 1, -1)

            // consider do i need to clean up colliders?
            btBody.entity = e
            e.addComponent(PhysicsComponent, { body: btBody })

            // TODO figure out how to link up entity to body in Ammo.js
            //this.body_entity_map[body.debugBodyId] = e 

        }
    }

    create_kinematic_character_controller(shape,e,transform){
        const body = e.getComponent(BodyComponent)

         // https://github.com/enable3d/enable3d/blob/kinematicCharacterController/packages/enable3d/src/AmmoWrapper/kinematicCharacterController.ts#L32

        // https://github.com/kripken/Ammo.js/issues/254
        const kchar = e.getComponent(KinematicCharacterComponent)
        const ghost = new Ammo.btPairCachingGhostObject();
        ghost.setWorldTransform(transform);
        ghost.setCollisionShape(shape);
        // TODO refine
        //ghost.setCcdMotionThreshold(0.01)
        //ghost.setCcdSweepSphereRadius(1)

        ghost.setCollisionFlags(ghost.getCollisionFlags() | 16 ); // CF_CHARACTER_OBJECT
        //this.overlappingPairCache.getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
        this.physics_world.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback())

        const controller = new Ammo.btKinematicCharacterController(ghost, shape, kchar.step_height, 1);
        //controller.setUseGhostSweepTest(true)
        controller.setGravity(kchar.gravity) // default 9.8*3
        controller.setFallSpeed(kchar.gravity*2)
        controller.setJumpSpeed(kchar.jump_speed)
        /*
        controller.setMaxSlope(kchar.max_slope) // default Math.PI / 4
        */ 
        this.physics_world.addCollisionObject(ghost, 32, -1)
        this.physics_world.addAction(controller)

        controller.entity = e
        ghost.entity = e
        // Sadly this does not appear to persist in the body showing up for collisions
        // so we need to manually associate this
        this.ghost_entity_id_map[ghost.a] = e
        //console.log("Ghost",ghost,controller,e)

        // consider do i need to clean up colliders?
        // TODO where do I store this kinematic controller action? 
        e.addComponent(PhysicsControllerComponent, { ctrl: controller,ghost: ghost })
    }

    // https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-Ammo-js-and-three-js-31a5569291ef
    update_collisions(){
        let dispatcher = this.physics_world.getDispatcher()
        let numManifolds = dispatcher.getNumManifolds()

        const entities = {}
        for( let i=0;i<numManifolds; i++){
            const contactManifold = dispatcher.getManifoldByIndexInternal( i )
            const numContacts = contactManifold.getNumContacts()
            const rb0 = Ammo.castObject( contactManifold.getBody0(), Ammo.btRigidBody )
            const rb1 = Ammo.castObject( contactManifold.getBody1(), Ammo.btRigidBody )
            let en0 = rb0.entity
            let en1 = rb1.entity

            // associate ghost entities since they seem to get lost along the way
            if(!en0 && this.ghost_entity_id_map[rb0.a])
                rb0.entity = this.ghost_entity_id_map[rb0.a]
                en0 = rb0.entity
            if(!en1 && this.ghost_entity_id_map[rb1.a])
                rb1.entity = this.ghost_entity_id_map[rb1.a]
                en1 = rb1.entity

            // make sure we have associated entities
            if( !en0 && !en1 ){ continue }
          
            // if we are not tracking collisions on either of these 
            let phys0 = null
            let phys1 = null
            if(en0){
                phys0 = en0.getComponent(BodyComponent)
            }
            if(en1){
                phys1 = en1.getComponent(BodyComponent)
            }
            // if we have no attached entitites or neither entity is tracking collisions, continue
            if(!phys0 && !phys1) continue
            if(!phys0 && (phys1 && !phys1.track_collisions)) continue
            if(!phys1 && (phys0 && !phys0.track_collisions)) continue
            if((phys0 && !phys0.track_collisions) && (phys1 && !phys1.track_collisions)) continue

            // at least one entity is tracking collisions
            const velocity0 = rb0.getLinearVelocity()
            const velocity1 = rb1.getLinearVelocity()

            // NOTE how do we handle multiple collisions?
            for ( let j = 0; j < numContacts; j++ ) {
                const contactPoint = contactManifold.getContactPoint( j )
                const worldPos0 = contactPoint.get_m_positionWorldOnA()
                const worldPos1 = contactPoint.get_m_positionWorldOnB()
                const localPos0 = contactPoint.get_m_localPointA()
                const localPos1 = contactPoint.get_m_localPointB()
                const normal = contactPoint.get_m_normalWorldOnB()
                const distance = contactPoint.getDistance();
                if(distance > 0.0){ continue }

                if(phys0 && phys0.track_collisions){
                    if(!entities[en0.id]){
                        entities[en0.id] = {e:en0,c:[]}
                    }
                    entities[en0.id].c.push({
                        entity: en1?en1:null,
                        contact_point: new Vector3(worldPos0.x,worldPos0.y,worldPos0.z),
                        contact_normal: new Vector3(-normal.x,-normal.y,-normal.z),
                        velocity: velocity0, // TODO make impact velocity
                    })
                }
                if(phys1 && phys1.track_collisions){
                    if(!entities[en1.id]){
                        entities[en1.id] = {e:en1,c:[]} 
                    }
                    entities[en1.id].c.push({
                        entity: en0?en0:null,
                        contact_point: new Vector3(worldPos1.x,worldPos1.y,worldPos1.z),
                        contact_normal: new Vector3(normal.x,normal.y,normal.z),
                        velocity: velocity1, // TODO make impact velocity
                    })
                }
            }
        }

        for(let eid in entities){
            entities[eid].e.addComponent(CollisionComponent,{collisions:entities[eid].c})
        }
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
        this.queries.remove_bodies.results.forEach( e => {
            const body = e.getComponent(PhysicsComponent).body
            body.entity = null
            this.physics_world.removeRigidBody(body)
            Ammo.destroy(body)
            e.removeComponent(PhysicsComponent)
        })

        this.queries.remove_controllers.results.forEach( e => {
            const p_ctrl = e.getComponent(PhysicsControllerComponent)
            
            // ISSUE the ghost/ctrl aren't being preserved, so i guess
            // we aren't really removing them. Need to figure out how to get this
            // actual body removed?
            delete this.ghost_entity_id_map[p_ctrl.ghost.a]
            this.physics_world.removeRigidBody(p_ctrl.ghost)
            Ammo.destroy(p_ctrl.ghost)
            this.physics_world.removeAction(p_ctrl.ctrl)
            Ammo.destroy(p_ctrl.ctrl)
            e.removeComponent(PhysicsControllerComponent)
        })

        this.queries.kinematic_characters.results.forEach( e => {
            // TODO step any kinematic character controllers?
            const kchar = e.getComponent(KinematicCharacterComponent)
            const pctrl = e.getComponent(PhysicsControllerComponent)
            const ctrl = pctrl.ctrl
            const ghost = pctrl.ghost

            if(e.hasComponent(ApplyVelocityComponent)){
                const vel = e.getComponent(ApplyVelocityComponent)
                const v = vel.linear_velocity
                ctrl.setWalkDirection( new Ammo.btVector3(v.x,v.y,v.z) )
                e.removeComponent(ApplyVelocityComponent)
            }

            // CONSIDER combine with phyics body setrotation?
            if(e.hasComponent(SetRotationComponent)){
                const rot = e.getComponent(SetRotationComponent)

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

                const tr = ghost.getWorldTransform()
                const btquat = new Ammo.btQuaternion(quat.x,quat.y,quat.z,quat.w)
                tr.setRotation(btquat)
                ghost.setWorldTransform(tr)

                e.removeComponent(SetRotationComponent) 
            }

            if(ctrl.onGround()){
                if(!e.hasComponent(OnGroundComponent)){
                    e.addComponent(OnGroundComponent) 
                }
                if(e.hasComponent(JumpComponent)){
                    const jump = e.getMutableComponent(JumpComponent) 
                    if(jump.started == null){
                        ctrl.jump()
                        jump.started = time
                    }else{
                        e.removeComponent(JumpComponent)
                    }
                }
            }else{
                if(e.hasComponent(OnGroundComponent)){
                    e.removeComponent(OnGroundComponent)
                }
            }

            if(kchar.rigid_body_impulse && e.hasComponent(CollisionComponent)){
                const collisions = e.getComponent(CollisionComponent).collisions
                const touched = {} 
                collisions.forEach( c => {
                    if(c.entity.id in touched) return
                    const b1 = c.entity.getComponent(PhysicsComponent).body
                    if(b1.isStaticObject() || b1.isKinematicObject()){  // ignore static and kinematic bodies
                        touched[c.entity.id] = true
                        return
                    }
                    const v = kchar.rigid_body_impulse
                    const vi = new Ammo.btVector3(c.contact_normal.x * v,c.contact_normal.y * v,c.contact_normal.z * v)
                    const vp = new Ammo.btVector3(c.contact_point.x,c.contact_point.y,c.contact_point.z)
                    //console.log("Apply impulse to ",c.entity,vi,vp)
                    b1.applyImpulse(vi,vp)
                    touched[c.entity.id] = true
                })
            }
        })

        // clean up old collisions
        // we are assuming here that physics is the last system to register/run
        // and when run, any collision components are added in the event system
        // so every system that wants a chance to process a collision can do so
        // CONSIDER what about multiple collisions? How do we handle that?
        this.queries.colliders.results.forEach( e => {
            e.removeComponent(CollisionComponent)
        })
        // Step
        this.physics_world.stepSimulation(delta , 5)
        // prepare new collisions for next systems tick
        this.update_collisions()
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
        components: [PhysicsControllerComponent,KinematicCharacterComponent]
    },
    colliders: {
        components: [CollisionComponent],
    },
    remove_bodies: {
        components: [PhysicsComponent,Not(BodyComponent)]
    },
    remove_controllers: {
        components: [PhysicsControllerComponent,Not(KinematicCharacterComponent)]
    },
};


export class PhysicsMeshUpdateSystem extends System {
    update_entity(e,body){
        const obj3d = e.getComponent(Obj3dComponent).obj
        const loc = e.getMutableComponent(LocRotComponent) 

        const btTransform = body.getWorldTransform() //.getCenterOfMassTransform()
        const pos = btTransform.getOrigin()
        obj3d.position.copy(new THREE.Vector3(pos.x(),pos.y(),pos.z()))
        const btQuat = btTransform.getRotation()
        obj3d.quaternion.copy(new THREE.Quaternion(btQuat.x(),btQuat.y(),btQuat.z(),btQuat.w()))

        // update our locrot component
        loc.location.x = pos.x()
        loc.location.y = pos.y()
        loc.location.z = pos.z()

        const euler = new THREE.Euler()
        euler.setFromQuaternion(obj3d.quaternion,'YZX')
        loc.rotation.x = euler.x
        loc.rotation.y = euler.y
        loc.rotation.z = euler.z
    }

    execute(delta){
        this.queries.body_entities.results.forEach( e => {
            this.update_entity(e,e.getComponent(PhysicsComponent).body)
        })

        this.queries.ctrl_entities.results.forEach( e => {
            this.update_entity(e,e.getComponent(PhysicsControllerComponent).ghost)
        })
    }
}

PhysicsMeshUpdateSystem.queries = {
  body_entities: { components: [PhysicsComponent, Obj3dComponent] },
  ctrl_entities: { components: [PhysicsControllerComponent, Obj3dComponent] }
};

// TODO make this a bitless duplicated 
export class PhysicsLocRotUpdateSystem extends System {
    update_entity(e,body){
        const loc = e.getMutableComponent(LocRotComponent) 

        const btTransform = body.getWorldTransform() //.getCenterOfMassTransform()
        const pos = btTransform.getOrigin()
        const btQuat = btTransform.getRotation()

        // update our locrot component
        loc.location.x = pos.x()
        loc.location.y = pos.y()
        loc.location.z = pos.z()

        const threeQuat = new THREE.Quaternion(btQuat.x(),btQuat.y(),btQuat.z(),btQuat.w())
        const euler = new THREE.Euler()
        euler.setFromQuaternion(threeQuat,'YZX')
        loc.rotation.x = euler.x
        loc.rotation.y = euler.y
        loc.rotation.z = euler.z
    }

    execute(delta){
        this.queries.body_entities.results.forEach( e => {
            this.update_entity(e,e.getComponent(PhysicsComponent).body)
        })

        this.queries.ctrl_entities.results.forEach( e => {
            this.update_entity(e,e.getComponent(PhysicsControllerComponent).ghost)
        })
    }
}

PhysicsLocRotUpdateSystem.queries = {
  body_entities: { components: [PhysicsComponent, LocRotComponent] },
  ctrl_entities: { components: [PhysicsControllerComponent, LocRotComponent] }
};