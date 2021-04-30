import { Component, Types } from "ecsy"

export class Overlay2dComponent extends Component {}
Overlay2dComponent.schema = {
    type: { type: Types.String, default: "box"},
    opts: { type: Types.JSON, default: {} },
}