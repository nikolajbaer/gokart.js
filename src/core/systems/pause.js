import { System } from "ecsy"
import { ActionListenerComponent } from "../components/controls"
import { PauseComponent } from "../components/pause"

export class PauseSystem extends System {
    init(attributes){
        if(attributes && attributes.pause_callback){
            this.pause_callback = attributes.pause_callback
        }
    }

    pause(){
      if(this.pause_callback){
        this.pause_callback( () => {
          // after resume, clear any pause components
          console.log("removing pause components")
          this.queries.pause.results.forEach( e => {
            e.removeComponent(PauseComponent)
          })
          // Avoid race condition with unlock or key event handler
          this.queries.action_listeners.results.forEach( e => {
            const actions = e.getComponent(ActionListenerComponent).actions
            if(actions != undefined){ actions["pause"] = false }
          })
        })
      }
    }

    execute(delta,time){
      if(this.queries.pause.added.length > 0){
        console.log("pausing from component")
        this.pause()
      }else{
        this.queries.action_listeners.results.forEach( e => {
          const actions = e.getComponent(ActionListenerComponent).actions
          if(actions != undefined && actions["pause"] == true){
            console.log("pausing from action")
            this.pause()
          }
        })
      }
    }
}

PauseSystem.queries = {
  pause: {
    components: [PauseComponent],
    listen: {
      added: true,
      removed: true
    } 
  },
  action_listeners: {
    components: [ActionListenerComponent],
  }
}
