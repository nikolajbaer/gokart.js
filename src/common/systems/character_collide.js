import { System } from "ecsy"
import { PhysicsComponent } from "../../core/components/physics"
import * as CANNON from "cannon-es"
import { CharacterCollideComponent } from "../components/character_collide"
import { OnGroundComponent } from "../components/movement"

// Collide and Slide Reference: https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/CharacterControllers.html
const UP = new CANNON.Vec3(0,1,0)

export class CharacterCollideSystem extends System {
    execute(delta,time){
        this.queries.characters.results.forEach( e => {
            const character = e.getComponent(CharacterCollideComponent)
            const body = e.getComponent(PhysicsComponent).body
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

                // Force us to be aligned vertically
                if(body.velocity.y <= 0 ){
                    body.position.y = point.y + character.offset_y
                    if(!e.hasComponent(OnGroundComponent)){
                        e.addComponent(OnGroundComponent)
                    }
                }

                // But we don't really know about horizontal collisions yet, do we
                // TODO OnGroundComponent
            }else if(character.gravity != null){
                //console.log(result)
                const g = new CANNON.Vec3()
                g.copy(body.velocity)
                g.y += character.gravity.y * delta
                body.velocity = g
                if(e.hasComponent(OnGroundComponent)){
                    console.log("leaving the ground")
                    e.removeComponent(OnGroundComponent)
                }
            }
        })
    }
}

CharacterCollideSystem.queries = {
    characters: {
        components: [PhysicsComponent,CharacterCollideComponent]
    }
}