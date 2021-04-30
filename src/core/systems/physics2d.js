import { System, Not } from "ecsy";
import { Physics2dComponent, Body2dComponent, Collision2dComponent, Joint2dComponent, PhysicsJoint2dComponent } from "../components/physics2d.js"
import { LocRotComponent } from "../components/position.js"
import { Obj3dComponent } from "../components/render.js"
import * as pl from "planck-js"

export class Physics2dSystem extends System {
    init(attributes) {
        this.physics_world = pl.World((attributes && attributes.world_attributes)?attributes.world_attributes:{});

        this.physics_world.on('begin-contact', contact => {
            this.begin_contact(contact)
        })

        this.physics_world.on('end-contact', contact => {
            this.end_contact(contact)
        })

        this.physics_world.on('post-solve', (contact, contactImpulse) => {
            this.post_solve(contact, contactImpulse)
        })

        if(attributes && attributes.collision_handler){
            this.collision_handler = attributes.collision_handler
        }
    }

    begin_contact(contact){

    }

    end_contact(contact){
    }

    track_collision(entity_a,entity_b,contactImpulse){
        if(entity_a.hasComponent(Collision2dComponent)){
            const c2c = entity_a.getMutableComponent(Collision2dComponent)
            c2c.entity = entity_b
            c2c.normal_impulse = contactImpulse.normalImpulses[0]
            c2c.tan_impulse = contactImpulse.tangentImpulses[0]
        }else{
            entity_a.addComponent(Collision2dComponent,{
                entity: entity_b, 
                normal_impulse: contactImpulse.normalImpulses[0],
                tan_impulse: contactImpulse.tangentImpulses[0],
            }) 
        }
        //console.log(entity_a.name,entity_b.name,contactImpulse)
    }

    post_solve(contact, contactImpulse){
        const eA = contact.getFixtureA().getBody().getUserData() 
        const eB = contact.getFixtureB().getBody().getUserData() 
        const bodyA = eA.getComponent(Body2dComponent)
        if(bodyA.track_collisions){
            this.track_collision(eA,eB,contactImpulse)
        }
        const bodyB = eB.getComponent(Body2dComponent)
        if(bodyB.track_collisions){
            this.track_collision(eB,eA,contactImpulse)
        }
    }

    create_physics_body(e){
        const body = e.getComponent(Body2dComponent)
        const locrot = e.getComponent(LocRotComponent)

        const bdef = {
            position: new pl.Vec2(locrot.location.x,locrot.location.y),
            type: body.body_type,
            userData: e,
            linearVelocity: new pl.Vec2(body.velocity.x,body.velocity.y),
            mass: body.mass,
        }
        let body1 = this.physics_world.createBody(bdef)
        switch(body.bounds_type){
            case "box":
                body1.createFixture({
                    shape:pl.Box(body.width,body.height),
                    density: body.density,
                    friction: body.friction,
                })
            default:
                body1.createFixture({
                    shape:pl.Circle(body.width/2),
                    density: body.density,
                    friction: body.friction,
                })
                break;
        }

        e.addComponent(Physics2dComponent, { body: body1 })
    }

    create_physics_joint(e){
        const joint = e.getComponent(Joint2dComponent)
        if(!joint.entity.alive || !joint.entity.hasComponent(Physics2dComponent)){
            console.error("Attempt to create physics2d joint to non-physics entity or dead entity")
            e.removeComponent(Joint2dComponent) 
        }
        const body = e.getComponent(Physics2dComponent).body
        const body1 = joint.entity.getComponent(Physics2dComponent).body

        switch(joint.joint_type){
            case "weld":
                console.log("welding ",body,body1)
                const j = this.physics_world.createJoint(pl.WeldJoint(joint.joint_config,body,body1,joint.anchor_a))
                console.log("New Joint:",j,j.getLocalAnchorA(),j.getLocalAnchorB())
                e.addComponent(PhysicsJoint2dComponent,{joint:j})
                break;
            default:
                console.error("Unknown/Unsupported joint type:",joint.joint_type)
                e.removeComponent(Joint2dComponent)
                break;
        }
    }

    execute(delta,time){
        if(!this.physics_world) return

        // first intialize any uninitialized bodies
        this.queries.uninitialized_bodies.results.forEach( e => {
            this.create_physics_body(e)
        })

        // todo then remove any removed bodies
        this.queries.remove_bodies.results.forEach( e => {
            const body = e.getComponent(Physics2dComponent).body
            this.physics_world.destroyBody(body)
            e.removeComponent(Physics2dComponent)
        })

        this.queries.uninitialized_joints.results.forEach( e => {
            this.create_physics_joint(e)
        })

        this.queries.remove_joints.results.forEach( e => {
            const joint = e.getComponent(PhysicsJoint2dComponent).joint
            this.physics_world.destroyJoint(joint)
            e.removeComponent(PhysicsJoint2dComponent)
        })

        this.physics_world.step(1/60,5,2)

    }
 }

Physics2dSystem.queries = {
    uninitialized_bodies: { components: [LocRotComponent, Body2dComponent, Not(Physics2dComponent)]},
    entities: { 
        components: [Physics2dComponent] ,
        listen: {
            removed: true
        }
    },
    remove_bodies: {
        components: [Physics2dComponent,Not(Body2dComponent)]
    },
    uninitialized_joints: { components: [Joint2dComponent, Not(PhysicsJoint2dComponent)]},
    remove_joints: { 
        components: [PhysicsJoint2dComponent,Not(Joint2dComponent)]
    }
};


export class Physics2dMeshUpdateSystem extends System {
    execute(delta){
        let entities = this.queries.entities.results;
        entities.forEach( e => {
            const body = e.getComponent(Physics2dComponent).body
            const obj3d = e.getComponent(Obj3dComponent).obj
            const loc = e.getMutableComponent(LocRotComponent) 
            const pos = body.getPosition()
            const ang =body.getAngle()
            obj3d.position.x = pos.x
            obj3d.position.y = pos.y
            obj3d.rotation.z = ang

            if(loc){ // might be gone on final removal
                loc.location.x = pos.x
                loc.location.y = pos.y
                loc.location.z = 0 
                loc.rotation.z = ang
            }
        })
    }
}

Physics2dMeshUpdateSystem.queries = {
  entities: { components: [Physics2dComponent, Obj3dComponent] }
};