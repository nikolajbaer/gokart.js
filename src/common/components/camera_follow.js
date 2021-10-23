import { Component, Types } from "ecsy"
import { Vector3 } from "three"
import { Vector3Type } from "../../core/ecs_types.js"

export class CameraFollowComponent extends Component {}
CameraFollowComponent.schema = {
    offset: { type: Vector3Type, default: new Vector3(0,10,-10)}
}