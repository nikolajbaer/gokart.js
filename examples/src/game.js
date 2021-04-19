import { World } from "ecsy"
import { CameraFollowComponent, MeshComponent, ModelComponent, RayCastTargetComponent } from "../../src/core/components/render"
import { BodyComponent, PhysicsComponent, LocRotComponent  } from "../../src/core/components/physics"
import { HUDDataComponent } from "../../src/core/components/hud"
import { RenderSystem } from "../../src/core/systems/render"
import { PhysicsMeshUpdateSystem, PhysicsSystem } from "../../src/core/systems/physics"
import { HUDSystem } from "../../src/core/systems/hud"
import { Vector3 } from "../../src/core/ecs_types"
import { ControlsSystem } from "../../src/core/systems/controls"
import { ActionListenerComponent } from "../../src/core/components/controls"
import { MoverComponent } from "../../src/base/components/movement"
import { MovementSystem } from "../../src/base/systems/movement"

export function game_init(options){
    console.log("initializing game")
    const world = new World()

    world.registerComponent(MeshComponent)
    world.registerComponent(ModelComponent)
    world.registerComponent(BodyComponent)
    world.registerComponent(PhysicsComponent)
    world.registerComponent(LocRotComponent)
    world.registerComponent(CameraFollowComponent)
    world.registerComponent(RayCastTargetComponent)
    world.registerComponent(HUDDataComponent)
    world.registerComponent(ActionListenerComponent)
    world.registerComponent(MoverComponent)


    if(options.touch){
        // todo init touch controls
    }else{
        world.registerSystem(ControlsSystem,{listen_element_id:options.render_element})
    }

    world.registerSystem(MovementSystem)
    world.registerSystem(HUDSystem)
    world.registerSystem(PhysicsMeshUpdateSystem)
    world.registerSystem(RenderSystem,{render_element_id:options.render_element})
    world.registerSystem(PhysicsSystem)

    // create a ground plane
    const g = world.createEntity()
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.PLANE_TYPE,
        body_type: BodyComponent.STATIC,
    })
    g.addComponent( LocRotComponent, { rotation: new Vector3(-Math.PI/2,0,0) } )

    // add a player
    const e = world.createEntity()
    e.addComponent(ModelComponent)
    e.addComponent(LocRotComponent,{location: new Vector3(0,0.5,0)})
    e.addComponent(CameraFollowComponent,{offset: new Vector3(10,10,-10)})
    e.addComponent(ActionListenerComponent)
    e.addComponent(BodyComponent,{body_type: BodyComponent.KINEMATIC,bounds_type:BodyComponent.BOX_TYPE})
    e.addComponent(MoverComponent,{speed:1.0,kinematic:true})

    // add something to bump into
    const e1 = world.createEntity()
    e1.addComponent(ModelComponent)
    e1.addComponent(LocRotComponent,{location: new Vector3(10,1,10)})
    e1.addComponent(BodyComponent,{mass:1000,bounds_type:BodyComponent.BOX_TYPE})
  
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