import { World } from "ecsy"
import { CameraFollowComponent, MeshComponent, ModelComponent, RayCastTargetComponent } from "../../src/rect_game/components/render"
import { BodyComponent, PhysicsComponent, LocRotComponent  } from "../../src/rect_game/components/physics"
import { HUDDataComponent } from "../../src/rect_game/components/hud"
import { RenderSystem } from "../../src/rect_game/systems/render"
import { PhysicsMeshUpdateSystem, PhysicsSystem } from "../../src/rect_game/systems/physics"
import { HUDSystem } from "../../src/rect_game/systems/hud"
import { Vector3 } from "three"

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

    world.registerSystem(RenderSystem,{render_element_id:options.render_element})
    world.registerSystem(PhysicsSystem)
    world.registerSystem(PhysicsMeshUpdateSystem)
    world.registerSystem(HUDSystem)

    const e = world.createEntity()
    e.addComponent(ModelComponent)
    e.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
    e.addComponent(CameraFollowComponent,{offset: new Vector3(10,10,-10)})

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