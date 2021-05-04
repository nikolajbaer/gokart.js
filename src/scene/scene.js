import { World} from "ecsy"
import { CameraComponent, Obj3dComponent, ModelComponent, LightComponent, Project2dComponent, RayCastTargetComponent } from "../../src/core/components/render"
import { BodyComponent, PhysicsComponent  } from "../../src/core/components/physics"
import { LocRotComponent } from "../../src/core/components/position"
import { HUDDataComponent } from "../../src/core/components/hud"
import { RenderSystem } from "../../src/core/systems/render"
import { PhysicsMeshUpdateSystem, PhysicsSystem } from "../../src/core/systems/physics"
import { HUDSystem } from "../../src/core/systems/hud"
import { ControlsSystem } from "../../src/core/systems/controls"
import { ActionListenerComponent } from "../../src/core/components/controls"
import { CameraFollowComponent } from "../../src/common/components/camera_follow"
import { CameraFollowSystem } from "../../src/common/systems/camera_follow"
import { AnimatedComponent, PlayActionComponent } from "../../src/core/components/animated"
import { AnimatedSystem } from "../../src/core/systems/animated"
import { AnimatedMovementComponent } from "../../src/common/components/animated_movement"
import { AnimatedMovementSystem } from "../../src/common/systems/animated_movement"
import { SoundEffectSystem } from "../../src/core/systems/sound"
import { MusicLoopComponent, SoundEffectComponent } from "../../src/core/components/sound"

export class BaseScene {
    constructor(render_element,mesh_creator,sound_loader){
        this.lastTime = null
        this.paused = false
        this.render_element = render_element
        this.mesh_creator = mesh_creator
        this.sound_loader = sound_loader
    }

    build_world(){
        this.world = new World()
        this.register_components()
        this.register_systems()
    }

    register_components(){
        this.world.registerComponent(Obj3dComponent)
        this.world.registerComponent(LocRotComponent)
        this.world.registerComponent(ModelComponent)
        this.world.registerComponent(HUDDataComponent)
        this.world.registerComponent(CameraComponent)
        this.world.registerComponent(LightComponent)
        this.world.registerComponent(ActionListenerComponent)
        this.world.registerComponent(CameraFollowComponent)
        this.world.registerComponent(Project2dComponent)
        this.world.registerComponent(RayCastTargetComponent)

        // Possibly move these elsewhere
        // animation components
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)

        // sound components
        this.world.registerComponent(SoundEffectComponent)
        this.world.registerComponent(MusicLoopComponent)

   }

    register_systems(){
        this.world.registerSystem(ControlsSystem,{
            listen_element_id:this.render_element
        })
        this.world.registerSystem(HUDSystem)
        this.world.registerSystem(CameraFollowSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
        this.world.registerSystem(SoundEffectSystem,{
            sounds:this.sound_loader.SOUNDS
        })
        this.world.registerSystem(RenderSystem,{
            render_element_id:this.render_element,
            mesh_creator: this.mesh_creator?this.mesh_creator:null
        })
    }

    start(){
        this.lastTime = performance.now() / 1000
        this.paused = false
        this.loop()
    }

    loop() {
        requestAnimationFrame( () => this.loop() );            
        if(this.paused){ return }

        let time = performance.now() / 1000
        let delta = time - this.lastTime
        this.world.execute(delta,time) 
        this.lastTime = time
    }
}

export class Physics3dScene extends BaseScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(BodyComponent)
        this.world.registerComponent(PhysicsComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(PhysicsMeshUpdateSystem)

        // Physics we have to tie in any custom collision handlers, where 
        // entity_a has a PhysicsComponent with track_collisions enabled 
        this.world.registerSystem(PhysicsSystem, {collision_handler: (entity_a,entity_b,event) => {
            if(entity_b.hasComponent(HitComponent) || entity_a.hasComponent(HitComponent)){
                entity_b.addComponent(SoundEffectComponent,{sound:"bleep"})
            }
        }})
    }
}