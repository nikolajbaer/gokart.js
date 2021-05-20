import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent, ApplyVelocityComponent, SetRotationComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
import * as RAPIER from  '@dimforge/rapier3d-compat'

const BODYMAP = {}

const AXIS = {
    X: new THREE.Vector3(1,0,0),
    Y: new THREE.Vector3(0,1,0),
    Z: new THREE.Vector3(0,0,1),
}

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
            BODYMAP[BodyComponent.KINEMATIC] = RAPIER.BodyStatus.Kinematic

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

        let rigidBodyDesc = new RAPIER.RigidBodyDesc(BODYMAP[body.body_type])
                .setTranslation(locrot.location.x,locrot.location.y,locrot.location.z)
        let rigidBody = this.physics_world.createRigidBody(rigidBodyDesc)
        let colliderDesc = null

        switch(body.bounds_type){
            case BodyComponent.SPHERE_TYPE:
                colliderDesc = new RAPIER.ColliderDesc.ball(body.bounds.x/2)
                break
            case BodyComponent.CYLINDER_TYPE:
                colliderDesc = new RAPIER.ColliderDesc.cylinder(body.bounds.y/2, body.bounds.z/2)
                break
            case BodyComponent.CAPSULE_TYPE:
                colliderDesc = new RAPIER.ColliderDesc.capsule(body.bounds.y/2, body.bounds.z/2)
                break
            case BodyComponent.HEIGHTFIELD_TYPE:
                if(!e.hasComponent(HeightfieldDataComponent)){ 
                    console.error("height field bodies must have a HeightfieldDataComponent, defaulting to a Plane") 
                }else{
                    const hfield = e.getComponent(HeightfieldDataComponent)
                    colliderDesc = new RAPIER.ColliderDesc.heightfield(
                        hfield.width - 1,
                        hfield.height - 1,
                        hfield.data, // column major order
                        new RAPIER.Vector3(
                            hfield.scale.x,
                            hfield.scale.y,
                            hfield.scale.z
                        )
                    )
                }
                break
            case BodyComponent.BOX_TYPE:
                colliderDesc = new RAPIER.ColliderDesc.cuboid(body.bounds.x/2, body.bounds.y/2, body.bounds.z/2)
                break
            default:
                console.error("Unknown body type",body.body_type)
                e.removeComponent(BodyComponent)
                break
        }

        const quat = new THREE.Quaternion()
        quat.setFromEuler(new THREE.Euler(locrot.x,locrot.y,locrot.z,'YZX'))
        const rquat = new RAPIER.Quaternion(quat.x,quat.y,quat.z,quat.w)
        colliderDesc.setRotation(rquat)

        let collider = this.physics_world.createCollider(colliderDesc, rigidBody.handle)
        // consider do i need to clean up colliders?
        e.addComponent(PhysicsComponent, { body: rigidBody })

    }

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized.results.forEach( e => {
            this.create_physics_body(e)
        })

        this.queries.updated_velocity.results.forEach( e => {
            let body = e.getComponent(PhysicsComponent).body
            let vel = e.getComponent(ApplyVelocityComponent)
            if(vel.linear_velocity != null){
                const lv = new RAPIER.Vector3(vel.linear_velocity.x,vel.linear_velocity.y,vel.linear_velocity.z)
                if(body.isKinematic){
                    const next_pos = new RAPIER.Vector3(
                        body.translation().x + vel.linear_velocity.x * delta,
                        body.translation().y + vel.linear_velocity.y * delta,
                        body.translation().z + vel.linear_velocity.z * delta
                    )
                    body.setNextKinematicTranslation(next_pos)
                }else{
                    body.setLinvel(lv,true)
                }
            }
            if(vel.angular_velocity != null){
                const av = new RAPIER.Vector3(vel.angular_velocity.x,vel.angular_velocity.y,vel.angular_velocity.z)
                if(body.isKinematic){

                }else{
                    body.setAngvel(av,true)
                }
            }
            e.removeComponent(ApplyVelocityComponent)
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
            if(body.isKinematic){
                body.setNextKinematicRotation(quat)
            }else{
                body.setRotation(quat)
            }
            e.removeComponent(SetRotationComponent)
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
    updated_velocity: {
        components: [PhysicsComponent,ApplyVelocityComponent],
    },
    set_rotation: {
        components: [SetRotationComponent,PhysicsComponent],
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