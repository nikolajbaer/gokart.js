import { Component, Types } from "ecsy"

export class AnimatedComponent extends Component {}
AnimatedComponent.schema = {
    mixer: { type: Types.Ref },
}

export class PlayActionComponent extends Component {}
PlayActionComponent.schema = {
    action: { type: Types.String },
    loop: { type: Types.Boolean, default: true },
    blend: { type: Types.Number, default: 0.5 },
}