import { System, Not } from "ecsy";
import { LocRotComponent } from "../components/position"
import { Obj3dComponent, ModelComponent, CameraComponent, LightComponent, Project2dComponent } from "../components/render"
import * as THREE from "three"
import { DefaultMeshCreator } from "../asset_creator/mesh_creator"
        
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
            // TOOD maybe let the camera specify if it wants to track the viewport aspect ratio
            const camera = this.queries.camera.results[0].getComponent(Obj3dComponent).obj.camera
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
            case "directional":
                const holder = new THREE.Object3D()
                const dir = new THREE.DirectionalLight( light.color, light.intensity )
                holder.add(dir)
                dir.castShadow = light.cast_shadow
                if( e.hasComponent(LocRotComponent)){
                    const location = e.getComponent(LocRotComponent).location
                    dir.position.set( location.x,location.y, location.z );
                    const rotation = e.getComponent(LocRotComponent).rotation
                    const target = new THREE.Vector3(0,0,1)
                    const tpos = target.applyEuler( new THREE.Euler(rotation.x,rotation.y, rotation.z ,'YZX'))
                    const t = new THREE.Object3D()
                    t.position.set(tpos.x,tpos.y,tpos.z)
                    holder.add(t)
                    dir.target = t
                    // TODO create obj3d target 
                }
                if(light.cast_shadow){
                    // todo make htis customizeable
                    dir.shadow.mapSize.width = 1024; // default
                    dir.shadow.mapSize.height = 1024; // default
                    dir.shadow.camera.near = 0.5; // default
                    dir.shadow.camera.far = 1000; // default
                }
                const helper = new THREE.DirectionalLightHelper( dir, 5 );
                holder.add( helper );
                this.scene.add(holder)
                e.addComponent(Obj3dComponent, {obj:holder})
                break
        }
    }

    create_camera(e){
        const cam = e.getComponent(CameraComponent)
        const camera = new THREE.PerspectiveCamera( cam.fov, window.innerWidth / window.innerHeight, 0.1, 1000 );
        const location = e.getComponent(LocRotComponent).location
        camera.up = new THREE.Vector3(cam.upVec.x,cam.upVec.y,cam.upVec.z)
        if( cam.lookAt ){
            //console.log("looking at ",cam.lookAt)
            camera.lookAt(cam.lookAt.x,cam.lookAt.y,cam.lookAt.z)
        }
        // many things are easier if the camera is contained in a holder
        const cam_holder = new THREE.Object3D()
        cam_holder.camera = camera
        cam_holder.position.set(location.x,location.y,location.z)
        cam_holder.add(camera)
        this.scene.add(cam_holder)
        e.addComponent(Obj3dComponent, { obj: cam_holder })
    }

    create_mesh(e) {
        const loc = e.getComponent(LocRotComponent)
        const model = e.getComponent(ModelComponent)
        
        const mesh = this.mesh_creator.create_mesh(model.geometry,model.material,model.cast_shadow,model.receive_shadow,e)
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
            const camera = e.getComponent(Obj3dComponent).obj.camera

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
