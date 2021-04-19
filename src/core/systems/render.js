import { System, Not } from "ecsy";
import { LocRotComponent } from "../components/physics"
import { Obj3dComponent, ModelComponent, CameraComponent, LightComponent } from "../components/render"
import * as THREE from "three"
import { Object3D } from "three";
        
export class RenderSystem extends System {
    init(attributes) {
        const scene = this.init_three_scene()
        const domElement = document.getElementById(attributes.render_element_id) 
        const renderer = this.init_three_renderer(domElement)

        this.geometries = (attributes && attributes.geometries)?attributes.geometries:BASE_GEOMETRIES
        this.materials = (attributes && attributes.materials)?attributes.materials:BASE_MATERIALS

        // todo make this size from the element
        console.log("setting size to ",window.innerWidth,window.innerHeight)
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
                const ambient = new THREE.AmbientLight( 0xeeeeee );
                this.scene.add( ambient );
                e.addComponent(Obj3dComponent,{obj:ambient})
                console.log("Creating ambient light")
                break
            case "point":
                const point = new THREE.PointLight( 0xffffff, 0.5, 100 );
                if( e.hasComponent(LocRotComponent)){
                    const location = e.getComponent(LocRotComponent).location
                    point.position.set( location.x,location.y, location.z );
                }
                point.castShadow = light.cast_shadow
                console.log("Creating point light",light.cast_shadow)
                this.scene.add(point)
                e.addComponent(Obj3dComponent,{obj:point})
                break
        }
    }

    create_camera(e){
        console.log("creating camera")
        const cam = e.getComponent(CameraComponent)
        const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const location = e.getComponent(LocRotComponent).location
        camera.position.set(location.x,location.y,location.z)
        if( cam.lookAt ){
            console.log("looking at ",cam.lookAt)
            camera.lookAt(cam.lookAt.x,cam.lookAt.y,cam.lookAt.z)
        }
        this.scene.add(camera)
        e.addComponent(Obj3dComponent,{ obj: camera })
    }

    get_geometry(name){
        return this.geometries[name]
    }

    get_material(name){
        return this.materials[name]
    }

    create_mesh(e){
        const loc = e.getComponent(LocRotComponent)
        const model = e.getComponent(ModelComponent)
        const mesh = new THREE.Mesh( this.get_geometry(model.geometry) , this.get_material(model.material))
        mesh.receiveShadow = model.shadow
        mesh.castShadow = model.shadow 
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

        if(this.queries.camera.results.length > 0){
            const e = this.queries.camera.results[0]
            const camera = e.getComponent(Obj3dComponent).obj
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
    remove: {
        components: [Not(ModelComponent),Obj3dComponent,Not(CameraComponent),Not(LightComponent)]
    },
}


export const BASE_GEOMETRIES = {
    "box": new THREE.BoxGeometry(),
    "sphere": new THREE.SphereGeometry(0.5),
    "plane": new THREE.PlaneGeometry(0,1,5,5),
    "ground": new THREE.PlaneGeometry(1000,1000, 50, 50),
}

export const BASE_MATERIALS = {
    "ground": new THREE.MeshLambertMaterial( { color: 0x333332 } ),
    "default": new THREE.MeshLambertMaterial( { color: 0x9999fe } ),
}
