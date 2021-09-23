import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent, KinematicCharacterComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { ActionListenerComponent } from "../../../src/core/components/controls"
import { MoverComponent, OnGroundComponent } from "../../../src/common/components/movement"
import { AnimatedComponent, PlayActionComponent } from "../../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../../src/common/components/animated_movement"
import { Physics3dScene } from "../../../src/scene/physics3d"
import { MovementSystem } from "../../../src/common/systems/movement"
import { AnimatedSystem } from "../../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../../src/common/systems/animated_movement"
import { SimplexNoise } from "simplex-noise"
import { HeightfieldDataComponent } from "../../../src/core/components/heightfield"
import { TerrainSystem } from "../../../src/common/systems/terrain"
import { TerrainTileComponent } from "../../../src/common/components/terrain"
import { OrbitControlComponent } from "../../../src/common/components/orbit_controls"
import { OrbitControlsSystem } from "../../../src/common/systems/orbit_controls"

function random_heightmap(w,h,ymin,ymax,q){
    const data = [] 
    const simplex = new SimplexNoise()
    for(var y=0; y<h; y++){
        //const row = []
        for(var x=0; x<w; x++){ 
            // height of 0-1 projected onto ymin/ymax range
            const v = (simplex.noise2D(x*q,y*q)+1)/2 * (ymax-ymin) + ymin
            //row.push(v) 
            data.push(v)
        }
        //data.push(row)
    }
    return data
}

export class ThirdPersonScene extends Physics3dScene {

    register_components(){
        super.register_components()
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)
        this.world.registerComponent(TerrainTileComponent)
        this.world.registerComponent(OnGroundComponent)
        this.world.registerComponent(OrbitControlComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
        this.world.registerSystem(TerrainSystem)
        this.world.registerSystem(OrbitControlsSystem,{listen_element_id:this.render_element_id})
    }

    init_entities(){

        // create a ground plane
        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.HEIGHTFIELD_TYPE,
            body_type: BodyComponent.STATIC,
            collision_groups: 0xffff0002,
        })
        const hf_w = 32 // width/depth of points in heightfield
        const hf_esz = 10 // spacing of grid of points in heightfield
        g.addComponent( HeightfieldDataComponent, {
            data: random_heightmap(hf_w,hf_w,0,1,0.1), // 0-1 range of heights, scale simplex noise by 0.1
            width: hf_w, 
            height: hf_w,
            scale: new Vector3(hf_w*hf_esz,10,hf_w*hf_esz),
        })
        g.addComponent( ModelComponent, {geometry:"terrain",material:0x247d3c})
        g.addComponent( TerrainTileComponent )
        g.addComponent( LocRotComponent )
        g.name="ground"

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient",intensity:0.6})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,0),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"directional",cast_shadow:true,intensity:0.6})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(10,50,-50)})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"box",scale: new Vector3(1,2,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,8,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.KINEMATIC_CHARACTER,
            bounds_type:BodyComponent.CAPSULE_TYPE,
            track_collisions:true,
            bounds: new Vector3(1,2,1),
            material: "player",
            mass: 100,
            collision_groups: 0xffff0004,
        })
        e.addComponent(MoverComponent,{
            speed:15.0,
            kinematic:true,
            turner:false,
            local:true,
            jump_speed: 10,
            fly_mode: true,
            gravity: -10,
        })
        e.addComponent(OrbitControlComponent,{offset:new Vector3(0,0,-40)})
        e.addComponent(KinematicCharacterComponent,{})
        e.name = "player"

        // create some ramps and platforms to test character controller on
        for(var i=0;i<5;i++){
            for(var j=0;j<5;j++){
                const box = this.world.createEntity()
                box.addComponent(ModelComponent,{geometry:"box",material:"ground",scale: new Vector3(10,2,10)})
                box.addComponent(BodyComponent,{
                    mass:0,
                    bounds:new Vector3(10,2,10),
                    body_type:BodyComponent.STATIC,
                    bounds_type:BodyComponent.BOX_TYPE,
                    collision_groups: 0xffff0002,
                })
                box.addComponent(LocRotComponent,{location: new Vector3(10 + i*15,i+10,10+j*15),rotation: new Vector3(Math.PI/180 * (j*15),0,0)})
            }
        }
        // test our terrain with a ball drop!
        const half = (hf_w*hf_esz*0.5)
        for(let x = -half; x < half; x += half/3){
            for(let z =-half; z < half; z += half/3){
                const e1 = this.world.createEntity()
                e1.addComponent(ModelComponent,{geometry:"sphere"})
                e1.addComponent(LocRotComponent,{location: new Vector3(x,20,z)})
                e1.addComponent(BodyComponent,{mass:10,bounds_type:BodyComponent.SPHERE_TYPE})
            }
        }
    }

}
