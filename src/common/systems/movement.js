import { System } from "ecsy"
import { ActionListenerComponent } from "../../core/components/controls.js"
import { ApplyVelocityComponent, BodyComponent, JumpComponent, KinematicCharacterComponent, PhysicsComponent } from "../../core/components/physics.js"
import { OnGroundComponent, MoverComponent } from "../components/movement.js"
import * as THREE from "three"
import { Vector3 } from "three"
import { LocRotComponent } from "../../core/components/position.js"

// TODO break out into different movement types/systems (e.g. turner, strafer, jumper, globalmover )
// TODO https://github.com/pmndrs/cannon-es/blob/master/examples/threejs_fps.html
// reference for kinematic grav/collision https://github.com/pmndrs/cannon-es/blob/master/examples/js/PointerLockControlsCannon.js#L150
const UP = new THREE.Vector3(0,1,0)

export class MovementSystem extends System {
    execute(delta,time){
        this.queries.movers.results.forEach( e => {
            const actions =  e.getComponent(ActionListenerComponent).actions
            if(!actions){ return }

            const brot = e.getComponent(LocRotComponent).rotation
            const mover = e.getMutableComponent(MoverComponent)
            const body_type = e.getComponent(BodyComponent).body_type

            const av = new THREE.Vector3()
            const v = new THREE.Vector3()

            // Map actions to movement vector
            if(actions.up){ v.z += actions.up }
            if(actions.down){ v.z -= actions.down }
            if(actions.left){ v.x += actions.left }
            if(actions.right){ v.x -= actions.right }
            v.normalize()

            // Apply speed (walk or run)
            const run_mode = mover.default_run?!actions.shift:actions.shift
            const speed = run_mode?mover.speed*mover.run_mult:mover.speed
            let vel = v.multiplyScalar(speed)


            // If controls map to movement in local space (forward in direction player is facing)
            // then rotated this by our Y rotation (assuming not directed)
            if( mover.local ){
                // we only move in X/Z, not Y
                const v = new THREE.Vector3(vel.x,vel.y,vel.z)
                v.applyAxisAngle(new THREE.Vector3(0,1,0),brot.y)
                vel.x = v.x
                vel.y = v.y
                vel.z = v.z
            }

            // Track if we are going in "reverse" so we can reverse animations
            // and if we are running or walking
            mover.current_reverse = (v.z < 0)
            if(e.hasComponent(OnGroundComponent)){
                if(actions.shift){
                    mover.current = (mover.default_run)?"walk":"run"
                }else if(v.length() > 0){
                    mover.current = (mover.default_run)?"run":"walk"
                }else{
                    mover.current = "rest"
                }
            }else{
                if(e.hasComponent(JumpComponent)){
                    mover.current = "jump"
                }else{ 
                    //console.log("falling!")
                    mover.current = "fall"
                }
            }
            // TODO rework jump with btKinematicCharacterController
            if(mover.fly_mode){
                if(actions.jump){
                    vel.y = mover.jump_speed
                }else if(actions.crouch){
                    vel.y = -mover.jump_speed
                }
            }else{
                if(actions.jump && e.hasComponent(OnGroundComponent)){
                    if(!e.hasComponent(JumpComponent)){
                        //console.log("Adding jump")
                        e.addComponent(JumpComponent) 
                        mover.current = "jump"
                    }
                }
            }

            if( mover.kinematic ){
                // only apply 0 vel to a kinematic body
                // allow dynamic body to come to a rest by itself
                if(vel.length() > 0 || (body_type == BodyComponent.KINEMATIC || body_type == BodyComponent.KINEMATIC_CHARACTER )){
                    if(e.hasComponent(ApplyVelocityComponent)){
                        let appv = e.getMutableComponent(ApplyVelocityComponent)
                        appv.linear_velocity = new Vector3(vel.x,vel.y,vel.z)
                    }else{
                        e.addComponent(ApplyVelocityComponent,{
                            linear_velocity:new Vector3(vel.x,vel.y,vel.z),
                        })
                    }
                }else{
                    // slow down if we have existing velocity in kine.linear_velocity?
                }
            }else{
                // TODO ApplyForceComponent
            }

        })
    }
}

MovementSystem.queries = {
    movers: {
        components: [ActionListenerComponent,MoverComponent,BodyComponent]
    }
}