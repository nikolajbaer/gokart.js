import { System } from "ecsy"
import { MusicLoopComponent, SoundEffectComponent } from "../components/sound"

export class SoundEffectSystem extends System {
    init(options){
        console.log("initializing with sounds ",options.sounds)
        this.sounds = (options && options.sounds)?options.sounds:{}
    }

    execute(delta,time){
        this.queries.effects.results.forEach( e => {
            const sound = e.getComponent(SoundEffectComponent)
            if(this.sounds[sound.sound]){
                this.sounds[sound.sound].sound.volume(sound.volume)
                this.sounds[sound.sound].sound.play()
            }
            e.removeComponent(SoundEffectComponent)
        })

        // TODO think through music
        this.queries.music.results.forEach( e => {

        })
    }

}

SoundEffectSystem.queries = {
    effects: {
        components: [SoundEffectComponent]
    },
    music: {
        components: [MusicLoopComponent],
    }
}