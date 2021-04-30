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
import { MoverComponent } from "../../src/base/components/movement"
import { MovementSystem } from "../../src/base/systems/movement"
import { TagComponent } from "ecsy"

class HitComponent extends TagComponent {}


export function load_assets(){
    return new Promise((resolve,reject) => {
        resolve()
    })
}

export function game_init(options){
    console.log("initializing game")
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

    // register our systems
    if(options.touch){
        // todo init touch controls
    }else{
        world.registerSystem(ControlsSystem,{listen_element_id:options.render_element})
    }
    world.registerSystem(MovementSystem)
    world.registerSystem(HUDSystem)
    world.registerSystem(PhysicsMeshUpdateSystem)
    world.registerSystem(RenderSystem,{render_element_id:options.render_element})
    // Physics we have to tie in any custom collision handlers, where 
    // entity_a has a PhysicsComponent with track_collisions enabled 
    world.registerSystem(PhysicsSystem, {collision_handler: (entity_a,entity_b,event) => {
        if(entity_b.hasComponent(HitComponent)){
            console.log("Bop!")
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
    e.addComponent(ModelComponent)
    e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
    e.addComponent(ActionListenerComponent)
    e.addComponent(BodyComponent,{body_type: BodyComponent.KINEMATIC,bounds_type:BodyComponent.BOX_TYPE,track_collisions:true})
    e.addComponent(MoverComponent,{speed:1.0,kinematic:true})

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
    }
    animate();
}