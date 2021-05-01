import { System } from "ecsy"
import { CameraComponent, Obj3dComponent } from "../../core/components/render"
import { CameraFollowComponent } from "../components/camera_follow"


export class CameraFollowSystem extends System {

    execute(delta,time){
        if(this.queries.current_camera.results.length == 0){ return }

        // assume we can only follow one.. but maybe in the future allow multiple with references?
        const cam_e = this.queries.current_camera.results[0]
        const cam = cam_e.getComponent(Obj3dComponent).obj

        this.queries.camera_follow.results.forEach( e => {
            const follow = e.getComponent(CameraFollowComponent)
            const pos = e.getComponent(Obj3dComponent).obj.position

            cam.position.set( 
                pos.x + follow.offset.x,
                pos.y + follow.offset.y,
                pos.z + follow.offset.z
            )
            cam.camera.lookAt(pos);
        })
    }
}

CameraFollowSystem.queries = {
    current_camera: {
        components: [CameraComponent,Obj3dComponent]
    },
    camera_follow: {
        components: [CameraFollowComponent,Obj3dComponent]
    }
}



