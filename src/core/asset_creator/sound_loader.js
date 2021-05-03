import {Howl} from 'howler';

export class SoundLoader {
    SOUNDS = {
        // { name: xxx, url: xxx , sound: null }
    }

    load(){
        console.log("loading sounds")
        return new Promise((all_resolve,all_reject) => {
            return Promise.all(
                Object.values(this.SOUNDS).map( sound => {
                    // TODO support sprites
                    return new Promise((resolve,reject) => {
                        console.log("loaded",sound)
                        const howl = new Howl({
                            src: [sound.url],
                            onload: () => resolve(),
                        }) 
                        sound.sound = howl
                    })
                })
            ).then(() => {
                all_resolve()
            })
        })
    }  
}