import { LocRotComponent } from "../components/position"
import { ModelComponent } from "../components/render"
import { RenderSystem } from "./render"
import { initialize_test_world } from "../testing/game_helpers"
import { PhysicsSystem } from "./physics"
import { ApplyVelocityComponent, BodyComponent, CollisionComponent, KinematicCharacterComponent, PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../components/physics"
import { Vector3 } from "../ecs_types"

/* NOTE can't seem to import node_modules ems modules. */
test('physics body entity map removes on entity removal', () => {
    const world = initialize_test_world(
        [{system:PhysicsSystem,attr:{}}],
        [
            LocRotComponent,
            BodyComponent,
            ModelComponent,
            PhysicsComponent,
            PhysicsControllerComponent,
            SetRotationComponent,
            CollisionComponent,
            KinematicCharacterComponent,
            ApplyVelocityComponent,
        ]
    )

    // add ground plane
    const g = world.createEntity()
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.BOX_TYPE,
        body_type: BodyComponent.STATIC,
        bounds: new Vector3(1000,1,1000),
    }) 
    
    psys = world.getSystem(PhysicsSystem)

    psys.execute(1,1)

    // TODO add then remove entity to see it get cleaned up    
})