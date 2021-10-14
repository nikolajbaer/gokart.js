import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render"
import { BodyComponent, KinematicCharacterComponent } from "../../../src/core/components/physics"
import { LocRotComponent } from "../../../src/core/components/position"
import { Vector3 } from "../../../src/core/ecs_types"
import { ActionListenerComponent, MouseListenerComponent, MouseLockComponent } from "../../../src/core/components/controls"
import { MoverComponent, OnGroundComponent } from "../../../src/common/components/movement"
import { AnimatedComponent, PlayActionComponent } from "../../../src/core/components/animated"
import { AnimatedMovementComponent } from "../../../src/common/components/animated_movement"
import { Physics3dScene } from "../../../src/scene/physics3d"
import { MovementSystem } from "../../../src/common/systems/movement"
import { AnimatedSystem } from "../../../src/core/systems/animated"
import { AnimatedMovementSystem } from "../../../src/common/systems/animated_movement"
import * as SimplexNoise from "simplex-noise"
import { HeightfieldDataComponent } from "../../../src/core/components/heightfield"
import { TerrainSystem } from "../../../src/common/systems/terrain"
import { TerrainTileComponent } from "../../../src/common/components/terrain"
import { OrbitControlComponent } from "../../../src/common/components/orbit_controls"
import { OrbitControlsSystem } from "../../../src/common/systems/orbit_controls"
import { DebugNormalComponent } from "../../../src/common/components/debug"
import { Debug3dSystem } from "../../../src/common/systems/debug"

import CHARACTER_GLB from "../assets/combined_character.glb";
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';

//    var effect = new OutlineEffect( renderer );

export class KinematicTestScene extends Physics3dScene {

    register_components(){
        super.register_components()
        this.world.registerComponent(MoverComponent)
        this.world.registerComponent(OnGroundComponent)
        this.world.registerComponent(OrbitControlComponent)
        this.world.registerComponent(AnimatedComponent)
        this.world.registerComponent(AnimatedMovementComponent)
        this.world.registerComponent(PlayActionComponent)
        this.world.registerComponent(DebugNormalComponent)
    }

    register_systems(){
        super.register_systems()
        this.world.registerSystem(MovementSystem)
        this.world.registerSystem(OrbitControlsSystem,{listen_element_id:this.render_element_id})
        this.world.registerSystem(Debug3dSystem)
        this.world.registerSystem(AnimatedSystem)
        this.world.registerSystem(AnimatedMovementSystem)
    }

    customize_renderer(renderer){
        const effect = new OutlineEffect( renderer)
        return effect
    }
    
    init_entities(){

        const g = this.world.createEntity()
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.BOX_TYPE,
            body_type: BodyComponent.STATIC,
            bounds: new Vector3(1000,1,1000),
        })
        g.addComponent( ModelComponent, {geometry:"box",material:0x111111,scale: new Vector3(1000,1,1000)})
        g.addComponent( LocRotComponent, { rotation: new Vector3(0,0,0), location: new Vector3(0,-0.5,0) } )
        g.name = "ground_plane"

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient",intensity:0.6})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(0,30,20),rotation: new Vector3(-Math.PI/4,0,0)})
        l2.addComponent(LightComponent,{type:"directional",cast_shadow:true,intensity:0.6})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{lookAt: new Vector3(0,0,1),current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(10,50,-50)})

        /*
        const sky = this.world.createEntity()
        sky.addComponent( ModelComponent, { geometry:"sky"})
        sky.addComponent( LocRotComponent )
        */

        // add a player
        const e = this.world.createEntity()
        e.addComponent(ModelComponent,{geometry:"character",scale: new Vector3(1,1,1)})
        e.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        e.addComponent(ActionListenerComponent)
        e.addComponent(BodyComponent,{
            body_type: BodyComponent.KINEMATIC_CHARACTER,
            bounds_type:BodyComponent.CYLINDER_TYPE,
            track_collisions:true,
            bounds: new Vector3(0.75,2,0.75),
            material: "player",
            mass: 0,
        })
        e.addComponent(MoverComponent,{
            speed:0.15,
            kinematic:true,
            turner:false,
            local:true,
            fly_mode: false,
            default_run: true,
        })
        e.addComponent(AnimatedComponent) 
        e.addComponent(AnimatedMovementComponent,{
            rest: "Idle",
            walk: "Walk",
            run: "Run",
            jump: "Jump",
            fall: "Fall",
        })
        e.addComponent(OrbitControlComponent,{offset:new Vector3(0,0,-10),min_polar_angle:Math.PI/10,max_polar_angle:Math.PI/2})
        e.addComponent(KinematicCharacterComponent,{
            jump_speed: 10,
            gravity: 20,
        })
        // TODO make touch control config more sensible
        if(!this.touch_enabled){
            e.addComponent(MouseLockComponent)
        }
        e.addComponent(MouseListenerComponent)
        e.name = "player"

        // create some ramps and platforms to test character controller on
        for(var i=0;i<5;i++){
            const box = this.world.createEntity()
            box.addComponent(ModelComponent,{geometry:"box",material:"ground",scale: new Vector3(10,10,10)})
            box.addComponent(BodyComponent,{
                mass:0,
                bounds:new Vector3(10,10,10),
                body_type:BodyComponent.STATIC,
                bounds_type:BodyComponent.BOX_TYPE,
            })
            box.addComponent(LocRotComponent,{
                location: new Vector3(10,0,10+i*20),
                rotation: new Vector3(Math.PI/180 * (i*15),Math.PI/180 * (i*15),0)
            })
        }

        // create a stair
        const stepHeight = 0.5 
        for(var i=0; i<20; i++){
            const box = this.world.createEntity()
            box.addComponent(ModelComponent,{geometry:"box",material:"ground",scale: new Vector3(4,stepHeight,stepHeight*2.5)})
            box.addComponent(BodyComponent,{
                mass:0,
                bounds:new Vector3(4,stepHeight,stepHeight*2.5),
                body_type:BodyComponent.STATIC,
                bounds_type:BodyComponent.BOX_TYPE,
            })
            box.addComponent(LocRotComponent,{
                location: new Vector3(-10,i*stepHeight,i*stepHeight*2.4),
            })
        }

        const density = 0.01
        for(var i=0; i<10; i++){
            const box = this.world.createEntity()
            const s = Math.random() * 2 + 1
            box.addComponent(ModelComponent,{geometry:"box",scale:new Vector3(s,s,s)})
            box.addComponent(LocRotComponent,{location: new Vector3(20 - Math.random()*40,10,20 - Math.random()*40)})
            box.addComponent(BodyComponent,{mass:s*s*s*density,bounds_type:BodyComponent.BOX_TYPE,bounds: new Vector3(s,s,s)})
        }
    }

    get_meshes_to_load(){
        return {
            "character":{ 
                url:CHARACTER_GLB,
                scale: 1,
                offset: new Vector3(0,-0.95,0),
            },
        }
    }
}
