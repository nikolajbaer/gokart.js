/**
 * @jest-environment jsdom
 */
import { LocRotComponent } from "../components/position.js"
import { CameraComponent, LightComponent, ModelComponent, Obj3dComponent, Project2dComponent } from "../components/render.js"
import { RenderSystem } from "./render.js"
import { initialize_test_world,mock_renderer } from "../testing/game_helpers.js"
import * as THREE from "three"


/* NOTE can't seem to import node_modules ems modules. */
test('obj3d removes on entity removal', () => {
    const world = initialize_test_world(
        [{system:RenderSystem,attr:{renderer:mock_renderer()}}],
        [
            LocRotComponent,
            ModelComponent,
            Obj3dComponent,
            LightComponent,
            CameraComponent,
            Project2dComponent,
        ]
    )

    // add ground plane
    const g = world.createEntity()
    g.addComponent( ModelComponent ) 
    g.addComponent( LocRotComponent )
    
    rsys = world.getSystem(RenderSystem)
    world.execute(1,1)
    const three_scene = rsys.scene

    expect(rsys.queries.meshes.results.filter( e => e.id == g.id)[0]).toBe(g)
    expect(g.hasComponent(Obj3dComponent)).toBe(true)
    const obj3d = g.getComponent(Obj3dComponent).obj
    expect(three_scene.children.includes(obj3d)).toBe(true)
    g.remove()
    world.execute(1,1)

    expect(g.alive).toBe(false)
    expect(rsys.queries.meshes.results.filter( e => e.id == g.id).length).toBe(0)
    expect(three_scene.children.includes(obj3d)).toBe(false)
})