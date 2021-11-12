import { Component, Types } from "ecsy"
import { Vector2, Vector2Type } from "gokart.js/src/core/ecs_types.js"

export class Overlay2dComponent extends Component {}
Overlay2dComponent.schema = {
    type: { type: Types.String, default: "box"},
    opts: { type: Types.JSON, default: {} },
    offset: { type: Vector2Type, default: new Vector2(0,0) },
}