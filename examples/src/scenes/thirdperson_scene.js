import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3, Vector3Type } from "../../../src/core/ecs_types"
import { ActionListenerComponent } from "../../../src/core/components/controls"
import { MoverComponent } from "../../../src/common/components/movement"
import { CameraFollowComponent } from "../../../src/common/components/camera_follow"
import { AnimatedComponent, PlayActionComponent } from "../../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../../src/common/components/animated_movement"
import { Physics3dScene } from "../../../src/scene/scene"
import { MovementSystem } from "../../../src/common/systems/movement"
import { AnimatedSystem } from "../../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../../src/common/systems/animated_movement"
import * as SimplexNoise from "simplex-noise"
import { HeightfieldDataComponent } from "../../../src/core/components/heightfield"
import { TerrainSystem } from "../../../src/common/systems/terrain"
import { TerrainTileComponent } from "../../../src/common/components/terrain"

function random_heightmap(w,h,ymin,ymax,q){
    const data = [] 
    const simplex = new SimplexNoise()
    for(var y=0; y<h; y++){
        const row = []
        for(var x=0; x<w; x++){ 
            // height of 0-1 projected onto ymin/ymax range
            const v = (simplex.noise2D(x*q,y*q)+1)/2 * (ymax-ymin) + ymin
            row.push(v) 
        }
        data.push(row)
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
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
        this.world.registerSystem(TerrainSystem)
    }

    handle_collision(entity_a,entity_b,contact){
        let mover = null
        let contactNormal = new CANNON.Vec3()

        // Handle Mover
        if(entity_a.hasComponent(MoverComponent)){
            mover = entity_a
            contact.ni.negate(contactNormal)
        }else if(entity_b.hasComponent(MoverComponent)){
            mover = entity_b
            contactNormal.copy(contact.ni)
        }

        if(mover){
            if (contactNormal.dot(new CANNON.Vec3(0,1,0)) > 0.5) {
                const m = mover.getMutableComponent(MoverComponent)
                m.can_jump = true
            }
        }

        // Handle CollideAndSlideComponent
    }

    init_entities(){

        // create a ground plane
        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.HEIGHTFIELD_TYPE,
            body_type: BodyComponent.STATIC,
        })
        const hf_w = 32 // width/depth of points in heightfield
        const hf_esz = 10 // spacing of grid of points in heightfield
        g.addComponent( HeightfieldDataComponent, {
            data: random_heightmap(hf_w,hf_w,0,10,0.1), // 0-1 range of heights, scale simplex noise by 0.1
            width: hf_w, 
            height: hf_w,
            element_size: hf_esz,
        })
        g.addComponent( ModelComponent, {geometry:"terrain",material:0x247d3c})
        g.addComponent( TerrainTileComponent )
        g.addComponent( LocRotComponent, { 
            location: new Vector3(-(hf_w*hf_esz)/2,-10,(hf_w*hf_esz)/2),  // CANNON Heightfield registers in top left, so center it on origin
            rotation: new Vector3(-Math.PI/2,0,0)  // plane and heightfield are naturally x/y pointing Z, so flip so they are Y up
        } )

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient",intensity:0.6})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,0),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.6})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(10,50,-50)})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"cylinder",scale: new Vector3(1,2,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,1,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.KINEMATIC,
            bounds_type:BodyComponent.CYLINDER_TYPE,
            track_collisions:true,
            bounds: new Vector3(1,2,1),
            material: "player",
            mass: 100,
        })
        e.addComponent(MoverComponent,{
            speed:10.0,
            kinematic:true,
            turner:false,
            local:true,
            jump_speed: 10,
        })
        e.addComponent(CameraFollowComponent,{offset:new Vector3(10,50,-50)})

        // test our terrain with a ball drop!
        const half = (hf_w*hf_esz*0.5)
        for(let x = -half; x < half; x += half/5){
            for(let z =-half; z < half; z += half/5){
                const e1 = this.world.createEntity()
                e1.addComponent(ModelComponent,{geometry:"sphere"})
                e1.addComponent(LocRotComponent,{location: new Vector3(x,20,z)})
                e1.addComponent(BodyComponent,{mass:10,bounds_type:BodyComponent.SPHERE_TYPE})
            }
        }
    }

}
