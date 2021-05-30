import { BodyComponent, KinematicColliderComponent, LocRotComponent, PhysicsComponent } from "../components/physics"
import { ModelComponent } from "../components/render"
import { initialize_test_world, create_physics_body } from "../testing/game_helpers"
import { PhysicsSystem } from "./physics"

test('physics body entity map removes on entity removal', () => {
    const world = initialize_test_world(
        [PhysicsSystem],
        [PhysicsComponent,BodyComponent,LocRotComponent,ModelComponent]
    )

    const p = world.createEntity()
    p.addComponent(BodyComponent)
    p.addComponent(ModelComponent)
    p.addComponent(KinematicColliderComponent)

    const g = world.createEntity()
    g.addComponent( BodyComponent, {
        mass: 0,
        bounds_type: BodyComponent.BOX_TYPE,
        body_type: BodyComponent.STATIC,
        bounds: new Vector3(1000,1,1000),
        collision_groups: 0xffff0002,
    }) 
    g.addComponent(ModelComponent)
    g.addComponent(KinematicColliderComponent)
    
    psys = world.getSystem(PhysicsSystem)
    weaponsys.fire(e,e.getMutableComponent(GunComponent),player_body,0)
    expect(e.getComponent(GunComponent).ammo).toBe(4)
    weaponsys.fire(e,e.getMutableComponent(GunComponent),player_body,0)
    weaponsys.fire(e,e.getMutableComponent(GunComponent),player_body,0)
    expect(e.getComponent(GunComponent).ammo).toBe(2)
    
})