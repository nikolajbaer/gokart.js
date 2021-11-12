import { System } from "ecsy"
import { CameraComponent, Obj3dComponent } from "../../core/components/render.js";
import { MouseLookComponent } from "../components/mouselook.js";
import * as THREE from "three"
import { PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../../core/components/physics.js";
import { MouseListenerComponent } from "../../core/components/controls.js";
        
const _PI_2 = Math.PI / 2;

// Based on https://threejs.org/examples/jsm/controls/PointerLockControls.js
export class MouseLookSystem extends System {
    init(attributes){
        this.mx = 0
        this.my = 0
        this.euler = new THREE.Euler(0,0,0,'YXZ')
        this.minPolarAngle = 0
        this.maxPolarAngle = Math.PI

    }

    execute(delta, time){
        if(this.queries.camera.results.length == 0){ return }
        if(this.queries.mouselook.results.length == 0){ return }
       
        const camera = this.queries.camera.results[0].getComponent(Obj3dComponent).obj
        const e = this.queries.mouselook.results[0]
        const mlook = e.getComponent(MouseLookComponent)
        const mouse = e.getMutableComponent(MouseListenerComponent)
        const obj = e.getComponent(Obj3dComponent).obj

        this.euler.setFromQuaternion(camera.quaternion)
        this.euler.y -= mouse.mousex * mlook.sensitivity
        this.euler.x -= mouse.mousey * mlook.sensitivity * (mlook.invert_y?-1:1)
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