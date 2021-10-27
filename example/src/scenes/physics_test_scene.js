import { CameraComponent,  ModelComponent, LightComponent  } from "../../../src/core/components/render.js"
import { BodyComponent } from "../../../src/core/components/physics.js"
import { LocRotComponent } from "../../../src/core/components/position.js"
import { Vector3 } from "../../../src/core/ecs_types.js"
import { Physics3dScene } from "../../../src/scene/physics3d.js"
import { OrbitControlComponent } from "../../../src/common/components/orbit_controls.js"
import { TerrainSystem } from "../../../src/common/systems/terrain.js"
import { TerrainTileComponent } from "../../../src/common/components/terrain.js"
import { OrbitControlsSystem } from "../../../src/common/systems/orbit_controls.js"
import { HUDDataComponent } from "../../../src/core/components/hud.js"
import { HeightfieldDataComponent } from "../../../src/core/components/heightfield.js"
import { MouseListenerComponent, MouseLockComponent } from "../../../src/core/components/controls.js"
import { System } from 'ecsy'
import { ActionListenerComponent } from "../../../src/core/components/controls.js"
import { PhysicsComponent } from "../../../src/core/components/physics.js"

// quick system to remove a body when you click  to test object additional / removal
class RespawnOnClickSystem extends System {
    init(attributes){
        this.cooldown = 0 
    }

    execute(delta,time){
        this.queries.action_listeners.results.forEach( e => {
            const actions = e.getComponent(ActionListenerComponent).actions
            if(actions.jump && this.cooldown + 1500 >= time ){
                if(this.queries.bodies.results.length > 0){
                    const e1 = this.queries.bodies.results[0]
                    console.log("removing an entity",e1.id)
                    e1.remove()
                    this.cooldown = time

                    // spawn new cube
                    console.log("and spawning a new one")
                    const e2 = this.world.createEntity()
                    e2.addComponent(LocRotComponent,{location:new Vector3(0,10,0),rotaiton: new Vector3(0,0,0)})
                    e2.addComponent(BodyComponent)
                    e2.addComponent(ModelComponent)
                }
            }
        })
    }
}
RespawnOnClickSystem.queries = {
    action_listeners: {
        components: [ActionListenerComponent]
    },
    bodies: {
        components: [PhysicsComponent],
    }
}

export class PhysicsTestScene extends Physics3dScene {
    register_components(){
        super.register_components()
        this.world.registerComponent(OrbitControlComponent)
        this.world.registerComponent(TerrainTileComponent)
    }
    
    register_systems(){
        super.register_systems()
        this.world.registerSystem(OrbitControlsSystem,{listen_element_id:this.render_element_id})
        this.world.registerSystem(TerrainSystem)
        this.world.registerSystem(RespawnOnClickSystem)
    }

    generateHeight( width, depth, minHeight, maxHeight ) {

        // Generates the height data (a sinus wave)

        var size = width * depth;
        var data = new Float32Array( size );

        var hRange = maxHeight - minHeight;
        var w2 = width / 2;
        var d2 = depth / 2;
        var phaseMult = 12;

        var p = 0;
        for ( var j = 0; j < depth; j ++ ) {
            for ( var i = 0; i < width; i ++ ) {

                var radius = Math.sqrt(
                    Math.pow( ( i - w2 ) / w2, 2.0 ) +
                    Math.pow( ( j - d2 ) / d2, 2.0 ) );

                var height = ( Math.sin( radius * phaseMult ) + 1 ) * 0.5  * hRange + minHeight;

                data[ p ] = height;

                p++;
            }
        }

        return data;

    }


    init_entities(){

        //let height_data = this.generateHeight(100,100,-2,8)

        /*let height_data = new Float32Array([0,-1,0,0,-5,0,0,-1,0])*/

        const terrain_n =4
        let height_data = new Float32Array(Math.pow(terrain_n*2,2))
        let i = 0
        for(let y=-terrain_n;y<terrain_n;y++){
            for(let x=-terrain_n;x<terrain_n;x++){
                height_data[i] = 0.5 * ((x*x) + (y*y))
                i++
            }
        }
        const g = this.world.createEntity()

        /*
        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.BOX_TYPE,
            body_type: BodyComponent.STATIC,
            bounds: new Vector3(100,1,100),
        })
        g.addComponent( ModelComponent, { material: "ground", scale: new Vector3(100,1,100)})
        g.addComponent( LocRotComponent, { location: new Vector3(0,-0.5,0) } )
        g.name = "ground_plane"
        */

        g.addComponent( BodyComponent, {
            mass: 0,
            bounds_type: BodyComponent.HEIGHTFIELD_TYPE,
            body_type: BodyComponent.STATIC,
        })
        g.addComponent( HeightfieldDataComponent, {
            data: height_data,
            width: Math.sqrt(height_data.length),
            height: Math.sqrt(height_data.length),
            scale: new Vector3(150,1,150),
        })
        g.addComponent( ModelComponent, {geometryx:"terrain",material:"ground"})
        g.addComponent( TerrainTileComponent )
        g.addComponent( LocRotComponent,{location: new Vector3(0,0,0)})

        const l1 = this.world.createEntity()
        l1.addComponent(LocRotComponent,{location: new Vector3(0,0,0)})
        l1.addComponent(LightComponent,{type:"ambient"})

        const l2 = this.world.createEntity()
        l2.addComponent(LocRotComponent,{location: new Vector3(10,30,0)})
        l2.addComponent(LightComponent,{type:"point",cast_shadow:true,intensity:0.8})

        const c = this.world.createEntity()
        c.addComponent(CameraComponent,{current: true, fov:60})
        c.addComponent(LocRotComponent,{location: new Vector3(0,0,0), rotation: new Vector3(0,0,0)})

        // orbit center
        const e = this.world.createEntity()
        e.addComponent(LocRotComponent)
        e.addComponent(OrbitControlComponent,{offset:new Vector3(0,0,100)})
        e.addComponent(MouseListenerComponent)
        e.addComponent(ActionListenerComponent)
        // TODO make touch control config more sensible
        if(!this.touch_enabled){
            e.addComponent(MouseLockComponent)
        }
        e.addComponent(HUDDataComponent,{fps:0})

        const density = 1
        const n = 5  // enough to really hurt, 14*14*14= 2744 spheres,cubes and cylinders..
        const sp = 4
        const variations = [
            {g:"box",b:BodyComponent.BOX_TYPE},
            {g:"sphere",b:BodyComponent.SPHERE_TYPE},
            {g:"cylinder",b:BodyComponent.CYLINDER_TYPE},
        ] 
        for(var x=0; x<n; x++){
            for(var y =0; y<n; y++){
                for(var z=0; z<n; z++){
                    const box = this.world.createEntity()
                    const s = 2 
                    let t = variations[Math.round(Math.random()*(variations.length-1))]
                    box.addComponent(ModelComponent,{geometry:t.g,scale:new Vector3(s,s,s)})
                    box.addComponent(LocRotComponent,{location: new Vector3((n/2*sp) - x * sp,sp*8 + y * sp, (n/2*sp) - z * sp)})
                    box.addComponent(BodyComponent,{mass:s*s*s*density,bounds_type:t.b,bounds: new Vector3(s,s,s)})
                }
            }
        }

    }
}
