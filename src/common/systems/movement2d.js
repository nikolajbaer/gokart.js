import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls"
import { Physics2dComponent } from "../../core/components/physics2d"
import { MoverComponent } from "../components/movement"
import * as pl from "planck-js"

export class Movement2dSystem extends System {
    execute(delta,time){
        this.queries.movers.results.forEach( e => {
            const actions =  e.getComponent(ActionListenerComponent).actions
            const body = e.getComponent(Physics2dComponent).body
            const mover = e.getMutableComponent(MoverComponent)

            const v = new pl.Vec2(0,0)

            if(actions.up){ v.y += actions.up }
            if(actions.down){ v.y -= actions.down }
            if(mover.turner){
                let av = 0
                if(actions.left){ av = 1
                }else if(actions.right){ av = -1 }
                body.setAngularVelocity(av * mover.turn_speed)
                if(av>0){ console.log(body.getAngle()* (180/Math.PI)) }
            }else{
                if(actions.left){ v.x += actions.left }
                if(actions.right){ v.x -= actions.right }
            }
            v.normalize()

            const speed = actions.shift?mover.speed*mover.run_mult:mover.speed
            v.mul(speed)

            if(mover.local){
                const a = body.getAngle()
                v.x = Math.cos(a) * v.x - Math.sin(a) * v.y
                v.y = Math.sin(a) * v.x + Math.cos(a) * v.y
                console.log(180/Math.PI*a,v)
            }

            if( mover.kinematic ){
                // set velocity 
                body.setLinearVelocity(v)
                if(actions.shift){
                    mover.current = "run"
                }else if(v.length() > 0){
                    mover.current = "walk"
                }else{
                    mover.current = "rest"
                }
            }else{
                body.applyForce(v,body.getPosition())
            }

        })
    }
}

Movement2dSystem.queries = {
    movers: {
        components: [ActionListenerComponent,Physics2dComponent,MoverComponent]
    }
}