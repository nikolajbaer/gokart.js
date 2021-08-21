import { System } from "ecsy"
import { CameraComponent, Obj3dComponent } from "../../core/components/render";
import * as THREE from "three"
import { LocRotComponent } from "../../core/components/position";
import { OrbitControlComponent } from "../components/orbit_controls";
import { PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../../core/components/physics";
        
const _PI_2 = Math.PI / 2;

// Based on https://threejs.org/examples/jsm/controls/OrbitControls.js
export class OrbitControlsSystem extends System {
    init(attributes){
        if(attributes && attributes.listen_element_id){
            this.listen_element = document.getElementById(attributes.listen_element_id)
        }else{
            this.listen_element = document 
        }
        this.mx = 0
        this.my = 0
        this.euler = new THREE.Euler(0,0,0,'YXZ')
        this.locked = false
        this.scale = 1.0
        this.zoom_sensitivity = 0.001 // overwritten by current orbit control

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
    }

    lock(){
        this.listen_element.requestPointerLock()
        this.listen_element.ownerDocument.addEventListener('pointerlockchange', this.pointerlockchange)
        this.listen_element.ownerDocument.addEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.addEventListener('wheel', this.wheelchange)
    } 

    handle_pointer_lock_change(){
        if(this.listen_element.ownerDocument.pointerLockElement === this.listen_element){
            this.locked = true
        }else{
            this.locked = false
        }
    }

    handle_mouse_move(event){
        this.mx += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		this.my += event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    }

    handle_wheel_change(event){
        this.scale += event.deltaY * this.zoom_sensitivity
    }

    unlock(){
        this.listen_element.ownerDocument.exitPointerLock()
        this.listen_element.ownerDocument.removeEventListener('mousemove', this.mousemove)
        this.listen_element.ownerDocument.removeEventListener('pointerlockchange', this.pointerlockchange)

    }

    execute(delta, time){
        if(this.queries.camera.results.length == 0){ return }
        if(this.queries.orbitcontrol.results.length == 0){ return }
       
        // Todo make this exit-able if we want to look at a menu
        if(!this.locked){ 
            this.lock()
            return
        }

        const camera_holder = this.queries.camera.results[0].getComponent(Obj3dComponent).obj
        const camera = camera_holder.children[0]

        const e = this.queries.orbitcontrol.results[0] // only can orbit one thing at a time
        const orbit = e.getComponent(OrbitControlComponent)
        this.zoom_sensitivity = orbit.zoom_sensitivity

        const location = e.getComponent(LocRotComponent).location
        camera_holder.position.set(location.x,location.y,location.z)

        this.scale = Math.min(orbit.max_zoom,Math.max(this.scale,orbit.min_zoom))
        const offset = new THREE.Vector3().copy(orbit.offset).multiplyScalar(this.scale)
        camera.position.set(offset.x,offset.y,offset.z)
        camera.lookAt(new THREE.Vector3(location.x,location.y,location.z))

        this.euler.setFromQuaternion(camera_holder.quaternion)
        this.euler.y -= this.mx * orbit.sensitivity
        this.euler.x -= this.my * orbit.sensitivity * (orbit.invert_y?-1:1)
        this.euler.x = Math.max( _PI_2 - orbit.max_polar_angle, Math.min( _PI_2 - orbit.min_polar_angle, this.euler.x) )

        camera_holder.quaternion.setFromEuler(this.euler)

        if(e.hasComponent(PhysicsComponent) || e.hasComponent(PhysicsControllerComponent)){
            if(e.hasComponent(SetRotationComponent)){
                e.getComponent(SetRotationComponent).y = this.euler.y
            }else{
                console.log("Adding rotation component")
                e.addComponent(SetRotationComponent,{y:this.euler.y})
            }
        } 

        // clear our cumulative mouse movement
        // most likely this won't be updated faster than request animation frame?
        this.mx = 0
        this.my = 0
    
    }
}

OrbitControlsSystem.queries = {
    camera: {
        components: [CameraComponent,Obj3dComponent]
    },
    orbitcontrol: {
        components: [OrbitControlComponent,LocRotComponent]
    }  
}