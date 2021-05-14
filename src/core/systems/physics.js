import { System, Not } from "ecsy";
import { PhysicsComponent, BodyComponent } from "../components/physics.js"
import { HeightfieldDataComponent } from "../components/heightfield.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as CANNON from "cannon-es"

export class PhysicsSystem extends System {
    init(attributes) {
        this.physics_world = new CANNON.World()
        this.physics_world.gravity.set(0, (attributes && attributes.gravity != undefined)?attributes.gravity:-10, 0)
        console.log("Gravity",this.physics_world.gravity)

        if(attributes && attributes.collision_handler){
            this.collision_handler = attributes.collision_handler
        }else{
            this.collision_handler = null
        }

        if(attributes && attributes.contact_materials){
            this.contact_materials = attributes.contact_materials
        }else{
            this.contact_materials = {
                "ground": new CANNON.Material("ground"),
                "default": new CANNON.Material(),
                "player": new CANNON.Material({name:"player",friction:0.0,restitution: 0.00}),
            }
        }
    }

    create_physics_body(e){
        const body = e.getComponent(BodyComponent)
        const locrot = e.getComponent(LocRotComponent)

        const quat = new CANNON.Quaternion()
        quat.setFromEuler(locrot.rotation.x,locrot.rotation.y,locrot.rotation.z)

        let shape = null
        switch(body.bounds_type){
            case BodyComponent.BOX_TYPE:
                shape = new CANNON.Box(new CANNON.Vec3(body.bounds.x/2,body.bounds.y/2,body.bounds.z/2))
                break;
            case BodyComponent.PLANE_TYPE:
                shape = new CANNON.Plane()
                break;
            case BodyComponent.CYLINDER_TYPE:
                shape = new CANNON.Cylinder(body.bounds.x/2,body.bounds.x/2,body.bounds.y)
                break;
            case BodyComponent.HEIGHTFIELD_TYPE:
                if(!e.hasComponent(HeightfieldDataComponent)){ 
                    console.error("height field bodies must have a HeightfieldDataComponent, defaulting to a Plane") 
                    shape = new CANNON.Plane()
                }else{
                    const hfield = e.getComponent(HeightfieldDataComponent)
                    shape = new CANNON.Heightfield(hfield.data, { elementSize: hfield.element_size })
                    console.log(shape)
                }
                break
            default:
                shape = new CANNON.Sphere(body.bounds.x/2)
                break;
        }
        const mat = this.contact_materials[body.material]
        const body1  = new CANNON.Body({
            mass: body.mass, //mass
            material: mat,
            position: new CANNON.Vec3(locrot.location.x,locrot.location.y,locrot.location.z),
            quaternion: quat,
            type: body.body_type,
            velocity: new CANNON.Vec3(body.velocity.x,body.velocity.y,body.velocity.z),
            fixedRotation: body.fixed_rotation
        })
        if( body.fixed_rotation ){
            body1.updateMassProperties()
        }
        body1.linearDamping = 0.01
        body1.addShape(shape)
        body1.ecsy_entity = e // back reference for processing collisions
        if( body.track_collisions && this.collision_handler){ 
            body1.addEventListener("collide", event => {
                this.collision_handler(event.target.ecsy_entity,event.body.ecsy_entity,event.contact)
            })
        }
        this.physics_world.addBody(body1) 
        
        e.addComponent(PhysicsComponent, { body: body1 })

    }

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized.results.forEach( e => {
            this.create_physics_body(e)
        })

        // todo then remove any removed bodies
        this.queries.remove.results.forEach( e => {
            const body = e.getComponent(PhysicsComponent).body
            body.ecsy_entity = null // clear back reference
            this.physics_world.removeBody(body)
            e.removeComponent(PhysicsComponent)
        })

        this.physics_world.step(1/60,delta)
    }
 }

PhysicsSystem.queries = {
    uninitialized: { components: [LocRotComponent, BodyComponent, Not(PhysicsComponent)]},
    entities: { 
        components: [PhysicsComponent] ,
        listen: {
            removed: true
        }
    },
    remove: {
        components: [PhysicsComponent,Not(BodyComponent)]
    },
};


export class PhysicsMeshUpdateSystem extends System {
    execute(delta){
        let entities = this.queries.entities.results;
        entities.forEach( e => {
            const body = e.getComponent(PhysicsComponent).body
            const obj3d = e.getComponent(Obj3dComponent).obj
            const loc = e.getMutableComponent(LocRotComponent) 
            obj3d.position.copy(body.position)
            obj3d.quaternion.copy(body.quaternion)
            // update our locrot component
            loc.location.x = body.position.x
            loc.location.y = body.position.y
            loc.location.z = body.position.z
            loc.rotation.x = obj3d.rotation.x
            loc.rotation.y = obj3d.rotation.y
            loc.rotation.z = obj3d.rotation.z
        })
    }
}

PhysicsMeshUpdateSystem.queries = {
  entities: { components: [PhysicsComponent, Obj3dComponent] }
};