import { System, Not } from "ecsy";
import { LocRotComponent } from "../components/physics"
import { MeshComponent, ModelComponent, CameraFollowComponent, RayCastTargetComponent } from "../components/render"
import { GEOMETRIES, MATERIALS } from "../assets"
import * as THREE from "three"
        
export class RenderSystem extends System {
    init(attributes) {
        const domElement = document.getElementById(attributes.render_element_id) 
        const renderer = this.init_three_renderer(domElement)
        const scene = this.init_three_scene()
        const camera = this.init_three_camera()
        this.init_scene_lights(scene)

        // todo make this size from the element
        console.log("setting size to ",window.innerWidth,window.innerHeight)
        window.addEventListener('resize', e => {
            this.update_renderer_size(camera,renderer,window.innerWidth,window.innerHeight)
        })
        this.update_renderer_size(camera,renderer,window.innerWidth,window.innerHeight)

        this.renderer = renderer
        this.scene = scene
        this.camera = camera

        // TODO maybe make this component?
        const cam_holder = new THREE.Object3D()
        cam_holder.add(camera)
        this.cam_holder = cam_holder

    }

    update_renderer_size(camera,renderer,width,height){
        camera.aspect = width / height
        camera.updateProjectionMatrix()
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

    // todo make this components
    init_scene_lights(scene){
        // Scene Lighting
        var ambient = new THREE.AmbientLight( 0xeeeeee );
        scene.add( ambient );
        var light = new THREE.PointLight( 0xffffff, 0.5, 100 );
        light.position.set( 10, 30, 0 );
        light.castShadow = true;
        scene.add( light );
    }

    init_three_camera(){
        const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
        return camera
    }

    create_mesh(e){
        const loc = e.getComponent(LocRotComponent)
        const model = e.getComponent(ModelComponent)
        const mesh = new THREE.Mesh( GEOMETRIES[model.geometry] , MATERIALS[model.material])
        mesh.receiveShadow = model.shadow
        mesh.castShadow = model.shadow 
        mesh.scale.set( model.scale.x,model.scale.y,model.scale.z)
        mesh.position.set(loc.location.x,loc.location.y,loc.location.z)
        this.scene.add( mesh )
        e.addComponent( MeshComponent, { mesh: mesh })
    }

    execute(delta,time){
        // Initialize meshes for any uninitialized models
        this.queries.unitialized.results.forEach( e => {
            this.create_mesh(e)
        })

        // track camera for anny cam follows
        this.queries.camera_follow.results.forEach( e => {
            const follow = e.getComponent(CameraFollowComponent)
            const pos = e.getComponent(MeshComponent).mesh.position

            this.cam_holder.position.set( 
                pos.x + follow.offset.x,
                pos.y + follow.offset.y,
                pos.z + follow.offset.z
            )
            this.camera.lookAt(pos);

        })

        // cleanup removed
        this.queries.remove.results.forEach( e => {
            const mesh = e.getComponent(MeshComponent).mesh
            this.scene.remove(mesh)
            e.removeComponent(MeshComponent)
        })

        this.renderer.render( this.scene, this.camera )
    }
}

RenderSystem.queries = {
    unitialized: {
        components: [ ModelComponent, LocRotComponent, Not(MeshComponent)]
    },
    camera_follow: {
        components: [ CameraFollowComponent, MeshComponent ] // Maybe camera follow component?
    },
    raycasts: {
        components: [ RayCastTargetComponent, MeshComponent ]
    },
    entities: {
        components: [MeshComponent],
        listen: {
            removed: true,
        }
    },
    remove: {
        components: [Not(ModelComponent),MeshComponent]
    }
}
