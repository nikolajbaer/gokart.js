import { LocRotComponent } from "../components/position"
import { ModelComponent } from "../components/render"
import { RenderSystem } from "./render"
import { initialize_test_world } from "../testing/game_helpers"
import { PhysicsSystem } from "./physics"
import { ApplyVelocityComponent, BodyComponent, CollisionComponent, KinematicCharacterComponent, PhysicsComponent, SetRotationComponent } from "../components/physics"

/*
test('rapier loads', () => {
    import('@dimforge/rapier3d').then(RAPIER => {
      // Use the RAPIER module here.       
      assertTrue(RAPIER != null)     
    })
})
*/
test('physics currently not testable', () => {
    // dang.
})

/* NOTE can't seem to import node_modules ems modules. */
/*
test('physics body entity map removes on entity removal', () => {
    const world = initialize_test_world(
        [PhysicsSystem],
        [
            LocRotComponent,
            BodyComponent,
            ModelComponent,
            PhysicsComponent,
            SetRotationComponent,
            CollisionComponent,
            KinematicCharacterComponent,
            ApplyVelocityComponent,
        ]
    )

    const p = world.createEntity()
    p.addComponent(BodyComponent)
    p.addComponent(ModelComponent)

    const g = world.createEntity()
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.BOX_TYPE,
        body_type: BodyComponent.STATIC,
        bounds: new Vector3(1000,1,1000),
        collision_groups: 0xffff0002,
    }) 
    g.addComponent(ModelComponent)
    g.addComponent(KinematicCharacterComponent)
    
    psys = world.getSystem(PhysicsSystem)
    // TODO add then remove entity to see it get cleaned up    
})
*/