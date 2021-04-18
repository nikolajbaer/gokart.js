import  * as THREE from "three"

// TODO asset loader/builder abstraction

export const GEOMETRIES = {
    "box": new THREE.BoxGeometry(),
    "sphere": new THREE.SphereGeometry(),
    "plane": new THREE.PlaneGeometry(1,1,5,5),
    "ground": new THREE.PlaneGeometry(1000,1000, 50, 50),
}

export const MATERIALS = {
    "ground": new THREE.MeshLambertMaterial( { color: 0x333333 } ),
    "player": new THREE.MeshLambertMaterial( { color: 0xeeeeee } ),
    "default": new THREE.MeshLambertMaterial( { color: 0x9999FF } ),
}