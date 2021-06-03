import { System } from "ecsy"
import { Obj3dComponent } from "../../core/components/render"
import { DebugNormalComponent } from "../components/debug"
import * as THREE from "three"

const debug_normal_material = new THREE.LineBasicMaterial({color: 0xff00ff,depthTest:false})

export class Debug3dSystem extends System {

    execute(delta,time){
        this.queries.debug_normal.added.forEach( e => {
            const obj = e.getComponent(Obj3dComponent).obj
            const debug = e.getComponent(DebugNormalComponent) 
            const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,1)])
            const line = new THREE.Line(geometry,debug_normal_material)
            line.visible = false
            line.renderOrder = 1000
            obj.add(line)
            obj.debug_normal = line
        })
        this.queries.debug_normal.results.forEach( e => {
            const obj = e.getComponent(Obj3dComponent).obj
            const debug = e.getComponent(DebugNormalComponent) 
            if(debug.normal != null && obj.debug_normal){
                const p = new THREE.Vector3().copy(obj.position)
                                .add(new THREE.Vector3().copy(debug.local_offset))
                                .add(new THREE.Vector3().copy(debug.normal))
                                .normalize()
                                .multiplyScalar(1000)
                obj.debug_normal.position.set(debug.local_offset.x,debug.local_offset.y,debug.local_offset.z)
                obj.debug_normal.visible = true
                //console.log("pointing ",obj.debug_normal,"at",p)
                obj.debug_normal.lookAt(p)
            }else if(obj.debug_normal){
                obj.debug_normal.visible = false

            }
        })
    }
}

Debug3dSystem.queries = {
    debug_normal: {
        components: [DebugNormalComponent,Obj3dComponent],
        listen: {
            added: true
        }
    }
}

