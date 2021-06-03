import { System, World } from "ecsy"

export function initialize_test_world(systems,components){
    const world = new World()
    components.forEach( c => {
        world.registerComponent(c)
    })
    systems.forEach( s => {
        world.registerSystem(s)
    })
    return world
}

export function entity_tracker(world,queries){
    class EntityQuerySystem extends System {}
    EntityQuerySystem.queries = queries 
    world.registerSystem(EntityQuerySystem)
    return world.getSystem(EntityQuerySystem)
}
