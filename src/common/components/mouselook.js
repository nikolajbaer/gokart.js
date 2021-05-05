import { Component, Types } from "ecsy"
import { Vector3 } from "three"
import { Vector3Type } from "../../core/ecs_types"

export class MouseLookComponent extends Component {}
MouseLookComponent.schema = {
    sensitivity: { type: Types.Number, default: 0.002 },
    offset: { type: Vector3Type, default: new Vector3(0,0,0) },
    invert_y: { type: Types.Boolean, default: true },
}