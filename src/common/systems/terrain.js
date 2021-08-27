import { System,Not } from "ecsy"
import { BodyComponent, PhysicsComponent } from "../../core/components/physics"
import { Obj3dComponent } from "../../core/components/render"
import { ActiveTileComponent, TerrainTileComponent } from "../components/terrain"
import * as THREE from "three"
import { HeightfieldDataComponent } from "../../core/components/heightfield"

/**
 * TerrainSystem
 * @description Observes TerrainTileComponents and Generates THREE Planes from the tile
 * 
 */
export class TerrainSystem extends System {
    create_tile(e){
        const obj3d = e.getComponent(Obj3dComponent).obj
        const hfield = e.getComponent(HeightfieldDataComponent)

        // from ammo.js example: https://github.com/kripken/ammo.js/blob/main/examples/webgl_demo_terrain/index.html#L118
        const terrainWidth = hfield.width
        const terrainDepth = hfield.height

        const geometry = new THREE.PlaneBufferGeometry( hfield.scale.x, hfield.scale.z, terrainWidth - 1, terrainDepth - 1 );
        geometry.rotateX( - Math.PI / 2 );

        const vertices = geometry.attributes.position.array;
        const heightData = hfield.data

        for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
            // j + 1 because it is the y component that we modify
            vertices[ j + 1 ] = heightData[ i ];
        }

        // Terrain is vertically centered between min/max.. this could be more efficient
        const terrainMaxHeight = Math.max(...hfield.data);
        const terrainMinHeight = Math.min(...hfield.data);
        geometry.translate(0,-(terrainMaxHeight - terrainMinHeight)/2,0 )


        geometry.computeVertexNormals();
        obj3d.geometry = geometry
        obj3d.visible = true
    }

    execute(delta,time){
        this.queries.tiles.added.forEach( e => {
            this.create_tile(e)
        })
    }
}

TerrainSystem.queries = {
    tiles: {
        components: [Obj3dComponent,TerrainTileComponent,HeightfieldDataComponent],
        listen: {
            added: true
        }
    }
}
