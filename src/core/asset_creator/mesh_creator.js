import * as THREE from "three";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class BaseMeshCreator {
    create_mesh(geometry,material){
        return new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({color: 0x9999fe }))
    }

    load(){
        // return a promise (in this case empty) to do "loading" work
        return Promise((resolve,reject) => resolve() )
    }
}

export class DefaultMeshCreator extends BaseMeshCreator {
    PREFABS = {
        // geometry_name: {url:"glb_url",animation_urls:["anim_fbx_url",..], obj:null,animations:null}
    }
    FUNCTIONS = { // useful for procgen or compound geometry
//        "name": function(entity,material,receiveShadow,castShadow){
//            return new THREE.Object3D()
//        }
    }
    BASE_GEOMETRIES = {
        "box": new THREE.BoxGeometry(),
        "sphere": new THREE.SphereGeometry(0.5),
        "cylinder": new THREE.CylinderGeometry(0.5,0.5,1,32),
        "plane": new THREE.PlaneGeometry(0,1,5,5),
        "ground": new THREE.PlaneGeometry(1000,1000, 50, 50),
    }

    BASE_MATERIALS = {
        "ground": new THREE.MeshStandardMaterial( { color: 0x333332, side: THREE.DoubleSide} ),
        "default": new THREE.MeshStandardMaterial( { color: 0x9999fe } ),
        // useful for FPS character, from https://stackoverflow.com/a/50163740
        "invisible": new THREE.MeshBasicMaterial({color:0xff00ff,colorWrite:false,depthWrite:false}), 
    }

    import_glb(prefab,glb){
        const scene = glb.scene
        //console.log("glb loaded ",gltf)
        if(prefab.scale){
            scene.scale.set(prefab.scale,prefab.scale,prefab.scale)
        }
        if(prefab.offset){
            scene.position.set(
                prefab.offset.x,
                prefab.offset.y,
                prefab.offset.z,
            )
        }
        prefab.obj = scene

        if(glb.animations){
            scene.animations = glb.animations;
        }

        console.log("loaded ",prefab.url," with scale ",prefab.scale,prefab.obj)
    }

    import_fbx(prefab,fbx){
        const scene = fbx
        console.log(fbx)
        if(prefab.scale){
            scene.scale.multiplyScalar(prefab.scale)
        }
        if(prefab.offset){
            scene.position.set(
                prefab.offset.x,
                prefab.offset.y,
                prefab.offset.z,
            )
        }
        prefab.obj = scene
    
        if(fbx.animations){
            scene.animations = fbx.animations;
        }
    
        console.log("loaded ",prefab.url," with scale ",prefab.scale,prefab.obj)
    }

    load(){
        const manager = new THREE.LoadingManager()
        const glb_loader = new GLTFLoader(manager)
        const fbx_loader = new FBXLoader(manager)

        return new Promise((all_resolve,all_reject) => {
            return Promise.all(
                Object.values(this.PREFABS).map( prefab => {
                    return new Promise((resolve,reject) => {
                        if( prefab.url.match(/.*\.glb/i)){
                            glb_loader.load(prefab.url, (glb) =>{
                                this.import_glb(prefab,glb)
                                if(prefab.animation_urls){

                                }else{
                                    resolve()
                                }
                            })
                        }else if( prefab.url.match(/.*\.fbx/i)){
                            fbx_loader.load(prefab.url, (fbx) =>{
                                this.import_fbx(prefab,fbx)
                                if(prefab.animation_urls){
                                    prefab.animation_urls.forEach( (anim_url) => {
                                        fbx_loader.load(anim_url, (fbx) => {
                                            const anim = fbx.animations[0]
                                            console.log("Animation loaded",anim)
                                            prefab.obj.animations.concat(fbx.animations)
                                        })
                                    })
                                    // TODO more promises..
                                    resolve()
                                }else{
                                    resolve()
                                }
                            })
                        }
                    })
                })
            ).then(() => {
                all_resolve()
            })
        })
    } 

    create_mesh(geometry,material,receiveShadow,castShadow,entity){
        if(this.PREFABS[geometry]){
            return this.create_prefab(geometry,receiveShadow,castShadow)  
        }

        if(this.FUNCTIONS[geometry]){
            return this.FUNCTIONS[geometry](entity,material,receiveShadow,castShadow)
        }

        // TODO make non-geom mesh objects more configurable?
        if(geometry == "sky"){
            // https://threejs.org/examples/webgl_shaders_sky.html
            const sky = new Sky()
            sky.scale.setScalar(450000) 
            const sun = new THREE.Vector3()
            const uniforms = sky.material.uniforms
			uniforms[ 'turbidity' ].value = 10
			uniforms[ 'rayleigh' ].value = 3
			uniforms[ 'mieCoefficient' ].value = 0.005
			uniforms[ 'mieDirectionalG' ].value = 0.7
            const phi = THREE.MathUtils.degToRad( 90 - 2 )
			const theta = THREE.MathUtils.degToRad( 180 )
			sun.setFromSphericalCoords( 1, phi, theta )
			uniforms[ 'sunPosition' ].value.copy( sun )
            // hmmm
			//renderer.toneMappingExposure = effectController.exposure;
            return sky
        }

        const m = new THREE.Mesh(
            this.BASE_GEOMETRIES[geometry]?this.BASE_GEOMETRIES[geometry]:this.BASE_GEOMETRIES['box'],
            this.BASE_MATERIALS[material]?this.BASE_MATERIALS[material]:new THREE.MeshStandardMaterial({ color: material })
        )
        m.receiveShadow = receiveShadow
        m.castShadow = castShadow
        return m
    }

    create_prefab(geometry,receiveShadow,castShadow){
        const obj = new THREE.Group()
        const og = this.PREFABS[geometry].obj
        const prefab = clone(og)
        obj.add(prefab)
        obj.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = castShadow;
                child.receiveShadow = receiveShadow;
            }
        }); 

        og.animations.forEach( a => obj.animations.push(a) )

        console.log("built a ",geometry,obj)
        window.obj = obj
        return obj
    }
}
