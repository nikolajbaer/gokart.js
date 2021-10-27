import { World} from "ecsy"
import { CameraComponent, Obj3dComponent, ModelComponent, LightComponent, Project2dComponent, RayCastTargetComponent, UpdateFromLocRotComponent } from "../../src/core/components/render.js"
import { LocRotComponent } from "../../src/core/components/position.js"
import { HUDDataComponent } from "../../src/core/components/hud.js"
import { RenderSystem } from "../../src/core/systems/render.js"
import { HUDState, HUDSystem } from "../../src/core/systems/hud.js"
import { ControlsSystem } from "../../src/core/systems/controls.js"
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../../src/core/components/controls.js"
import { CameraFollowComponent } from "../../src/common/components/camera_follow.js"
import { CameraFollowSystem } from "../../src/common/systems/camera_follow.js"
import { SoundEffectSystem } from "../../src/core/systems/sound.js"
import { MusicLoopComponent, SoundEffectComponent } from "../../src/core/components/sound.js"
import { DefaultMeshCreator } from "../core/asset_creator/mesh_creator.js"
import { SoundLoader } from "../core/asset_creator/sound_loader.js"
import { runInAction } from "mobx"
import { Clock } from "three"
import { PauseSystem } from "../core/systems/pause.js"
import { PauseComponent } from "../core/components/pause.js"

export class BaseScene {
    constructor(){
        this.paused = false
        this.pause_callback = null
        this.resume_callback = null
        this.render_element_id = null
        this.init_mesh_creator()
        this.init_sound_loader()
        this.fps = null 
        this.hud_state = this.init_hud_state()
        this.clock = new Clock()
        this.destroyed = false
    }

    init_hud_state(){
        return new HUDState()
    }

    init_mesh_creator(mesh_data){
        this.mesh_creator = new DefaultMeshCreator() 
        this.mesh_creator.PREFABS = this.get_meshes_to_load()
        this.mesh_creator.FUNCTIONS = this.get_mesh_functions()
    }

    init_sound_loader(){
        this.sound_loader = new SoundLoader()
        this.sound_loader.SOUNDS = this.get_sounds_to_load()
    }

    get_meshes_to_load(){
        return {}
    }

    get_mesh_functions(){
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
        //this.world.registerComponent(PauseComponent)
        this.world.registerComponent(LocRotComponent)

        // Render Components
        this.world.registerComponent(Obj3dComponent)
        this.world.registerComponent(ModelComponent)
        this.world.registerComponent(CameraComponent)
        this.world.registerComponent(LightComponent)
        this.world.registerComponent(CameraFollowComponent)
        this.world.registerComponent(Project2dComponent)
        this.world.registerComponent(RayCastTargetComponent)
        this.world.registerComponent(UpdateFromLocRotComponent)
       
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

    register_ui_systems(){
        /*
        this.world.registerSystem(PauseSystem, {
            pause_callback: (resume_callback) => {
                this.pause(resume_callback)
            }
        })*/
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
            render_element:document.getElementById(this.render_element_id),
            mesh_creator: this.mesh_creator?this.mesh_creator:null,
            show_axes: false,
            customize_renderer: this.customize_renderer, 
        })

    }

    register_systems(){
        this.register_ui_systems()
    }

    // TODO make controls config more sensible
    get_touch_pad_config(){
        return {
            'dpad':{
                x_action: ['right','left'],
                y_action: ['up','down'],
                active_action: 'interact',
            },
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
        this.paused = false
        this.loop()
    }

    pause(resume_callback){
        this.paused = true
        this.resume_callback = resume_callback
        if(this.pause_callback){
            this.pause_callback()
        }
    }

    resume(){
        this.paused = false
        if(this.resume_callback){
            this.resume_callback()
            this.resume_callback = null
        }
        requestAnimationFrame( () => this.loop() );            
    }

    loop() {
        if(this.destroyed){
            console.log("scene exiting")
            return
        }

        requestAnimationFrame( () => this.loop() );            
        // CONSIDER we probably want to just identify certain systems as "pause" systems 
        // i.e. if we pause and resize, three doesn't get to re-render
        // Maybe this is a bitecs pipeline thing?
        if(this.paused){ return }

        let delta = this.clock.getDelta()
        let time = this.clock.getElapsedTime()
        this.world.execute(delta,time) 

        runInAction( () => {
            this.hud_state.fps = 1/delta
        })
    }

    destroy(){
        this.pause_callback = null
        this.resume_callback = null
        this.world.stop()
        this.destroyed = true
    }
}

