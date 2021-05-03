import { World } from "ecsy"
import { CameraComponent, Obj3dComponent, ModelComponent, LightComponent, Project2dComponent } from "../../src/core/components/render"
import { BodyComponent, PhysicsComponent  } from "../../src/core/components/physics"
import { LocRotComponent } from "../../src/core/components/position"
import { HUDDataComponent } from "../../src/core/components/hud"
import { RenderSystem } from "../../src/core/systems/render"
import { PhysicsMeshUpdateSystem, PhysicsSystem } from "../../src/core/systems/physics"
import { HUDSystem } from "../../src/core/systems/hud"
import { Vector3 } from "../../src/core/ecs_types"
import { ControlsSystem } from "../../src/core/systems/controls"
import { ActionListenerComponent } from "../../src/core/components/controls"
import { MoverComponent } from "../../src/common/components/movement"
import { MovementSystem } from "../../src/common/systems/movement"
import { TagComponent } from "ecsy"
import { CameraFollowComponent } from "../../src/common/components/camera_follow"
import { CameraFollowSystem } from "../../src/common/systems/camera_follow"
import { AnimatedComponent, PlayActionComponent } from "../../src/core/components/animated"
import { AnimatedSystem } from "../../src/core/systems/animated"
import { AnimatedMovementComponent } from "../../src/common/components/animated_movement"
import { AnimatedMovementSystem } from "../../src/common/systems/animated_movement"
import { SoundEffectSystem } from "../../src/core/systems/sound"
import { MusicLoopComponent, SoundEffectComponent } from "../../src/core/components/sound"

class HitComponent extends TagComponent {}

export function load_assets(){
    return new Promise((resolve,reject) => {
        resolve()
    })
}

export function game_init(options){
    console.log("initializing game",options)
    const world = new World()

    // register components we are using
    world.registerComponent(Obj3dComponent)
    world.registerComponent(ModelComponent)
    world.registerComponent(BodyComponent)
    world.registerComponent(PhysicsComponent)
    world.registerComponent(LocRotComponent)
    world.registerComponent(HUDDataComponent)
    world.registerComponent(ActionListenerComponent)
    world.registerComponent(MoverComponent)
    world.registerComponent(HitComponent)
    world.registerComponent(CameraComponent)
    world.registerComponent(LightComponent)
    world.registerComponent(Project2dComponent)
    world.registerComponent(CameraFollowComponent)
    world.registerComponent(AnimatedComponent)
    world.registerComponent(PlayActionComponent)
    world.registerComponent(AnimatedMovementComponent)
    world.registerComponent(SoundEffectComponent)
    world.registerComponent(MusicLoopComponent)

    // register our systems
    if(options.touch){
        // todo init touch controls
    }else{
        world.registerSystem(ControlsSystem,{listen_element_id:options.render_element})
    }
    world.registerSystem(MovementSystem)
    world.registerSystem(HUDSystem)
    world.registerSystem(PhysicsMeshUpdateSystem)
    world.registerSystem(CameraFollowSystem)
    world.registerSystem(AnimatedSystem)
    world.registerSystem(AnimatedMovementSystem)
    world.registerSystem(SoundEffectSystem,{sounds:options.sound_loader.SOUNDS})

    world.registerSystem(RenderSystem,{
        render_element_id:options.render_element,
        mesh_creator: options.mesh_creator?options.mesh_creator:null
    })
    // Physics we have to tie in any custom collision handlers, where 
    // entity_a has a PhysicsComponent with track_collisions enabled 
    world.registerSystem(PhysicsSystem, {collision_handler: (entity_a,entity_b,event) => {
        if(entity_b.hasComponent(HitComponent) || entity_a.hasComponent(HitComponent)){
            entity_b.addComponent(SoundEffectComponent,{sound:"bleep"})
        }
    }})

    // create a ground plane
    const g = world.createEntity()
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.PLANE_TYPE,
        body_type: BodyComponent.STATIC,
    })
    g.addComponent( ModelComponent, {geometry:"ground",material:"ground"})
    g.addComponent( LocRotComponent, { rotation: new Vector3(-Math.PI/2,0,0) } )

    const c = world.createEntity()
    c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,0),current: true})
    c.addComponent(LocRotComponent,{location: new Vector3(0,20,-20)})

    const l1 = world.createEntity()
    l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
    l1.addComponent(LightComponent,{type:"ambient"})

    const l2 = world.createEntity()
    l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
    l2.addComponent(LightComponent,{type:"point",cast_shadow:true})

    // add a player
    const e = world.createEntity()
    e.addComponent(ModelComponent,{geometry:"mecha"})
    e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
    e.addComponent(ActionListenerComponent)
    e.addComponent(BodyComponent,{
        body_type: BodyComponent.KINEMATIC,
        bounds_type:BodyComponent.BOX_TYPE,
        track_collisions:true,
        bounds: new Vector3(2,3,2),
    })
    e.addComponent(HitComponent)
    e.addComponent(MoverComponent,{speed:10.0,kinematic:true})
    e.addComponent(AnimatedComponent)
    e.addComponent(AnimatedMovementComponent,{
        rest: "Rest",
        walk: "Walk",
        run: "Walk",
    })
    e.addComponent(CameraFollowComponent,{offset:new Vector3(0,20,-20)})

    // add something to bump into
    const e1 = world.createEntity()
    e1.addComponent(ModelComponent,{geometry:"sphere"})
    e1.addComponent(HitComponent)
    e1.addComponent(LocRotComponent,{location: new Vector3(10,1,10)})
    e1.addComponent(BodyComponent,{mass:1000,bounds_type:BodyComponent.SPHERE_TYPE})
  
    start_game(world)

    return world
}

function start_game(world){
    let lastTime = performance.now() / 1000

    let paused = false

    window.addEventListener("keypress", (e) => {
        if(e.key == " "){
            paused = !paused
        }
    })

    function animate() {
        requestAnimationFrame( animate );            
        if(paused){ return }

        let time = performance.now() / 1000
        let delta = time - lastTime
        world.execute(delta,time) 
        lastTime = time
    }
    animate();
}