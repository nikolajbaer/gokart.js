import { ApplyVelocityComponent, BodyComponent, KinematicCharacterComponent, CollisionComponent, PhysicsComponent, SetRotationComponent, PhysicsControllerComponent, JumpComponent  } from "../../src/core/components/physics.js"
import { PhysicsLocRotUpdateSystem, PhysicsMeshUpdateSystem, PhysicsSystem } from "../../src/core/systems/physics.js"
import { HeightfieldDataComponent } from "../core/components/heightfield.js"
import { BaseScene } from "./scene.js"
import { Vector3 } from "../core/ecs_types.js"

export class Physics3dScene extends BaseScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(BodyComponent)
        this.world.registerComponent(HeightfieldDataComponent)
        this.world.registerComponent(PhysicsComponent)
        this.world.registerComponent(PhysicsControllerComponent)
        this.world.registerComponent(CollisionComponent)
        this.world.registerComponent(ApplyVelocityComponent)
        this.world.registerComponent(SetRotationComponent)
        this.world.registerComponent(KinematicCharacterComponent)
        this.world.registerComponent(JumpComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(PhysicsMeshUpdateSystem)
        // TODO cleanup, but for now register this on a headless system
        //this.world.registerSystem(PhysicsLocRotUpdateSystem)
        this.world.registerSystem(PhysicsSystem, {
            collision_handler: (entity_a,entity_b,event) => this.handle_collision(entity_a,entity_b,event),
            contact_materials: this.contact_materials(),
            gravity: this.get_gravity(),
         })
    }

    handle_collision(entity_a,entity_b,contact){
        const bodyc_a = entity_a.getComponent(BodyComponent)
        const bodyc_b = entity_b.getComponent(BodyComponent)

        let contactNormal = new THREE.Vector3()
        let contactPoint = new THREE.Vector3()
        let collider = null
        let collided = null

        if(bodyc_a.track_collisions){
            collider = entity_a
            collided = entity_b
            if(contact){
                contact.ni.negate(contactNormal)
                contactPoint.copy(contact.bi)
            }
        }else if(bodyc_b.track_collisions){
            collider = entity_b
            collided = entity_a
            if(contact){
                contactNormal.copy(contact.ni)
                contactPoint.copy(contact.bj)
            }
        }

        if(collider){
            console.log(entity_a.name,entity_b.name,contact)
            if(collider.hasComponent(CollisionComponent)){
                const collision = collider.getMutableComponent(CollisionComponent)
                collision.entity = collided
                collision.contact_normal = new Vector3(contactNormal.x,contactNormal.y,contactNormal.z)
                collision.impact_velocity = contact.getImpactVelocityAlongNormal()
            }else{
                collider.addComponent(CollisionComponent,{
                    entity: collided,
                    contact_normal: new Vector3(contactNormal.x,contactNormal.y,contactNormal.z),
                    impact_velocity: contact.getImpactVelocityAlongNormal(),
                })
            }
        }
    }

    contact_materials(){
        return {}
    }

    get_gravity(){
        return -10
    }
}
