import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls"
import { CollisionComponent, PhysicsComponent } from "../../core/components/physics"
import { OnGroundComponent, MoverComponent } from "../components/movement"
import * as THREE from "three"

// TODO break out into different movement types/systems (e.g. turner, strafer, jumper, globalmover )
// TODO https://github.com/pmndrs/cannon-es/blob/master/examples/threejs_fps.html
// reference for kinematic grav/collision https://github.com/pmndrs/cannon-es/blob/master/examples/js/PointerLockControlsCannon.js#L150
const UP = new THREE.Vector3(0,1,0)

export class MovementSystem extends System {
    execute(delta,time){
        this.queries.movers.results.forEach( e => {
            const actions =  e.getComponent(ActionListenerComponent).actions
            const body = e.getComponent(PhysicsComponent).body
            const mover = e.getMutableComponent(MoverComponent)

            const v = new THREE.Vector3()

            if(e.hasComponent(CollisionComponent)){
                let collision = e.getComponent(CollisionComponent)
                const contactNormal = new THREE.Vector3(collision.contact_normal.x,collision.contact_normal.y,collision.contact_normal.z)
                if (contactNormal.dot(UP) > 0.5 && !e.hasComponent(OnGroundComponent)) {
                    e.addComponent(OnGroundComponent) 
                }
            }

            if(actions.up){ v.z += actions.up }
            if(actions.down){ v.z -= actions.down }
            if(mover.turner){
                let av = 0
                if(actions.left){ av = 1
                }else if(actions.right){ av = -1 }
                //body.angularVelocity.y = mover.turn_speed * av
            }else{
                if(actions.left){ v.x += actions.left }
                if(actions.right){ v.x -= actions.right }
            }
            v.normalize()

            const speed = actions.shift?mover.speed*mover.run_mult:mover.speed
            let vel = v.multiplyScalar(speed)

            if( mover.local ){
                // we only move in X/Z, not Y
                const a = new THREE.Vector3()
                //body.quaternion.toEuler(a,'YZX')

                // Not sure why i can't figure out how to do this with CANNON.Vec3..
                const v = new THREE.Vector3(vel.x,vel.y,vel.z)
                v.applyAxisAngle(new THREE.Vector3(0,1,0),a.y)
                vel.x = v.x
                vel.y = v.y
                vel.z = v.z
            }

            // special case
            mover.current_reverse = (v.z < 0)

            if(actions.jump && e.hasComponent(OnGroundComponent)){
                vel.y = mover.jump_speed
                e.removeComponent(OnGroundComponent) 
            }else{
                //vel.y = body.velocity.y // maintain Y vel for gravity
            }

            if( mover.kinematic ){
                // only apply 0 vel to a kinematic body
                // allow dynamic body to come to a rest by itself
                /*if(vel.length() > 0 || body.type == CANNON.Body.KINEMATIC){
                    body.velocity = vel
                }*/
                if(actions.shift){
                    mover.current = "run"
                }else if(v.length() > 0){
                    mover.current = "walk"
                }else{
                    mover.current = "rest"
                }
            }else{
                //body.applyForce(vel,body.position)
            }

        })
    }
}

MovementSystem.queries = {
    movers: {
        components: [ActionListenerComponent,PhysicsComponent,MoverComponent]
    }
}