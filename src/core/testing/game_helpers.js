import { System, World } from "ecsy"
import * as CANNON from "cannon-es"

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

/* Create a simplified body to mock out physics component */
export function create_physics_body(){
    const body = new CANNON.Body({mass: 1});
    const shape = new CANNON.Sphere(1);
    body.addShape(shape);
    return body
}