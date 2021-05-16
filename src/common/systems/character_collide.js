import { System } from "ecsy"
import { PhysicsComponent } from "../../core/components/physics"
import * as CANNON from "cannon-es"
import { CharacterCollideComponent } from "../components/character_collide"

// Collide and Slide Reference: https://docs.nvidia.com/gameworks/content/gameworkslibrary/physx/guide/Manual/CharacterControllers.html
const UP = new CANNON.Vec3(0,1,0)

export class CharacterCollideSystem extends System {
    execute(delta,time){
    }
}

CharacterCollideSystem.queries = {
    movers: {
        components: [PhysicsComponent,CharacterCollideComponent]
    }
}