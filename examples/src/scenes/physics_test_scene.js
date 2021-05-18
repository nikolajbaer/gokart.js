import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { Physics3dScene } from "../../../src/scene/physics3d"

import { MouseLookComponent } from "../../../src/common/components/mouselook"
import { MouseLookSystem } from "../../../src/common/systems/mouselook"

export class PhysicsTestScene extends Physics3dScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(MouseLookComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MouseLookSystem,{listen_element_id:this.render_element_id})
    }

    init_entities(){

        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.BOX_TYPE,
            body_type: BodyComponent.STATIC,
            bounds: new Vector3(100,1,100),
        })
        g.addComponent( ModelComponent, { material: "ground", scale: new Vector3(100,1,100)})
        g.addComponent( LocRotComponent, { location: new Vector3(0,-0.5,0) } )
        g.name = "ground_plane"

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.8})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,0),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(0,40,-40), rotation: new Vector3(0,Math.PI,0)})

        const density = 1
        const n = 8 
        const sp = 4
        for(var x=0; x<n; x++){
            for(var y =0; y<n; y++){
                for(var z=0; z<n; z++){
                    const box = this.world.createEntity()
                    const s = 2 
                    box.addComponent(ModelComponent,{geometry:"box",scale:new Vector3(s,s,s)})
                    box.addComponent(LocRotComponent,{location: new Vector3((n/2*sp) - x * sp,sp*4 + y * sp, (n/2*sp) - z * sp)})
                    box.addComponent(BodyComponent,{mass:s*s*s*density,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(s,s,s)})
                }
            }
        }

    }
}
