import { LocRotComponent } from "../components/position"
import { CameraComponent, LightComponent, ModelComponent, Obj3dComponent, Project2dComponent } from "../components/render"
import { RenderSystem } from "./render"
import { initialize_test_world } from "../testing/game_helpers"

/* NOTE can't seem to import node_modules ems modules. */
test('obj3d removes on entity removal', () => {
    const world = initialize_test_world(
        [{system:RenderSystem,attr:{render_element_id:"test_element"}}],
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
    
    rsys = world.getSystem(RenderSystem)

    // TODO add then remove entity to see it get cleaned up    
})