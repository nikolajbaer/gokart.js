import { Component,Types } from "ecsy"
import { Vector3Type,Vector3 } from "../../core/ecs_types"

export class OrbitControlComponent extends Component {}
OrbitControlComponent.schema = {
    sensitivity: { type: Types.Number, default: 0.002 },
    offset: { type: Vector3Type, default: new Vector3(0,0,20) },
    invert_y: { type: Types.Boolean, default: false },
}