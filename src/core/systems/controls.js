import { System } from "ecsy";
import { action } from "mobx";
import { ActionListenerComponent } from "../components/controls";

export class ControlsSystem extends System {
    init(attributes) {
        let action_key_map = {
            "KeyW":"up",
            "KeyS":"down",
            "KeyA":"left",
            "KeyD":"right",
            "ArrowUp":"up",
            "ArrowDown":"down",
            "ArrowLeft":"left",
            "ArrowRight":"right",
            "Space":"jump",
            "ShiftLeft":"shift",
            "ShiftRight":"shift",
        }
        if(attributes.action_key_map){
            action_key_map = attributes.action_key_map
        }

        const actions = {}

        // Keyboard Controls
        document.addEventListener("keydown", event => { 
            if(action_key_map[event.code]){ actions[action_key_map[event.code]] = 1.0 }
        });
        window.addEventListener("keyup", event => {
            if(action_key_map[event.code]){ actions[action_key_map[event.code]] = 0.0 }
        });
        const render = document.getElementById(attributes.listen_element_id)

        // Mouse Controls

        // On-Screen Controls

        // TODO Joystick Controls

        this.actions = actions
        this.action_key_map = action_key_map
    }

    execute(delta){
        this.queries.action_listeners.added.forEach( e => {
            e.getMutableComponent(ActionListenerComponent).actions = this.actions
        })
    }
}

ControlsSystem.queries = {
    action_listeners: {
        components: [ActionListenerComponent],
        listen: {
            added: true,
        } 
    }
}

