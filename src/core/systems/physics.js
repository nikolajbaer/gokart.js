import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent, CollisionComponent, ApplyVelocityComponent, SetRotationComponent, KinematicColliderComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as THREE from "three"
import * as RAPIER from  '@dimforge/rapier3d-compat'
import { OnGroundComponent } from "../../common/components/movement.js";
import { DebugNormalComponent } from "../../common/components/debug.js";
import { Vector3 } from "three";

const BODYMAP = {}

const AXIS = {
    X: new THREE.Vector3(1,0,0),
    Y: new THREE.Vector3(0,1,0),
    Z: new THREE.Vector3(0,0,1),
}

export class PhysicsSystem extends System {
    init(attributes) {
        this.body_entity_map = {}

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
        this.body_entity_map[rigidBody.handle] = e
    }

    move_and_slide(e,delta){
        const body = e.getComponent(PhysicsComponent).body
        const body_def = e.getComponent(BodyComponent)

        if(!body.isKinematic){
            console.error("Warning: body needs to be kinematic to do move and slide. Removing kinematic collide component")
            e.removeComponent(KinematicColliderComponent)
            return
        }

        const kine = e.getMutableComponent(KinematicColliderComponent)

        let cur_vel = new THREE.Vector3(0,0,0)
        let apply_vel = null
        // If we have a velocity we want to change to
        if(e.hasComponent(ApplyVelocityComponent)){
            apply_vel = e.getMutableComponent(ApplyVelocityComponent)
            const vel = apply_vel.linear_velocity
            cur_vel.x = vel.x
            cur_vel.y = vel.y
            cur_vel.z = vel.z
        }else{
            // otherwise maintain our current velocity
            /*cur_vel.x = kine.velocity.x
            cur_vel.y = kine.velocity.y
            cur_vel.z = kine.velocity.z
            */
        }

        // Now check for collisions
        const cur_pos = body.translation()
        const cur_quat = body.rotation()
        let n_slides = 3;
        const speed = cur_vel.length()

        /* References
        https://discord.com/channels/507548572338880513/747935665076830259/840054007091298364
        https://github.com/godotengine/godot/blob/master/scene/3d/physics_body_3d.cpp#L849
        */        
        let next_pos = new THREE.Vector3().copy(cur_pos)
        let new_vel = new THREE.Vector3().copy(cur_vel)

        // start with current velocity and delta for next step
        let v = new THREE.Vector3().copy(cur_vel)
        let t = delta
        const shape = new RAPIER.Capsule(body_def.bounds.y/2,body_def.bounds.z/2)
    
        for(let slide = 0; slide < n_slides; slide++){
            // cast from cur_pos along v
            const result = this.physics_world.castShape(
                this.physics_world.colliders, // can we narrow this?
                cur_pos,
                cur_quat,
                v,
                shape,
                t,
                kine.collision_groups,
            )

            // If we have a collision, we need to adjust our next position
            if(result != null){
                const body_quat = new THREE.Quaternion().copy(body.rotation())
                const hit_body = this.physics_world.bodies.get(this.physics_world.colliders.get(result.colliderHandle).parent()) // who we hit.
                const hit_entity = this.body_entity_map[hit_body.handle]
                console.log("Hit",hit_entity.name)
                const hit_body_quat = new THREE.Quaternion().copy(hit_body.rotation())
                // normal2 is local to hit body, so we want to rotate it to world 
                const normal = new THREE.Vector3().copy(result.normal2).applyQuaternion(hit_body_quat).normalize()

                if(e.hasComponent(DebugNormalComponent)){
                    const debug = e.getMutableComponent(DebugNormalComponent)
                    debug.normal = new Vector3(normal.x,normal.y,normal.z)
                    debug.local_offset = new Vector3(result.witness1.x,result.witness1.y,result.witness1.z)
                }

                // determine if we are on the ground
                if(kine.max_slope != null){
                    // TODO get floor_velocity and set it on the OnGroundComponent here.
                    if(normal.dot(AXIS.Y) > kine.max_slope && !e.hasComponent(OnGroundComponent)){
                        console.log("on ground!")
                        e.addComponent(OnGroundComponent) 
                    }
                }

                // Collide
                // Adjust translation to point of collision
                next_pos.x += v.x * result.toi
                next_pos.y += v.y * result.toi
                next_pos.z += v.z * result.toi

                // and slide
                if(kine.slide){
                    /*
                    // Simplified example on jsfiddle
                    v0 = new THREE.Vector3(0,-4,0)
                    console.log(v0)
                    n = new THREE.Vector3(1,-1,0).normalize()
                    t = 1
                    t0 = 0.25
                    t1 = t - t0
                    vr = v0.multiplyScalar(t1/t)
                    console.log(vr)
                    n1 = n.multiplyScalar(vr.dot(n))
                    vs = vr.sub(n1)
                    console.log(vs)
                    vf = vs.multiplyScalar(1/t1)
                    console.log(vf)
                    */

                                        
                    const v0 = new THREE.Vector3().copy(v) // start with our current velocity
                    const n = new THREE.Vector3().copy(normal).normalize() // and normal of collision
                    const t0 = result.toi  
                    const t1 = t - t0 // the remaining time in this step
                    const vr = v0.multiplyScalar(t1) // our remaining movement is the portion after our hit
                    const n1 = n.multiplyScalar(vr.dot(n)) 
                    const vs = vr.sub(n1) // we slide perpendicular to the normal, and have our new "position" given the remaining time 
                    const vf = vs.multiplyScalar(1/t1) // but our collision shapecast expects velocity and time, so we turn this back into a velocity
                    t = t1  // set the time remaining for our next iteration
                    v = vf // and the new slide velocity for the next iteration

                    console.log(slide,"normal",normal,"vs",vs,"next-pos",next_pos,"v",v,t)
                    /*
                    const remaining = new THREE.Vector3().copy(v).multiplyScalar((t-result.toi))
                    const t1 = t-result.toi

                    // New position 
                    let remaining_pos = remaining.sub(normal.multiplyScalar(remaining.dot(normal)))

                    // TODO remaining_pos to velocity
                    v = remaining_pos.multiplyScalar(1/t1)
                    
                    // and new timescale to test against
                    t = t1 
                    //console.log(slide,cur_vel,"Sliding to ",v,t,result.normal2,hit_body.handle,body.handle)
                    */
                }else{
                    // no slide? then break, we have collided and stop here
                    console.log("collide and stop",slide)
                    break
                }
            }else{

                // If  we have no collision, just advance by our current velocity
                next_pos = new THREE.Vector3(
                    cur_pos.x + v.x * t,
                    cur_pos.y + v.y * t,
                    cur_pos.z + v.z * t
                )
                break
            }
        } 

        // update new position
        const nxt = new RAPIER.Vector3(next_pos.x,next_pos.y,next_pos.z)
        body.setNextKinematicTranslation(nxt)
        // preserve last velocity in case we have no new apply_vel component
        kine.velocity.x = v.x
        kine.velocity.y = v.y
        kine.velocity.z = v.z

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
            this.move_and_slide(e,delta)
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
            delete this.body_entity_map[body.handle]
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