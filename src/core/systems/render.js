import { System, Not } from "ecsy";
import { LocRotComponent } from "../components/position"
import { Obj3dComponent, ModelComponent, CameraComponent, LightComponent, Project2dComponent } from "../components/render"
import * as THREE from "three"
        
export class RenderSystem extends System {
    init(attributes) {
        const scene = this.init_three_scene()
        const domElement = document.getElementById(attributes.render_element_id) 
        const renderer = this.init_three_renderer(domElement)

        if(attributes && attributes.mesh_creator){
            this.mesh_creator = attributes.mesh_creator
        }else{
            this.mesh_creator = new DefaultMeshCreator()
        }

        // todo make this size from the element
        //console.log("setting size to ",window.innerWidth,window.innerHeight)
        window.addEventListener('resize', e => {
            this.update_renderer_size(renderer,window.innerWidth,window.innerHeight)
        })
        this.update_renderer_size(renderer,window.innerWidth,window.innerHeight)

        this.renderer = renderer
        this.scene = scene
        window.scene = scene
    }

    update_renderer_size(renderer,width,height){
        if(this.queries.camera.results.length > 0){
            const camera = this.queries.camera.results[0].getComponent(Obj3dComponent).obj
            camera.aspect = width / height
            camera.updateProjectionMatrix()
        }
        renderer.setSize(width, height)
    }

    init_three_renderer(domElement){
        let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: domElement });
        renderer.shadowMap.enabled = true;

        return renderer;
     }
    
    init_three_scene(){
        let scene = new THREE.Scene();
        scene.fog = new THREE.Fog( 0x000000, 0, 500 );
        return scene
    }

    create_light(e){
        const light = e.getComponent(LightComponent)
        switch(light.type){
            case "ambient":
                const ambient = new THREE.AmbientLight( light.color );
                this.scene.add( ambient );
                e.addComponent(Obj3dComponent,{obj:ambient})
                break
            case "point":
                const point = new THREE.PointLight( light.color, light.intensity, light.decay );
                if( e.hasComponent(LocRotComponent)){
                    const location = e.getComponent(LocRotComponent).location
                    point.position.set( location.x,location.y, location.z );
                }
                point.castShadow = light.cast_shadow
                this.scene.add(point)
                e.addComponent(Obj3dComponent,{obj:point})
                break
        }
    }

    create_camera(e){
        const cam = e.getComponent(CameraComponent)
        const camera = new THREE.PerspectiveCamera( cam.fov, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const location = e.getComponent(LocRotComponent).location
        camera.position.set(location.x,location.y,location.z)
        camera.up = new THREE.Vector3(cam.upVec.x,cam.upVec.y,cam.upVec.z)
        if( cam.lookAt ){
            //console.log("looking at ",cam.lookAt)
            camera.lookAt(cam.lookAt.x,cam.lookAt.y,cam.lookAt.z)
        }
        this.scene.add(camera)
        e.addComponent(Obj3dComponent, { obj: camera })
    }

    create_mesh(e) {
        const loc = e.getComponent(LocRotComponent)
        const model = e.getComponent(ModelComponent)
        
        const mesh = this.mesh_creator.create_mesh(model.geometry,model.material,model.cast_shadow,model.receive_shadow)
        mesh.scale.set( model.scale.x,model.scale.y,model.scale.z)
        mesh.position.set(loc.location.x,loc.location.y,loc.location.z)
        this.scene.add( mesh )
        e.addComponent( Obj3dComponent, { obj: mesh })
    }

    execute(delta,time){
        // Initialize meshes for any uninitialized models
        this.queries.unitialized_meshes.results.forEach( e => {
            this.create_mesh(e)
        })
        this.queries.unitialized_lights.results.forEach( e => {
            this.create_light(e)
        })
        this.queries.unitialized_cameras.results.forEach( e => {
            this.create_camera(e)
        })

        // cleanup removed
        this.queries.remove.results.forEach( e => {
            const obj = e.getComponent(Obj3dComponent).obj
            if(obj.parent){
                obj.parent.remove(obj)
            }else{
                this.scene.remove(obj)
            }
            e.removeComponent(Obj3dComponent)
        })

        if(this.queries.camera.results.length > 0) {
            const e = this.queries.camera.results[0]
            const camera = e.getComponent(Obj3dComponent).obj

            this.queries.projectors.results.forEach( e => {
                const proj = e.getMutableComponent(Project2dComponent)
                const obj3d = e.getComponent(Obj3dComponent).obj
                const cpos = obj3d.position.clone()
                cpos.project(camera)
                proj.x = cpos.x
                proj.y = cpos.y
            })

            this.renderer.render( this.scene, camera )
        }
    }
}

RenderSystem.queries = {
    unitialized_meshes: {
        components: [ ModelComponent, LocRotComponent, Not(Obj3dComponent)]
    },
    unitialized_lights: {
        components: [ LightComponent, LocRotComponent, Not(Obj3dComponent)]
    },
    unitialized_cameras: {
        components: [ CameraComponent, LocRotComponent, Not(Obj3dComponent)]
    },
    camera: {
        components: [ CameraComponent, Obj3dComponent ]
    },
    projectors: {
        components: [ Project2dComponent ]
    },
    remove: {
        components: [Not(ModelComponent),Obj3dComponent,Not(CameraComponent),Not(LightComponent)]
    },
}


export class BaseMeshCreator {
    create_mesh(geometry,material){
        return new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshLambertMaterial({color: 0x9999fe }))
    }

    load(){
        // return a promise (in this case empty) to do "loading" work
        return Promise((resolve,reject) => resolve() )
    }
}

class DefaultMeshCreator extends BaseMeshCreator {
    BASE_GEOMETRIES = {
        "box": new THREE.BoxGeometry(),
        "sphere": new THREE.SphereGeometry(0.5),
        "plane": new THREE.PlaneGeometry(0,1,5,5),
        "ground": new THREE.PlaneGeometry(1000,1000, 50, 50),
    }

    BASE_MATERIALS = {
        "ground": new THREE.MeshLambertMaterial( { color: 0x333332 } ),
        "default": new THREE.MeshLambertMaterial( { color: 0x9999fe } ),
    }

    create_mesh(geometry,material,receiveShadow,castShadow){
        const m =new THREE.Mesh(
            this.BASE_GEOMETRIES[geometry],
            this.BASE_MATERIALS[material]?this.BASE_MATERIALS[material]:new THREE.MeshLambertMaterial({ color: material })
        )
        m.receiveShadow = receiveShadow
        m.castShadow = castShadow
        return m
    }
}
