import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls"
import { PhysicsComponent } from "../../core/components/physics"
import { MoverComponent } from "../components/movement"
import * as CANNON from "cannon-es"

export class MovementSystem extends System {
    execute(delta,time){
        this.queries.movers.results.forEach( e => {
            const actions =  e.getComponent(ActionListenerComponent).actions
            const body = e.getComponent(PhysicsComponent).body
            const mover = e.getComponent(MoverComponent)

            const v = new CANNON.Vec3()
            if(mover.move_z){
                if(actions.up){ v.z += actions.up }
                if(actions.down){ v.z -= actions.down }
            }else{
                if(actions.up){ v.y += actions.up }
                if(actions.down){ v.y -= actions.down }
            }
            if(actions.left){ v.x += actions.left }
            if(actions.right){ v.x -= actions.right }
            v.normalize()

            if( mover.local ){
                // TODO rotate v if local
            }

            if( mover.kinematic){
                body.velocity = v.scale(mover.speed)
            }else{
                body.applyForce(v.scale(mover.speed),body.position)
            }

        })
    }
}

MovementSystem.queries = {
    movers: {
        components: [ActionListenerComponent,PhysicsComponent,MoverComponent]
    }
}