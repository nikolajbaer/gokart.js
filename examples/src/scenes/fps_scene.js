import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { ActionListenerComponent } from "../../../src/core/components/controls"
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
        })
        g.addComponent( ModelComponent, {geometry:"box",material:"ground",scale: new Vector3(1000,1,1000)})
        g.addComponent( LocRotComponent, { rotation: new Vector3(0,0,0), location: new Vector3(0,-0.5,0) } )
        g.name = "ground_plane"


        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.8})

        // Add our FPS camera
        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(0,2.5,0)})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"none",scale: new Vector3(1,1,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.KINEMATIC,
            bounds_type: BodyComponent.CYLINDER_TYPE,
            track_collisions:true,
            bounds: new Vector3(1,1,1),
            material: "player",
            mass: 100,
        })
        e.addComponent(HitComponent)
        e.addComponent(MoverComponent,{
            speed:10.0,
            kinematic:true,
            turner:false,
            local:true,
            jump_speed: 10,
            fly_mode: true,
        })
        e.addComponent(MouseLookComponent,{offset:new Vector3(0,2,0),invert_y:true})
        e.name = "player"

        // add something to bump into
        const e1 = this.world.createEntity()
        e1.addComponent(ModelComponent,{geometry:"sphere"})
        e1.addComponent(LocRotComponent,{location: new Vector3(10,1,10)})
        e1.addComponent(BodyComponent,{mass:100,bounds_type:BodyComponent.SPHERE_TYPE})
        e1.addComponent(HitComponent)

        // and some walls
        const W = 100
        for(var i=0; i<4;i++){
            const w = this.world.createEntity()
            w.addComponent(ModelComponent,{geometry:"box",material:"ground",scale:new Vector3(W,10,5)})
            w.addComponent(BodyComponent,{
                bounds_type:BodyComponent.BOX_TYPE,
                body_type:BodyComponent.STATIC,
                bounds: new Vector3(W,10,5),
                mass: 0,
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
                body_type:BodyComponent.STATIC
            })

        }
    }

    get_sounds_to_load(){
        return {
            "bleep": {url: bleepMP3 },
        }
    }
}
