//import { BodyComponent, KinematicColliderComponent, LocRotComponent, PhysicsComponent } from "../components/physics"
import { LocRotComponent } from "../components/position"
import { ModelComponent } from "../components/render"
import { RenderSystem } from "./render"
import { initialize_test_world } from "../testing/game_helpers"
//import { PhysicsSystem } from "./physics"

test('hello test world', () => {
    var x = 1+2
})

/* NOTE can't seem to import node_modules ems modules. */
test('physics body entity map removes on entity removal', () => {
    const world = initialize_test_world(
        [],
        [LocRotComponent,ModelComponent]
    )

    const p = world.createEntity()
    //p.addComponent(BodyComponent)
    p.addComponent(ModelComponent)
    //p.addComponent(KinematicColliderComponent)

    const g = world.createEntity()
    /*
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.BOX_TYPE,
        body_type: BodyComponent.STATIC,
        bounds: new Vector3(1000,1,1000),
        collision_groups: 0xffff0002,
    }) */
    g.addComponent(ModelComponent)
    //g.addComponent(KinematicColliderComponent)
    
    //psys = world.getSystem(PhysicsSystem)
    // TODO add then remove entity to see it get cleaned up    
})