import { System } from "ecsy"
import { CameraComponent, Obj3dComponent } from "../../core/components/render";
import { MouseLookComponent } from "../components/mouselook";
import * as THREE from "three"
import { PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../../core/components/physics";
        
const _PI_2 = Math.PI / 2;

// Based on https://threejs.org/examples/jsm/controls/PointerLockControls.js
export class MouseLookSystem extends System {
    init(attributes){
        console.log("mouselook ",attributes)
        if(attributes && attributes.listen_element_id){
            this.listen_element = document.getElementById(attributes.listen_element_id)
        }else{
            this.listen_element = document 
        }

        this.mx = 0
        this.my = 0
        this.euler = new THREE.Euler(0,0,0,'YXZ')
        this.locked = false
        this.minPolarAngle = 0
        this.maxPolarAngle = Math.PI

        // use these functions to add/remove with "this" scope
        const self = this
        this.mousemove = function(event){
            self.handle_mouse_move(event)
        }
        this.pointerlockchange = function(event){
            self.handle_pointer_lock_change(event)
        }

        document.addEventListener('pointerlockerror', this.handle_lock_error, false)
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
    } 

    handle_lock_error(e){
        //console.error("pointer lock failed",e)
    }

    handle_pointer_lock_change(){
        if(this.listen_element.ownerDocument.pointerLockElement === this.listen_element){
            this.locked = true
        }else{
            this.locked = false
            this.unlock()
        }
    }

    handle_mouse_move(event){
        this.mx += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        this.my += event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    }

    unlock(){
        this.listen_element.exitPointerLock()
        this.listen_element.ownerDocument.removeEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.removeEventListener('pointerlockchange', this.pointerlockchange)
    }

    execute(delta, time){
        if(this.queries.camera.results.length == 0){ return }
        if(this.queries.mouselook.results.length == 0){ return }
       
        // Todo make this exit-able if we want to look at a menu
        if(!this.locked){ 
            this.lock()
            return
        }

        const camera = this.queries.camera.results[0].getComponent(Obj3dComponent).obj
        const e = this.queries.mouselook.results[0]
        const mlook = e.getComponent(MouseLookComponent)
        const obj = e.getComponent(Obj3dComponent).obj

        this.euler.setFromQuaternion(camera.quaternion)
        this.euler.y -= this.mx * mlook.sensitivity
        this.euler.x -= this.my * mlook.sensitivity * (mlook.invert_y?-1:1)
        this.euler.x = Math.max( _PI_2 - this.maxPolarAngle, Math.min( _PI_2 - this.minPolarAngle, this.euler.x) )
        camera.quaternion.setFromEuler(this.euler)

        // Question how do we interact with physics object to ensure that we are moving that?        
        // and make this compatible with physics2d/3d

        // rotate object as well on y only
        if(e.hasComponent(PhysicsComponent) || e.hasComponent(PhysicsControllerComponent)){
            if(e.hasComponent(SetRotationComponent)){
                e.getComponent(SetRotationComponent).y = this.euler.y
            }else{
                e.addComponent(SetRotationComponent,{y:this.euler.y})
            }
        }else{ 
            obj.rotation.y = this.euler.y
        }

        // translate camera to obj position plus offset since we expect to be looking from our 
        // base component's position -- note the offset really 

        const local_offset = obj.localToWorld(new THREE.Vector3(mlook.offset.x,mlook.offset.y,mlook.offset.z))
        camera.position.copy(local_offset)

        // clear our cumulative mouse movement
        // most likely this won't be updated faster than request animation frame?
        this.mx = 0
        this.my = 0
    
    }
}

MouseLookSystem.queries = {
    camera: {
        components: [CameraComponent]
    },
    mouselook: {
        components: [MouseLookComponent,Obj3dComponent]
    }  
}