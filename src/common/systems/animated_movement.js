import { System } from "ecsy"
import { AnimatedComponent, PlayActionComponent } from "../../core/components/animated"
import { AnimatedMovementComponent } from "../components/animated_movement"
import { MoverComponent } from "../components/movement"

export class AnimatedMovementSystem extends System {

    play_action(e,anim,action,blend_time,playback_speed,loop){
        if(anim.current_action != action){
            if(e.hasComponent(PlayActionComponent)){
                const p = e.getMutableComponent(PlayActionComponent)
                p.action = action
                p.blend = blend_time
                p.playback_speed = playback_speed
                p.loop = loop
            }else{
                e.addComponent(PlayActionComponent,{
                    action:action,
                    blend:blend_time,
                    playback_speed:playback_speed,
                    loop: loop,
                })
            }
        }
    }

    execute(delta, time){
        this.queries.animated.results.forEach( e => {
            const anim = e.getComponent(AnimatedComponent) 
            const mover = e.getComponent(MoverComponent)
            const anim_move = e.getComponent(AnimatedMovementComponent)
            if(anim_move[mover.current]){
                let playback_speed = (mover.current == "run" && anim_move.run_speedup > 1)?anim_move.run_speedup:1
                if(anim_move.reverse_if_backwards && mover.current_reverse){ playback_speed *= -1 }
                // jump we want to play once forward
                const loop = (mover.current != "jump")?AnimatedComponent.LoopRepeat:AnimatedComponent.LoopOnce
                this.play_action(e,anim,anim_move[mover.current],anim_move.blend_time,playback_speed,loop)
            }
        })
    }
}

AnimatedMovementSystem.queries = {
    animated: {
        components: [AnimatedMovementComponent,MoverComponent,AnimatedComponent]
    }
}