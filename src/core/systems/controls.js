import { System } from "ecsy";
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../components/controls.js";

export class ControlsSystem extends System {
    init(attributes) {
       if(attributes && attributes.listen_element_id){
            this.listen_element = document.getElementById(attributes.listen_element_id)
        }else{
            this.listen_element = document 
        }

        this.pause_on_unlock = (attributes && attributes.pause_on_unlock != undefined)?attributes.pause_on_unlock:true
        
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

        // CONSIDER breaking out different control systems into their own systems
        // or at least methods to make it easier for customization

        // TODO maybe pointer lock component?
        // Pointer Lock Management
        this.locked = false

        // Mouse Controls
        // relative mouse change (for mouse)
        this.mx = 0
        this.my = 0
        this.mw = 0
        this.mouse_touch_id = null
        this.mouse_touch = {x:0,y:0}

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
        // CONSIDER watching touch events and handlign dpad in system rahter
        // than slower react processing (also removes react requirement)
        this.touchchange = function(event){
            self.handle_touch_change(event)
        }

        this.touchstart = function(event){
            self.handle_touch_start(event)
        }
        this.touchmove = function(event){
            self.handle_touch_move(event)
        }
        this.touchend = function(event){
            self.handle_touch_end(event)  
        }
        this.touch_pads = (attributes.touch_pads != null)?attributes.touch_pads:null
        this.connect_touch_handler()

        this.clear_mouse = true
        // TODO figure out how to better toggle/manage this
        //this.mouse_absolute = true

        // TODO buttons

        // TODO Web Joystick Controls

        this.actions = actions
        this.action_key_map = action_key_map
    }

    // TODO integrate ESC to menu functionality that pauses game?
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
        this.connect_touch_handler()
        if(this.pause_on_unlock){
            console.log("disabling pause as we are locking")
            this.actions["pause"] = false
        }
    } 

    connect_touch_handler(){
        window.addEventListener("mobilestick", this.touchchange)
        window.addEventListener('touchstart', this.touchstart)
        window.addEventListener('touchmove', this.touchmove)
        window.addEventListener('touchend', this.touchend)
    }

    disconnect_touch_handler(){
        //window.removeEventListener('mobilestick', this.touchchange)
    }

    handle_touch_start(event){
        if(this.mouse_touch_id == null){
            this.mouse_touch_id = event.changedTouches[0].identifier
            this.mouse_touch.x = event.changedTouches[0].clientX
            this.mouse_touch.y = event.changedTouches[0].clientY
        }
        console.log("touch started",event)
    }

    handle_touch_move(event){
        if(this.mouse_touch_id != null && event.changedTouches[this.mouse_touch_id]){
            this.mx += event.changedTouches[this.mouse_touch_id].clientX - this.mouse_touch.x 
		    this.my += event.changedTouches[this.mouse_touch_id].clientY - this.mouse_touch.y
            this.mouse_touch.x = event.changedTouches[this.mouse_touch_id].clientX
            this.mouse_touch.y = event.changedTouches[this.mouse_touch_id].clientY
            console.log("touch moved",this.mx,this.my)
        }
    }

    handle_touch_end(event){
        if(this.mouse_touch_id != null && event.changedTouches[this.mouse_touch_id]){
            this.mouse_touch_id = null
            console.log("touch ended",event)
        }
    }

    handle_pointer_lock_change(){
        if(this.listen_element.ownerDocument.pointerLockElement === this.listen_element){
            this.locked = true
        }else{
            this.locked = false
            this.unlock()
            if(this.pause_on_unlock){
                console.log("pausing on unlock")
                this.actions["pause"] = true
            }
            // CONSIDER trigger pause? 
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

    handle_touch_change(event){
        //this.clear_mouse = false
        console.log(event.detail.id,event.detail.x,event.detail.y)
        if(this.touch_pads[event.detail.id]){
            const dpad = this.touch_pads[event.detail.id]
            if(dpad.mouse){
                this.mx = event.detail.x * dpad.mouse_sensitivity.x
                this.my = -event.detail.y * dpad.mouse_sensitivity.y
            }else{
                if(Array.isArray(dpad.x_action)){
                    this.actions[dpad.x_action[0]] = (event.detail.x > 0)?event.detail.x:0
                    this.actions[dpad.x_action[1]] = (event.detail.x <= 0)?Math.abs(event.detail.x):0
                }else{
                    this.actions[dpad.x_action] = event.detail.x
                }
                if(Array.isArray(dpad.y_action)){
                    this.actions[dpad.y_action[0]] = (event.detail.y > 0)?event.detail.y:0
                    this.actions[dpad.y_action[1]] = (event.detail.y <= 0)?Math.abs(event.detail.y):0
                }else{
                    this.actions[dpad.y_action] = event.detail.y
                } 
                if(dpad.active_action){
                    this.actions[dpad.active_action] = event.active
                }
            }
        }
    }

    unlock(){
        document.exitPointerLock()
        this.listen_element.ownerDocument.removeEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.removeEventListener('pointerlockchange', this.pointerlockchange)
        this.disconnect_touch_handler()
    }

    execute(delta){
        this.queries.action_listeners.added.forEach( e => {
            e.getMutableComponent(ActionListenerComponent).actions = this.actions
        })
        this.queries.mouse_listeners.results.forEach( e => {
            const mouse = e.getMutableComponent(MouseListenerComponent)
            if(this.mouse_absolute){
                mouse.mousex = this.amx
                mouse.mousey = this.amy
                mouse.absolute = true             
            }else{
                mouse.mousex = this.mx
                mouse.mousey = this.my
                mouse.absolute = false             
            }
            mouse.mousewheel = this.mw
            //console.log(mouse.mousex,mouse.mousey,mouse.mousewheel)
        })

        // clear accumulated mouse movement
        // most likely this won't be updated faster than request animation frame?
        if(this.clear_mouse){
            this.mx = 0
            this.my = 0
            this.mw = 0
        }

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

