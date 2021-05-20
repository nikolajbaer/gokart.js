import { System,Not } from "ecsy"
import { BodyComponent, PhysicsComponent } from "../../core/components/physics"
import { Obj3dComponent } from "../../core/components/render"
import { ActiveTileComponent, TerrainTileComponent } from "../components/terrain"
import * as THREE from "three"
import { HeightfieldDataComponent } from "../../core/components/heightfield"

export class TerrainSystem extends System {
    create_tile(e){
        const obj3d = e.getComponent(Obj3dComponent).obj
        const hfield = e.getComponent(HeightfieldDataComponent)

        let geometry = new THREE.BufferGeometry()
        let g = genHeightfieldGeometry(hfield.data,hfield.height-1,hfield.width-1,hfield.scale)
        let vertices = g.vertices;
        let indices = g.indices;
        geometry.setIndex(Array.from(indices));
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        geometry.computeVertexNormals()
        geometry.computeFaceNormals()
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

// From https://github.com/dimforge/rapier.js/blob/master/testbed3d/src/Graphics.js#L13 
function genHeightfieldGeometry(heights,nrows,ncols,scale) {
    let vertices = [];
    let indices = [];
    let eltWX = 1.0 / nrows;
    let eltWY = 1.0 / ncols;

    let i, j;
    for (j = 0; j <= ncols; ++j) {
        for (i = 0; i <= nrows; ++i) {
            let x = (j * eltWX - 0.5) * scale.x;
            let y = heights[j * (nrows + 1) + i] * scale.y;
            let z = (i * eltWY - 0.5) * scale.z;

            vertices.push(x, y, z);
        }
    }

    for (j = 0; j < ncols; ++j) {
        for (i = 0; i < nrows; ++i) {
            let i1 = (i + 0) * (ncols + 1) + (j + 0);
            let i2 = (i + 0) * (ncols + 1) + (j + 1);
            let i3 = (i + 1) * (ncols + 1) + (j + 0);
            let i4 = (i + 1) * (ncols + 1) + (j + 1);

            // NOTE: i flipped the order of these triangels beacuse 
            // the original example from rapier had the normals pointing down
            indices.push(i2, i3, i1);
            indices.push(i2, i4, i3);
        }
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint32Array(indices),
    }
}