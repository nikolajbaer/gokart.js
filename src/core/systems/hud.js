import { System } from "ecsy"
import { makeAutoObservable, runInAction } from "mobx"
import { HUDDataComponent } from "../components/hud"

/* make an observable object and pass in as hudstate  */
export class HUDState {
    score = 0

    constructor(){
        makeAutoObservable(this)
    }

}

export class HUDSystem extends System {
    init(attributes){
        if(attributes && attributes.hud_state){
            this.state = attributes.hud_state
        }else{
            this.state = new HUDState()
        }
    }

    execute(delta,time){
        // update the state
        // use runInAction per https://stackoverflow.com/a/64771774
        runInAction( () => {
            this.queries.hud_data.results.forEach( e => {
                const data = e.getComponent(HUDDataComponent).data
                Object.keys(data).forEach( k => {
                    this.state[k] = data[k]
                })
            })
        })
    }
}

HUDSystem.queries = {
    hud_data: {
        components: [HUDDataComponent],
    }
}