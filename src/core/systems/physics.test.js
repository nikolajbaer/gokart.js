import { LocRotComponent } from "../components/position.js"
import { ModelComponent } from "../components/render.js"
import { initialize_test_world } from "../testing/game_helpers.js"
import { PhysicsSystem } from "./physics.js"
import { ApplyVelocityComponent, BodyComponent, CollisionComponent, KinematicCharacterComponent, PhysicsComponent, PhysicsControllerComponent, SetRotationComponent } from "../components/physics.js"
import { Vector3 } from "../ecs_types.js"
import test from 'ava'
import loadAmmo from "ammo.js/tests/helpers/load-ammo.js"

test.before(async t => loadAmmo())

/* NOTE can't seem to import node_modules ems modules. */
test('physics body entity map removes on entity removal', t => {
    const world = initialize_test_world(
        [{system:PhysicsSystem,attr:{ammo:Ammo}}],
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
    g.addComponent( BodyComponent ) 
    g.addComponent(LocRotComponent,{location:new Vector3(0,0,0),rotation: new Vector3(0,0,0)})
    
    const psys = world.getSystem(PhysicsSystem)

    t.true(psys.physics_world != null)

    psys.execute(1,1)

    // Now Physics body created
    t.true(g.hasComponent(PhysicsComponent))

    g.remove()
    psys.execute(1,2)
    // physics body is fully destroyed

    // Now this entity should be gone
    t.is(psys.queries.entities.results.length,0)

    // Now add a new entity
    const g1 = world.createEntity()
    g1.addComponent(BodyComponent) 
    g1.addComponent(LocRotComponent,{location:new Vector3(0,0,0),rotation: new Vector3(0,0,0)})

    psys.execute(1,3)
    t.true(g1.hasComponent(PhysicsComponent))
 
})