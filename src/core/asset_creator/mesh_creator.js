import * as THREE from "three";
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HeightfieldDataComponent } from "../components/heightfield.js";

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
        // {url:"glb_url",animation_urls:["anim fbx",..], obj:null,animations:null}
    }
    BASE_GEOMETRIES = {
        "box": new THREE.BoxGeometry(),
        "sphere": new THREE.SphereGeometry(0.5),
        "cylinder": new THREE.CylinderGeometry(1,1,1,32),
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

                            if(prefab.animation_urls){
                                // load animations from separate fbx files
                            }else{
                                console.log("loaded ",prefab.url," with scale ",prefab.scale,prefab.obj)
                                resolve()
                            }
                        })
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

    create_terrain(material,entity,receiveShadow,castShadow){
        // Based on https://threejs.org/examples/webgl_geometry_terrain_raycast.html
        const hf = entity.getComponent(HeightfieldDataComponent)
        const data = hf.data
        // unroll since i can't figure out how to pack the triangle strips
        const data_unrolled = []
        data.forEach( row => {
            row.forEach( v => { data_unrolled.push(v)})
        }) 
        const geometry = new THREE.PlaneGeometry( hf.width * hf.element_size, hf.height * hf.element_size, hf.width - 1, hf.height - 1 )
        const vertices = geometry.attributes.position.array
        // todo figure out how to manage the triangle strip iteration?
        for ( let i = 0, j = 0; i < data_unrolled.length; i ++, j += 3 ) {
            vertices[ j + 2 ] = data_unrolled[ i ]; // * hf.element_size;
        }
        geometry.rotateZ( Math.PI ) // flip it around
        geometry.translate((hf.width*hf.element_size)/2,(hf.width*hf.element_size)/2,0)
        geometry.computeFaceNormals()

        const m = new THREE.Mesh(
            geometry,
            // Maybe terrain material at some point too?
            this.BASE_MATERIALS[material]?this.BASE_MATERIALS[material]:new THREE.MeshLambertMaterial({ color: material })
        )

        // debug
        const l = new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({color: material})
        )
        m.add(l)

        m.receiveShadow = receiveShadow
        m.castShadow = castShadow
        return m
    }
}
