import { System, World } from "ecsy"
//import "webgl-mock-threejs"

export function mock_renderer(){
    return {
        shadowMap: { enabled: false },
        setSize: function(width,height){ this.width=width; this.height=height; }
    }
}

export function initialize_test_world(systems,components){
    const world = new World()
    components.forEach( c => {
        world.registerComponent(c)
    })
    systems.forEach( s => {
        world.registerSystem(s.system,s.attr)
    })
    return world
}

export function entity_tracker(world,queries){
    class EntityQuerySystem extends System {}
    EntityQuerySystem.queries = queries 
    world.registerSystem(EntityQuerySystem)
    return world.getSystem(EntityQuerySystem)
}
