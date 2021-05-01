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
        })

        // TODO add anim.mixer.uncache methods on removed if necessary to clean up

        this.queries.play.results.forEach( e => {
            const obj = e.getComponent(Obj3dComponent).obj
            const anim = e.getMutableComponent(AnimatedComponent)

            const play = e.getComponent(PlayActionComponent)
            const clip = THREE.AnimationClip.findByName( obj.animations, play.action )
            if(clip){
                const action = anim.mixer.clipAction( clip )
                action.play()
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