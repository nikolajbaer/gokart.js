import { Component, Types } from "ecsy"

export class HUDDataComponent extends Component {}
HUDDataComponent.schema = {
    key: { type: Types.String },
    data: { type: Types.JSON, default: {} },
}