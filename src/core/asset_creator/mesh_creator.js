import * as THREE from "three";
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class BaseMeshCreator {
    create_mesh(geometry,material){
        return new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshLambertMaterial({color: 0x9999fe }))
    }

    load(){
        // return a promise (in this case empty) to do "loading" work
        return Promise((resolve,reject) => resolve() )
    }
}

export class DefaultMeshCreator extends BaseMeshCreator {
    PREFABS = {
        // {url:"glb_url",obj:null,animations:null}
    } 
    BASE_GEOMETRIES = {
        "box": new THREE.BoxGeometry(),
        "sphere": new THREE.SphereGeometry(0.5),
        "plane": new THREE.PlaneGeometry(0,1,5,5),
        "ground": new THREE.PlaneGeometry(1000,1000, 50, 50),
    }

    BASE_MATERIALS = {
        "ground": new THREE.MeshLambertMaterial( { color: 0x333332 } ),
        "default": new THREE.MeshLambertMaterial( { color: 0x9999fe } ),
        // useful for FPS character, from https://stackoverflow.com/a/50163740
        "invisible": new THREE.MeshBasicMaterial({color:0xff00ff,colorWrite:false,depthWrite:false}), 
    }

    load(){
        const manager = new THREE.LoadingManager()
        const loader = new GLTFLoader(manager)

        return new Promise((all_resolve,all_reject) => {
            return Promise.all(
                Object.values(this.PREFABS).map( prefab => {
                    return new Promise((resolve,reject) => {
                        loader.load(prefab.url, (gltf) =>{
                            const scene = gltf.scene
                            //console.log("glb loaded ",gltf)
                            if(prefab.scale){
                                scene.scale.set(prefab.scale,prefab.scale,prefab.scale)
                            }
                            prefab.obj = scene

                            if(gltf.animations){
                                scene.animations = gltf.animations;
                            }
                            console.log("loaded ",prefab.url," with scale ",prefab.scale,prefab.obj)
                            resolve()
                        })
                    })
                })
            ).then(() => {
                all_resolve()
            })
        })
    } 

    create_mesh(geometry,material,receiveShadow,castShadow){
        if(this.PREFABS[geometry]){
            return this.create_prefab(geometry,receiveShadow,castShadow)  
        }

        const m =new THREE.Mesh(
            this.BASE_GEOMETRIES[geometry],
            this.BASE_MATERIALS[material]?this.BASE_MATERIALS[material]:new THREE.MeshLambertMaterial({ color: material })
        )
        m.receiveShadow = receiveShadow
        m.castShadow = castShadow
        return m
    }

    create_prefab(geometry,receiveShadow,castShadow){
        const obj = new THREE.Group()
        const og = this.PREFABS[geometry].obj
        const prefab = SkeletonUtils.clone(og)
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
