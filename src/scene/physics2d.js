import { Body2dComponent, Collision2dComponent, Joint2dComponent, Physics2dComponent, PhysicsJoint2dComponent } from "../core/components/physics2d"
import { Physics2dMeshUpdateSystem, Physics2dSystem } from "../core/systems/physics2d"
import { BaseScene } from "./scene.js"

export class Physics2dScene extends BaseScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(Body2dComponent)
        this.world.registerComponent(Physics2dComponent)
        this.world.registerComponent(Joint2dComponent)
        this.world.registerComponent(Collision2dComponent)
        this.world.registerComponent(PhysicsJoint2dComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(Physics2dMeshUpdateSystem,{z_up:false})
        this.world.registerSystem(Physics2dSystem,{world_attributes:this.get_world_attributes()})
    }

    handle_collision(entity_a,entity_b,contact){
    }

    contact_materials(){
        return {}
    }

    get_world_attributes(){
        return {}
    }
}