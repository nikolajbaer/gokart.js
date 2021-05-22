import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent, ApplyVelocityComponent, SetRotationComponent, KinematicColliderComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
import * as RAPIER from  '@dimforge/rapier3d-compat'
import { OnGroundComponent } from "../../common/components/movement.js";

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
        const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(locrot.rotation.x,locrot.rotation.y,locrot.rotation.z,'YZX'))
        const rquat = new RAPIER.Quaternion(quat.x,quat.y,quat.z,quat.w)
 
        let rigidBodyDesc = new RAPIER.RigidBodyDesc(BODYMAP[body.body_type])
        rigidBodyDesc.setTranslation(locrot.location.x,locrot.location.y,locrot.location.z)
        rigidBodyDesc.setRotation(rquat)
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

        colliderDesc.setCollisionGroups(body.collision_groups)

        let collider = this.physics_world.createCollider(colliderDesc, rigidBody.handle)

        // consider do i need to clean up colliders?
        e.addComponent(PhysicsComponent, { body: rigidBody })
    }

    handle_kinematic_collider(e,delta){
        const body = e.getComponent(PhysicsComponent).body
        const body_def = e.getComponent(BodyComponent)

        if(!body.isKinematic){
            console.error("Warning: body needs to be kinematic to do collide and slide. Removing kinematic collide component")
            e.removeComponent(KinematicColliderComponent)
            return
        }

        const kine = e.getMutableComponent(KinematicColliderComponent)

        const v = new RAPIER.Vector3(0,0,0)
        let apply_vel = null
        // If we have a velocity we want to change to
        if(e.hasComponent(ApplyVelocityComponent)){
            apply_vel = e.getMutableComponent(ApplyVelocityComponent)
            const vel = apply_vel.linear_velocity
            v.x = vel.x
            v.y = vel.y
            v.z = vel.z
        }else{
            // otherwise maintain our current velocity
            v.x = kine.velocity.x
            v.y = kine.velocity.y
            v.z = kine.velocity.z
        }

        // Now check for collisions
        const cur_pos = body.translation()
        const cur_quat = body.rotation()
        const result = this.physics_world.castShape(
            this.physics_world.colliders, // can we narrow this?
            cur_pos,
            cur_quat,
            v,
            new RAPIER.Capsule(body_def.bounds.y/2,body_def.bounds.z/2),
            delta,
            kine.collision_groups,
        )
/*
https://discord.com/channels/507548572338880513/747935665076830259/840054007091298364

if the angle of the contact normal is at most 45 degrees from your up-axis, then you can say that the ground is a floor, and treat it as such
in my character controller, floors are handled pretty simply; the character's movement vector is computed to be in the plane defined by the normal of the floor
if the character collides with a non-floor while walking on a floor, then their remaining movement is projected onto the "seam" between the two planes; i.e., the line formed by the cross product of the floor normal and the non-floor's normal
that will allow you to slide along walls while walking on floors
generally, the way to move a kinematic character controller is with iterative sweeps; you take your movement vector for the current frame, cast your shape forward, and if there's a collision, move the character to the point of collision and project the remaining movement into some new direction and continue until your movement is resolved or some iteration limit is reached
the easiest solution is to project the remaining movement vector into the collision plane, although sometimes a different projection is useful (e.g. the cross-product I mentioned above)
*/

        // If we have a collision, we need to adjust our next position
        if(result != null){
            const body_quat = new THREE.Quaternion().copy(body.rotation())

            // determine if we are on the ground
            if(kine.max_slope != null){
                const normal = new THREE.Vector3().copy(result.normal2).applyQuaternion(body_quat)
                if(normal.dot(AXIS.Y) > kine.max_slope && !e.hasComponent(OnGroundComponent)){
                    console.log("on ground!")
                    e.addComponent(OnGroundComponent) 
                }
            }

            // Adjust translation to point of collision
            let next_pos = null

            next_pos = new RAPIER.Vector3(
                cur_pos.x + (v.x * result.toi),
                cur_pos.y + (v.y * result.toi),
                cur_pos.z + (v.z * result.toi)
            )

            // I guess iterate a few times and cast shape?

            console.log("colliding at ",result.toi/delta, " of delta")
            // If we are sliding, then transmit remaining velocity into a slide as the cross
            // of 
            if(kine.slide){
                const remaining = new RAPIER.Vector3(
                    v.x * (delta-result.toi),
                    v.y * (delta-result.toi),
                    v.z * (delta-result.toi),
                )
                // slide remaining moment
            }
           
            body.setNextKinematicTranslation(next_pos)
        }else{
            // If  we have no collision, just advance by our current velocity
            let next_pos = new RAPIER.Vector3(
                cur_pos.x + v.x * delta,
                cur_pos.y + v.y * delta,
                cur_pos.z + v.z * delta
            )
            body.setNextKinematicTranslation(next_pos)
        }
       
        if(apply_vel != null){
            e.removeComponent(ApplyVelocityComponent)
        }
    }    

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized.results.forEach( e => {
            this.create_physics_body(e)
        })

        this.queries.kinematic_colliders.results.forEach( e => {
            // Use handler to process kinematic collider to allow for custom functionality
            // CONSIDER would be nice to have this housed elsewhere
            // MAybe process shapecast component after physics tick
            // and create component update on that to be processed later?
            this.handle_kinematic_collider(e,delta)
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
    kinematic_colliders: {
        components: [PhysicsComponent,KinematicColliderComponent]
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