import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls"
import { PhysicsComponent } from "../../core/components/physics"
import { MotionComponent, MoverComponent } from "../components/movement"
import * as CANNON from "cannon-es"

// TODO break out into different movement types/systems (e.g. turner, strafer, jumper, globalmover )
export class MovementSystem extends System {
    execute(delta,time){
        this.queries.movers.results.forEach( e => {
            const actions =  e.getComponent(ActionListenerComponent).actions
            const body = e.getComponent(PhysicsComponent).body
            const mover = e.getMutableComponent(MoverComponent)

            const v = new CANNON.Vec3()
            if(mover.move_z){
                if(actions.up){ v.z += actions.up }
                if(actions.down){ v.z -= actions.down }
            }else{
                if(actions.up){ v.y += actions.up }
                if(actions.down){ v.y -= actions.down }
            }

            if(mover.turner){
                // turnspeed
                let av = 0
                if(actions.left){ av = 1
                }else if(actions.right){ av = -1
                }

                if(mover.move_z){
                    body.angularVelocity.y = mover.turn_speed * av
                }else{
                    body.angularVelocity.z = mover.turn_speed * av
                }
            }else{
                if(actions.left){ v.x += actions.left }
                if(actions.right){ v.x -= actions.right }
            }
            v.normalize()

            const speed = actions.shift?mover.speed*mover.run_mult:mover.speed
            let vel = v.scale(speed)

            if( mover.local ){
                // TODO rotate v if local
                vel = body.quaternion.vmult(vel)
            }

            // special case
            mover.current_reverse = (v.z < 0)

            if( mover.kinematic){
                body.velocity = vel
                if(actions.shift){
                    mover.current = "run"
                }else if(v.length() > 0){
                    mover.current = "walk"
                }else{
                    mover.current = "rest"
                }
            }else{
                body.applyForce(vel,body.position)
            }

        })
    }
}

MovementSystem.queries = {
    movers: {
        components: [ActionListenerComponent,PhysicsComponent,MoverComponent]
    }
}