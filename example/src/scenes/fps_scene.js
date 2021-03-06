import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent, KinematicCharacterComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../../../src/core/components/controls"
import { OnGroundComponent, MoverComponent } from "../../../src/common/components/movement"
import { TagComponent } from "ecsy"
import { AnimatedComponent, PlayActionComponent } from "../../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../../src/common/components/animated_movement"
import { Physics3dScene } from "../../../src/scene/physics3d"
import { MovementSystem } from "../../../src/common/systems/movement"
import { AnimatedSystem } from "../../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../../src/common/systems/animated_movement"
import { SoundEffectComponent } from "../../../src/core/components/sound"

// asset urls
import bleepMP3 from "../assets/bleep.mp3"
import { MouseLookComponent } from "../../../src/common/components/mouselook"
import { MouseLookSystem } from "../../../src/common/systems/mouselook"

class HitComponent extends TagComponent {}

export class FPSScene extends Physics3dScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(OnGroundComponent)
        this.world.registerComponent(HitComponent)
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)
        this.world.registerComponent(MouseLookComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
        this.world.registerSystem(MouseLookSystem,{listen_element_id:this.render_element_id})
    }

    handle_collision(entity_a,entity_b,contact){
        super.handle_collision(entity_a,entity_b,contact)

        if(entity_b.hasComponent(HitComponent) && entity_a.hasComponent(HitComponent)){
            entity_b.addComponent(SoundEffectComponent,{sound:"bleep"})
        }
    }

    init_entities(){

        // create a ground plane
        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.BOX_TYPE,
            body_type: BodyComponent.STATIC,
            bounds: new Vector3(1000,1,1000),
            collision_groups: 0xffff0002,
        })
        g.addComponent( ModelComponent, {geometry:"box",material:0x111111,scale: new Vector3(1000,1,1000)})
        g.addComponent( LocRotComponent, { rotation: new Vector3(0,0,0), location: new Vector3(0,-0.5,0) } )
        g.name = "ground_plane"


        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,20),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"directional",cast_shadow:true,intensity:0.6})

        // Add our FPS camera
        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(0,2.5,0)})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"sphere",material:"invisible",scale: new Vector3(1,1,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,13,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.KINEMATIC_CHARACTER,
            bounds_type: BodyComponent.CYLINDER_TYPE,
            track_collisions:true,
            bounds: new Vector3(0.5,0.5,0.5),
            material: "player",
            mass: 0,
        })
        e.addComponent(HitComponent)
        e.addComponent(MoverComponent,{
            speed:0.15,
            kinematic:true,
            turner:false,
            local:true,
            fly_mode: false,
        })
        e.addComponent(MouseLookComponent,{offset:new Vector3(0,2,0),invert_y:true})
        if(!this.touch_enabled){
            e.addComponent(MouseLockComponent)
        } 
        e.addComponent(MouseListenerComponent)
        e.addComponent(KinematicCharacterComponent,{})
        e.name = "player"

        // and some walls
        const W = 100
        const H = 25
        for(var i=0; i<4;i++){
            const w = this.world.createEntity()
            w.addComponent(ModelComponent,{geometry:"box",material:"ground",scale:new Vector3(W,H,5)})
            w.addComponent(BodyComponent,{
                bounds_type:BodyComponent.BOX_TYPE,
                body_type:BodyComponent.STATIC,
                bounds: new Vector3(W,H,5),
                mass: 0,
                collision_groups: 0xffff0002,
            })
            w.addComponent(LocRotComponent,{
                location: [
                    new Vector3(0,0,W/2),
                    new Vector3(W/2,0,0),
                    new Vector3(0,0,-W/2),
                    new Vector3(-W/2,0,0),
                ][i],
                rotation:new Vector3(0,i*Math.PI/2,0)
            })
        }

        const density = 3
        for(var i=0; i<10; i++){
            const box = this.world.createEntity()
            const s = Math.random() * 4 + 1
            box.addComponent(ModelComponent,{geometry:"box",scale:new Vector3(s,s,s)})
            box.addComponent(LocRotComponent,{location: new Vector3(20 - Math.random()*40,10,20 - Math.random()*40)})
            box.addComponent(BodyComponent,{mass:s*s*s*density,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(s,s,s)})
        }

        // create a slope test
        for(var i=0; i<5; i++){
            const slope = this.world.createEntity()
            slope.addComponent(ModelComponent,{geometry:"box",material:"ground",scale:new Vector3(10,2,4)})
            slope.addComponent(LocRotComponent,{location: new Vector3(10,0,-W/3 + 12*i),rotation:new Vector3(0,0,Math.PI/180*(i*15 + 15))})
            slope.addComponent(BodyComponent,{
                mass:0,
                bounds_type:BodyComponent.BOX_TYPE,
                bounds: new Vector3(10,2,4),
                body_type:BodyComponent.STATIC,
                collision_groups: 0xffff0002,
            })

        }
    }

    get_sounds_to_load(){
        return {
            "bleep": {url: bleepMP3 },
        }
    }
}
