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
import { SoundEffectSystem } from "../../src/core/systems/sound"
import { MusicLoopComponent, SoundEffectComponent } from "../../src/core/components/sound"
import { DefaultMeshCreator } from "../core/asset_creator/mesh_creator"
import { SoundLoader } from "../core/asset_creator/sound_loader"

export class BaseScene {
    constructor(){
        this.lastTime = null
        this.paused = false
        this.render_element_id = null
        this.init_mesh_creator()
        this.init_sound_loader()
    }

    init_mesh_creator(mesh_data){
        this.mesh_creator = new DefaultMeshCreator() 
        this.mesh_creator.PREFABS = this.get_meshes_to_load()
    }

    init_sound_loader(){
        this.sound_loader = new SoundLoader()
        this.sound_loader.SOUNDS = this.get_sounds_to_load()
    }

    get_meshes_to_load(){
        return {}
    }

    get_sounds_to_load(){
        return {}
    }

    load(){
        return new Promise((resolve,reject) => {
            this.mesh_creator.load().then( () => {
                this.sound_loader.load().then( () => {
                    resolve() 
                })
            })
        })
    }

    init(render_element_id){
        this.render_element_id = render_element_id
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


        // sound components
        this.world.registerComponent(SoundEffectComponent)
        this.world.registerComponent(MusicLoopComponent)

   }

    register_systems(){
        this.world.registerSystem(ControlsSystem,{
            listen_element_id:this.render_element_id
        })
        this.world.registerSystem(HUDSystem)
        this.world.registerSystem(CameraFollowSystem)
        this.world.registerSystem(SoundEffectSystem,{
            sounds:this.sound_loader.SOUNDS
        })
        this.world.registerSystem(RenderSystem,{
            render_element_id:this.render_element_id,
            mesh_creator: this.mesh_creator?this.mesh_creator:null
        })
    }

    init_entities(){
        // Add initial entities here
    }

    start(){
        if(!this.world){
            console.error("You must call init with a render element id before starting your scene")
            return
        }
        this.init_entities()
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
        this.world.registerSystem(PhysicsSystem, {
            collision_handler: (entity_a,entity_b,event) => this.handle_collision(entity_a,entity_b,event)
         })
    }

    handle_collision(entity_a,entity_b,event){
        // place handling code here
    }
}