import * as THREE from "three"
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class RenderAssetLoader {
    constructor(){
        this.fbx_urls = []
        this.objects = {}
    }

    load_fbx(key,url,shadows){
        const loader = new FBXLoader();
		return loader.load( url, function ( fbx ) {
            fbx.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = shadows
                    child.receiveShadow = shadows
                }
            });
            this.objects[key] = fbx
        })
    }

    load_fbx_anim(into_key,url,index,loop){
        const loader = new FBXLoader();
        return loader.load(url, function ( anim ) {
            this.objects[into_key].animations.push(anim.animations[index]);
            //player_actions.actions[a.name] = mixer.clipAction( anim.animations[a.idx] );
            //if(!loop){
            //    player_actions.actions[a.name].setLoop(THREE.LoopOnce);
            //}
        })
    }

    get_geometry(key){

    }

    get_material(key){

    }

}