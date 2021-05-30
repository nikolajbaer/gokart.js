import { Component, Types } from "ecsy"
import { Vector3 } from "three"
import { Vector3Type } from "../../core/ecs_types"

export class DebugNormalComponent extends Component {}
DebugNormalComponent.schema = {
    normal: { type: Vector3Type, default: null }, // normal direction in world coordinates
    local_offset: { type: Vector3Type, default: new Vector3(0,0,0) },
}