import { World} from "ecsy"
import { CameraComponent, Obj3dComponent, ModelComponent, LightComponent, Project2dComponent, RayCastTargetComponent } from "../../src/core/components/render"
import { LocRotComponent } from "../../src/core/components/position"
import { HUDDataComponent } from "../../src/core/components/hud"
import { RenderSystem } from "../../src/core/systems/render"
import { HUDState, HUDSystem } from "../../src/core/systems/hud"
import { ControlsSystem } from "../../src/core/systems/controls"
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../../src/core/components/controls"
import { CameraFollowComponent } from "../../src/common/components/camera_follow"
import { CameraFollowSystem } from "../../src/common/systems/camera_follow"
import { SoundEffectSystem } from "../../src/core/systems/sound"
import { MusicLoopComponent, SoundEffectComponent } from "../../src/core/components/sound"
import { DefaultMeshCreator } from "../core/asset_creator/mesh_creator"
import { SoundLoader } from "../core/asset_creator/sound_loader"
import { runInAction } from "mobx"
import { Clock } from "three"

export class BaseScene {
    constructor(){
        this.lastTime = null
        this.paused = false
        this.render_element_id = null
        this.init_mesh_creator()
        this.init_sound_loader()
        this.fps = null 
        this.hud_state = this.init_hud_state()
        this.clock = new Clock()
    }

    init_hud_state(){
        return new HUDState()
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

    init(render_element_id,touch_enabled){
        this.render_element_id = render_element_id
        this.touch_enabled = touch_enabled
        if(touch_enabled){
            console.log("Touch Enabled Scene!")
        }
        this.world = new World()
        this.register_components()
        this.register_systems()
    }

    register_components(){
        this.world.registerComponent(LocRotComponent)

        // Render Components
        this.world.registerComponent(Obj3dComponent)
        this.world.registerComponent(ModelComponent)
        this.world.registerComponent(CameraComponent)
        this.world.registerComponent(LightComponent)
        this.world.registerComponent(CameraFollowComponent)
        this.world.registerComponent(Project2dComponent)
        this.world.registerComponent(RayCastTargetComponent)
       
        // UI Interaction Components
        this.world.registerComponent(HUDDataComponent)

        // Control Components
        this.world.registerComponent(ActionListenerComponent)
        this.world.registerComponent(MouseListenerComponent)
        this.world.registerComponent(MouseLockComponent)

        // sound components
        this.world.registerComponent(SoundEffectComponent)
        this.world.registerComponent(MusicLoopComponent)

    }

    register_systems(){
        this.world.registerSystem(ControlsSystem,{
            listen_element_id:this.render_element_id,
            touch_pads: this.get_touch_pad_config(),
        })
        this.world.registerSystem(HUDSystem,{hud_state:this.hud_state})
        this.world.registerSystem(CameraFollowSystem)
        this.world.registerSystem(SoundEffectSystem,{
            sounds:this.sound_loader.SOUNDS
        })
        this.world.registerSystem(RenderSystem,{
            render_element_id:this.render_element_id,
            mesh_creator: this.mesh_creator?this.mesh_creator:null,
            show_axes: true,
            customize_renderer: this.customize_renderer, 
        })
    }

    // TODO make controls config more sensible
    get_touch_pad_config(){
        return {
            'dpad':{
                x_action: ['right','left'],
                y_action: ['up','down'],
                active_action: 'interact',
            },
            'aim':{ mouse: true, mouse_sensitivity: 1.0 },
        }
    }
    
    customize_renderer(renderer){
        // TODO consider how to make this more dynamic
        // as cameras are changed so we need to pass more information in
        // for a lot of effects
        return renderer
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

        let delta = this.clock.getDelta()
        let time = this.clock.getElapsedTime()
        this.world.execute(delta,time) 

        runInAction( () => {
            this.hud_state.fps = 1/delta
        })
    }
}

