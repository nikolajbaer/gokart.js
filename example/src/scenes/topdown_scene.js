import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { ActionListenerComponent } from "../../../src/core/components/controls"
import { MoverComponent } from "../../../src/common/components/movement"
import { TagComponent } from "ecsy"
import { CameraFollowComponent } from "../../../src/common/components/camera_follow"
import { AnimatedComponent, PlayActionComponent } from "../../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../../src/common/components/animated_movement"
import { Physics2dScene } from "../../../src/scene/physics2d"
import { AnimatedSystem } from "../../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../../src/common/systems/animated_movement"
import { Body2dComponent } from "../../../src/core/components/physics2d"
import { Movement2dSystem } from "../../../src/common/systems/movement2d"

// asset urls
import CHARACTER_GLB from "../assets/combined_character.glb"
import bleepMP3 from "../assets/bleep.mp3"
import * as pl from "planck-js"

class HitComponent extends TagComponent {}

export class TopDownScene extends Physics2dScene {

    register_components(){
        super.register_components()
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(HitComponent)
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(Movement2dSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
    }

    handle_collision(entity_a,entity_b){
        if(entity_b.hasComponent(HitComponent) || entity_a.hasComponent(HitComponent)){
            //entity_b.addComponent(SoundEffectComponent,{sound:"bleep"})
        }
    }

    init_entities(){

        // create a ground plane
        const g = this.world.createEntity()
        g.addComponent( ModelComponent, {geometry:"ground",material:"ground"})
        g.addComponent( LocRotComponent, { rotation: new Vector3(-Math.PI/2,0,0), location: new Vector3(0,0,0) } )

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,0),current: true})
        c.addComponent(LocRotComponent,{location: new Vector3(0,35,-15)})

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,20),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"directional",cast_shadow:true,intensity:0.6})

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"character"})
        e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(Body2dComponent,{
            body_type: "kinematic",
            track_collisions:true,
            width: 2,
            height: 2,
        })
        e.addComponent(HitComponent)
        e.addComponent(MoverComponent,{speed:10.0,kinematic:true})
        e.addComponent(AnimatedComponent)
        e.addComponent(AnimatedMovementComponent,{
            rest: "Idle",
            walk: "Walk",
            run: "Run",
        })
        e.addComponent(CameraFollowComponent,{offset:new Vector3(0,35,-15)})

        // add some things to bump into
        const e1 = this.world.createEntity()
        e1.addComponent(ModelComponent,{geometry:"sphere"})
        e1.addComponent(LocRotComponent,{location: new Vector3(10,1,10)})
        e1.addComponent(Body2dComponent,{mass:1,body_type:"dynamic"})

    }

    get_meshes_to_load(){
        return {
            "character":{ url:CHARACTER_GLB, scale: 2 },
        }
    }

    get_sounds_to_load(){
        return {
            "bleep": {url: bleepMP3 },
        }
    }

    get_world_attributes(){
        return {gravity: new pl.Vec2(0,0)}
    }
}
