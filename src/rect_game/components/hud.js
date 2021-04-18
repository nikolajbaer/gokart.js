import { Component, Types } from "ecsy"

export class HUDDataComponent extends Component {}
HUDDataComponent.schema = {
    key: { type: Types.String },
    value: { type: Types.Ref },
}