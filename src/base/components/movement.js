import { Component, Types } from "ecsy"

export class MoverComponent extends Component {}
MoverComponent.schema = {
    kinematic: { type: Types.Boolean, default: true },
    speed: { type: Types.Number, default: 1.0 },
    move_z: { type:Types.Boolean, default: true }, 
    local: { type:Types.Boolean, default: false },
}