import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls"
import { ApplyVelocityComponent, PhysicsComponent } from "../../core/components/physics"
import { OnGroundComponent, MoverComponent } from "../components/movement"
import * as THREE from "three"
import { Vector3 } from "three"

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

            const av = new THREE.Vector3()
            const v = new THREE.Vector3()

            if(actions.up){ v.z += actions.up }
            if(actions.down){ v.z -= actions.down }
            if(mover.turner){
                let av = 0
                if(actions.left){ av = 1
                }else if(actions.right){ av = -1 }
                av.y = mover.turn_speed * av
            }else{
                if(actions.left){ v.x += actions.left }
                if(actions.right){ v.x -= actions.right }
            }
            v.normalize()

            const speed = actions.shift?mover.speed*mover.run_mult:mover.speed
            let vel = v.multiplyScalar(speed)

            if( mover.local ){
                // we only move in X/Z, not Y
                const bquat = body.rotation()
                const beul = new THREE.Euler() 
                beul.setFromQuaternion(new THREE.Quaternion(bquat.x,bquat.y,bquat.z,bquat.w),'YZX')
                const v = new THREE.Vector3(vel.x,vel.y,vel.z)
                v.applyAxisAngle(new THREE.Vector3(0,1,0),beul.y)
                vel.x = v.x
                vel.y = v.y
                vel.z = v.z
            }

            // special case, so we can reverse the animations.. probably a better way
            mover.current_reverse = (v.z < 0)

            if(mover.fly_mode){
                if(actions.jump){
                    vel.y = mover.jump_speed
                }else if(actions.crouch){
                    vel.y = -mover.jump_speed
                }
            }else{
                if(actions.jump && e.hasComponent(OnGroundComponent)){
                    vel.y = mover.jump_speed
                    e.removeComponent(OnGroundComponent) 
                }else{
                    vel.y = body.linvel().y // maintain Y vel for gravity
                }
            }

            if( mover.kinematic ){
                // only apply 0 vel to a kinematic body
                // allow dynamic body to come to a rest by itself
                if(vel.length() > 0 || body.isKinematic()){
                    if(e.hasComponent(ApplyVelocityComponent)){
                        let appv = e.getComponent(ApplyVelocityComponent)
                        appv.linear_velocity = new Vector3(vel.x,vel.y,vel.z)
                    }else{
                        e.addComponent(ApplyVelocityComponent,{
                            linear_velocity:new Vector3(vel.x,vel.y,vel.z),
                            angular_velocity:new Vector3(av.x,av.y,av.z)
                        })
                    }
                }

                // Keep track of our movement state for animations
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