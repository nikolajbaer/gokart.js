import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
import * as RAPIER from  '@dimforge/rapier3d-compat'

const BODYMAP = {}

export class PhysicsSystem extends System {
    init(attributes) {
        RAPIER.init().then( () => {
            RAPIER = RAPIER
            let gravity = new RAPIER.Vector3(0,-10,0)
            this.physics_world = new RAPIER.World(gravity)

            if(attributes && attributes.contact_materials){
                this.contact_materials = attributes.contact_materials
            }else{
                this.contact_materials = {}
            }

            BODYMAP[BodyComponent.DYNAMIC] = RAPIER.BodyStatus.Dynamic
            BODYMAP[BodyComponent.STATIC] = RAPIER.BodyStatus.Static
            BODYMAP[BodyComponent.KINEMATIC] = RAPIER.BodyStatus.KINEMATIC

        })

        if(attributes && attributes.collision_handler){
            this.collision_handler = attributes.collision_handler
        }else{
            this.collision_handler = null
        }
    }

    create_physics_body(e){
        const body = e.getComponent(BodyComponent)
        const locrot = e.getComponent(LocRotComponent)

        const quat = new THREE.Quaternion()
        quat.setFromEuler(new THREE.Euler(locrot.x,locrot.y,locrot.z,'YZX'))

        let rigidBodyDesc = new RAPIER.RigidBodyDesc(BODYMAP[body.type])
                .setTranslation(locrot.location.x,locrot.location.y,locrot.location.z)
                .setRotation(quat)
        let rigidBody = this.physics_world.createRigidBody(rigidBodyDesc)
        let colliderDesc = new RAPIER.ColliderDesc.cuboid(body.bounds.x, body.bounds.y, body.bounds.z)
                .setDensity(2.0); // The default density is 1.0.
        let collider = this.physics_world.createCollider(colliderDesc, rigidBody.handle);

        e.addComponent(PhysicsComponent, { body: rigidBody })

        /*
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(locrot.rotation.x,locrot.rotation.y,locrot.rotation.z)

        let shape = null
        switch(body.bounds_type){
            case BodyComponent.BOX_TYPE:
                shape = new CANNON.Box(new CANNON.Vec3(body.bounds.x/2,body.bounds.y/2,body.bounds.z/2))
                break;
            case BodyComponent.PLANE_TYPE:
                shape = new CANNON.Plane()
                break;
            case BodyComponent.CYLINDER_TYPE:
                shape = new CANNON.Cylinder(body.bounds.x/2,body.bounds.x/2,body.bounds.y)
                break;
            case BodyComponent.HEIGHTFIELD_TYPE:
                if(!e.hasComponent(HeightfieldDataComponent)){ 
                    console.error("height field bodies must have a HeightfieldDataComponent, defaulting to a Plane") 
                    shape = new CANNON.Plane()
                }else{
                    const hfield = e.getComponent(HeightfieldDataComponent)
                    shape = new CANNON.Heightfield(hfield.data, { elementSize: hfield.element_size })
                    console.log(shape)
                }
                break
            default:
                shape = new CANNON.Sphere(body.bounds.x/2)
                break;
        }
        const mat = this.contact_materials[body.material]
        const body1  = new CANNON.Body({
            mass: body.mass, //mass
            material: mat,
            position: new CANNON.Vec3(locrot.location.x,locrot.location.y,locrot.location.z),
            quaternion: quat,
            type: body.body_type,
            velocity: new CANNON.Vec3(body.velocity.x,body.velocity.y,body.velocity.z),
            fixedRotation: body.fixed_rotation,
            collisionFilterGroup: body.collision_group,
        })
        if( body.fixed_rotation ){
            body1.updateMassProperties()
        }
        body1.linearDamping = 0.01
        body1.addShape(shape)
        body1.ecsy_entity = e // back reference for processing collisions
        if( body.track_collisions && this.collision_handler){ 
            body1.addEventListener("collide", event => {
                this.collision_handler(event.target.ecsy_entity,event.body.ecsy_entity,event.contact)
            })
        }

        this.physics_world.addBody(body1) 
        e.addComponent(PhysicsComponent, { body: body1 })
        */
    }

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized.results.forEach( e => {
            this.create_physics_body(e)
        })

        // todo then remove any removed bodies
        this.queries.remove.results.forEach( e => {
            const body = e.getComponent(PhysicsComponent).body
            body.ecsy_entity = null // clear back reference
            //this.physics_world.removeBody(body)
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

        this.physics_world.step()
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
            const body = e.getComponent(PhysicsComponent).body
            const obj3d = e.getComponent(Obj3dComponent).obj
            const loc = e.getMutableComponent(LocRotComponent) 
            const pos = body.translation()

            obj3d.position.copy(pos)
            obj3d.quaternion.copy(body.rotation())

            // update our locrot component
            loc.location.x = pos.x
            loc.location.y = pos.y
            loc.location.z = pos.z
            loc.rotation.x = obj3d.rotation.x
            loc.rotation.y = obj3d.rotation.y
            loc.rotation.z = obj3d.rotation.z
        })
    }
}

PhysicsMeshUpdateSystem.queries = {
  entities: { components: [PhysicsComponent, Obj3dComponent] }
};