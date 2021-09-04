import { System } from "ecsy";
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../components/controls";

export class ControlsSystem extends System {
    init(attributes) {
       if(attributes && attributes.listen_element_id){
            this.listen_element = document.getElementById(attributes.listen_element_id)
        }else{
            this.listen_element = document 
        }
        let action_key_map = { // Nikolaj's preferred defaults :)
            "KeyW":"up",
            "KeyS":"down",
            "KeyA":"left",
            "KeyD":"right",
            "ArrowUp":"up",
            "ArrowDown":"down",
            "ArrowLeft":"left",
            "ArrowRight":"right",
            "Space":"jump",
            "KeyC":"crouch",
            "LeftControl":"crouch",
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

        // TODO maybe pointer lock component?
        // Pointer Lock Management
        this.locked = false

        // Mouse Controls
        this.mx = 0
        this.my = 0
        this.mw = 0

        // use these functions to add/remove with "this" scope
        const self = this
        this.mousemove = function(event){
            self.handle_mouse_move(event)
        }
        this.pointerlockchange = function(event){
            self.handle_pointer_lock_change(event)
        }
        this.wheelchange = function(event){
            self.handle_wheel_change(event)
        } 
        // TODO map mouse actions to click

        // On-Screen Controls

        // TODO Joystick Controls

        this.actions = actions
        this.action_key_map = action_key_map
    }

    lock(){
        if(this.locked || this.listen_element.ownerDocument.pointerLockElement === this.listen_element){
            return
        }
        this.listen_element.requestPointerLock().then( () => {
            // not sure this is standardized.. 
        }).catch( e => {}) // not sure what this error is
        this.listen_element.ownerDocument.addEventListener('pointerlockchange', this.pointerlockchange)
        this.listen_element.ownerDocument.addEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.addEventListener('wheel', this.wheelchange)
    } 

    handle_pointer_lock_change(){
        if(this.listen_element.ownerDocument.pointerLockElement === this.listen_element){
            this.locked = true
        }else{
            this.locked = false
            this.unlock()
        }
    }

    handle_lock_error(e){
        //console.error("pointer lock failed",e)
    }

    handle_mouse_move(event){
        this.mx += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		this.my += event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    }

    handle_wheel_change(event){
        this.mw += event.deltaY
    }

    unlock(){
        document.exitPointerLock()
        this.listen_element.ownerDocument.removeEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.removeEventListener('pointerlockchange', this.pointerlockchange)
    }

    execute(delta){
        this.queries.action_listeners.added.forEach( e => {
            e.getMutableComponent(ActionListenerComponent).actions = this.actions
        })
        this.queries.mouse_listeners.results.forEach( e => {
            const mouse = e.getMutableComponent(MouseListenerComponent)
            mouse.mousex = this.mx
            mouse.mousey = this.my
            mouse.mousewheel = this.mw
            //console.log(mouse.mousex,mouse.mousey,mouse.mousewheel)
        })

        // clear accumulated mouse movement
        // most likely this won't be updated faster than request animation frame?
        this.mx = 0
        this.my = 0
        this.mw = 0

        if(this.queries.mouse_locks.results.length > 0){
            if(!this.locked){
                this.lock()
            }
        }else{
            if(this.locked){
                this.unlock()
            }
        }
    }
}

ControlsSystem.queries = {
    action_listeners: {
        components: [ActionListenerComponent],
        listen: {
            added: true,
        } 
    },
    mouse_listeners: {
        components: [MouseListenerComponent],
    },
    mouse_locks: {
        components: [MouseLockComponent],
    }
}

