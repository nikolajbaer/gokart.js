import { System } from "ecsy"
import { CameraComponent, Obj3dComponent } from "../../core/components/render";
import * as THREE from "three"
import { LocRotComponent } from "../../core/components/position";
import { OrbitControlComponent } from "../components/orbit_controls";
import { PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../../core/components/physics";
import { MouseListenerComponent } from "../../core/components/controls";
        
const _PI_2 = Math.PI / 2;

// Based on https://threejs.org/examples/jsm/controls/OrbitControls.js
export class OrbitControlsSystem extends System {
    init(attributes){
        this.euler = new THREE.Euler(0,0,0,'YXZ')
        this.mx = 0
        this.my = 0 
        this.mw = 1
        this.zoom_sensitivity = 0.001
    }

    execute(delta, time){
        if(this.queries.camera.results.length == 0){ return }
        if(this.queries.orbitcontrol.results.length == 0){ return }
       
        const camera_holder = this.queries.camera.results[0].getComponent(Obj3dComponent).obj
        const camera = camera_holder.children[0]

        const e = this.queries.orbitcontrol.results[0] // only can orbit one thing at a time
        const orbit = e.getComponent(OrbitControlComponent)
        const mouse = e.getMutableComponent(MouseListenerComponent)
        this.zoom_sensitivity = orbit.zoom_sensitivity

        const location = e.getComponent(LocRotComponent).location
        camera_holder.position.set(location.x,location.y,location.z)

        this.mw += mouse.mousewheel
        this.scale = this.mw * this.zoom_sensitivity
        this.scale = Math.min(orbit.max_zoom,Math.max(this.scale,orbit.min_zoom))
        const offset = new THREE.Vector3().copy(orbit.offset).multiplyScalar(this.scale)
        camera.position.set(offset.x,offset.y,offset.z)
        camera.lookAt(new THREE.Vector3(location.x,location.y,location.z))

        this.euler.setFromQuaternion(camera_holder.quaternion)
        this.euler.y -= mouse.mousex * orbit.sensitivity
        this.euler.x -= mouse.mousey * orbit.sensitivity * (orbit.invert_y?-1:1)
        this.euler.x = Math.max(
            _PI_2 - orbit.max_polar_angle, 
            Math.min( _PI_2 - orbit.min_polar_angle, this.euler.x) 
        )

        camera_holder.quaternion.setFromEuler(this.euler)

        if(e.hasComponent(PhysicsComponent) || e.hasComponent(PhysicsControllerComponent)){
            if(e.hasComponent(SetRotationComponent)){
                e.getComponent(SetRotationComponent).y = this.euler.y
            }else{
                e.addComponent(SetRotationComponent,{y:this.euler.y})
            }
        } 
    
    }
}

OrbitControlsSystem.queries = {
    camera: {
        components: [CameraComponent,Obj3dComponent]
    },
    orbitcontrol: {
        components: [OrbitControlComponent,LocRotComponent,MouseListenerComponent]
    }  
}