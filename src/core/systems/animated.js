import { System } from "ecsy"
import { AnimatedComponent, PlayActionComponent } from "../components/animated"
import { Obj3dComponent } from "../components/render"
import * as THREE from "three"

export class AnimatedSystem extends System {
    execute(delta, time){
        this.queries.animated.added.forEach( e=> {
            const obj = e.getComponent(Obj3dComponent).obj
            const anim = e.getMutableComponent(AnimatedComponent)
            anim.mixer = new THREE.AnimationMixer(obj)
            anim.actions = {}
        })

        // TODO add anim.mixer.uncache methods on removed if necessary to clean up

        this.queries.play.results.forEach( e => {
            const obj = e.getComponent(Obj3dComponent).obj
            const anim = e.getMutableComponent(AnimatedComponent)

            const play = e.getComponent(PlayActionComponent)
            if(!anim.actions[play.action]){
                const clip = THREE.AnimationClip.findByName( obj.animations, play.action )
                if(clip){
                    anim.actions[play.action] = anim.mixer.clipAction( clip )
                }else{
                    anim.actions[play.action] = null
                }
            }
            if(anim.actions[play.action]){
                const action = anim.actions[play.action]
                action.clampWhenFinished = play.clamp_when_finished
                if(play.clamp_when_finished){ console.log("Clamping ",play.action)}
                action.setLoop(play.loop)
                action.reset()
                action.setEffectiveTimeScale(play.playback_speed)
                const current = anim.actions[anim.current_action]
                if(current){
                    //console.log("cross fading from",anim.current_action," to ",play.action," blending ",play.blend," playback at ",play.playback_speed)
                    action.crossFadeFrom(current, play.blend).play()
                }else{
                    //console.log("playing ",play.action)
                    action.play()
                }
                // store both current clip for crossfading, and name for coordination
                anim.current_action = play.action
            }else{
                console.error("Unknown action ",play.action,obj.animations)
            }
            e.removeComponent(PlayActionComponent)
        })

        this.queries.animated.results.forEach( e => {
            const anim = e.getComponent(AnimatedComponent)
            anim.mixer.update(delta)
        })
    }
}

AnimatedSystem.queries = {
    play: {
        components: [Obj3dComponent,PlayActionComponent]
    },
    animated: {
        components: [Obj3dComponent,AnimatedComponent],
        listen: {
            added: true,
            removed: true,
        }
    }
}