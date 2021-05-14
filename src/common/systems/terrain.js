import { System,Not } from "ecsy"
import { BodyComponent, PhysicsComponent } from "../../core/components/physics"
import { Obj3dComponent } from "../../core/components/render"
import { ActiveTileComponent, TerrainTileComponent } from "../components/terrain"
import * as THREE from "three"
import * as CANNON from "cannon-es"

export class TerrainSystem extends System {
    create_tile(e){
        const obj3d = e.getComponent(Obj3dComponent).obj
        const body = e.getComponent(PhysicsComponent).body
        const shape = body.shapes[0]
        if(shape.type != CANNON.SHAPE_TYPES.HEIGHTFIELD){
            console.error("Attempt to create terrain tile from non-heightfield physics body",shape)
            return
        }

        // from https://github.com/pmndrs/cannon-es/blob/master/examples/js/three-conversion-utils.js
        const geometry = new THREE.BufferGeometry()
        const v0 = new CANNON.Vec3()
        const v1 = new CANNON.Vec3()
        const v2 = new CANNON.Vec3()
        const points = []
        for (let xi = 0; xi < shape.data.length - 1; xi++) {
            for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
                for (let k = 0; k < 2; k++) {
                    shape.getConvexTrianglePillar(xi, yi, k === 0)
                    v0.copy(shape.pillarConvex.vertices[0])
                    v1.copy(shape.pillarConvex.vertices[1])
                    v2.copy(shape.pillarConvex.vertices[2])
                    v0.vadd(shape.pillarOffset, v0)
                    v1.vadd(shape.pillarOffset, v1)
                    v2.vadd(shape.pillarOffset, v2)
                    points.push(new THREE.Vector3(v0.x, v0.y, v0.z))
                    points.push(new THREE.Vector3(v1.x, v1.y, v1.z))
                    points.push(new THREE.Vector3(v2.x, v2.y, v2.z))
                }
            }    
        }
        geometry.setFromPoints(points)
        geometry.computeVertexNormals()

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
        components: [PhysicsComponent,Obj3dComponent,TerrainTileComponent],
        listen: {
            added: true
        }
    }
}