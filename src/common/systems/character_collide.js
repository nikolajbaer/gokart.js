import { System } from "ecsy"
import { BodyComponent, PhysicsComponent } from "../../core/components/physics"
import { CharacterCollideComponent } from "../components/character_collide"
import { OnGroundComponent } from "../components/movement"

// Collide and Slide Reference: https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/CharacterControllers.html
//const UP = new CANNON.Vec3(0,1,0)

export class CharacterCollideSystem extends System {
    check_ground(e){
        const character = e.getComponent(CharacterCollideComponent)
        const body = e.getComponent(PhysicsComponent).body

        /*
        // RayCast to the ground
        const r_from = new CANNON.Vec3()
        const r_to = new CANNON.Vec3()
        r_from.copy(body.position)
        r_from.y += character.offset_y
        r_to.copy(body.position)
        r_to.y = r_to.y - character.offset_y
        const result = new CANNON.RaycastResult()
        if(body.world.raycastClosest(r_from,r_to,{collisionFilterMask: 1},result)){
            let normal = result.hitNormalWorld
            let point = result.hitPointWorld
            // TODO adjust raycast to current capsule foot normal

            // Force us to be aligned vertically
            if(body.velocity.y <= 0 && normal.dot(UP) > 0){
                body.position.y = point.y + character.offset_y
                if(!e.hasComponent(OnGroundComponent)){
                    e.addComponent(OnGroundComponent)
                }
            }

            // But we don't really know about horizontal collisions yet. Ideally we could
            // just do collision without evaluating physics to figure this out
            // but not so easy in CANNON
        }else{
            if(e.hasComponent(OnGroundComponent)){
                e.removeComponent(OnGroundComponent)
            }
        }
        */
    }

    check_walls(e,delta){
        /*
        const body = e.getComponent(PhysicsComponent).body
        const body_def = e.getComponent(BodyComponent)

        // Check if we run into something moving at our current velocity
        const r_from = new CANNON.Vec3()
        const r_to = new CANNON.Vec3()
        r_from.copy(body.position)
        r_to.copy(body.position)
        const vel = new CANNON.Vec3()
        vel.copy(body.velocity)
        vel.normalize()
        vel.scale(body.velocity.length()*delta + body_def.bounds.z)
        r_to.vadd(vel)

        const result = new CANNON.RaycastResult()
        if(body.world.raycastClosest(r_from,r_to,{collisionFilterMask: 1},result)){
            // If so, let's redirect our velocity perpendicular to the normal
            console.log("adjusting velocity due to collision")
            let normal = result.hitNormalWorld
            let point = result.hitPointWorld
            const v = new CANNON.Vec3()
            v.copy(point)  // where we intersect
            normal.normalize()
            normal.scale(body_def.bounds.z) // push back along normal by our z-width
            v.vadd(normal) // where we should end up
            const pos = new CANNON.Vec3()
            pos.copy(body.position)
            const newvel = v.vsub(pos).scale(1/delta)
            body.velocity.x = newvel.x
            body.velocity.z = newvel.z
            // leave y up to ground collider
        }
        */
    }

    execute(delta,time){
        this.queries.characters.results.forEach( e => {
            this.check_ground(e)
            this.check_walls(e,delta)
            /*if(!e.hasComponent(OnGroundComponent)){
                e.getComponent(PhysicsComponent).body.velocity.y += e.getComponent(CharacterCollideComponent).gravity.y * delta
            }*/
        })
    }
}

CharacterCollideSystem.queries = {
    characters: {
        components: [PhysicsComponent,CharacterCollideComponent]
    }
}
