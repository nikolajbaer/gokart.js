import { Component, Types } from "ecsy"

export class AnimatedMovementComponent extends Component {}
AnimatedMovementComponent.schema = {
    rest: { type: Types.String },
    walk: { type: Types.String },
    run: { type: Types.String },
    jump: { type: Types.String },
    fall: { type: Types.String },
    blend_time: { type: Types.Number, default: 0.25 },
    reverse_if_backwards: { type: Types.Boolean, default: true }, // reverse if we are going backwards
    run_speedup: { type: Types.Number, default: 1.5 }, // multiplier to speed up run action playback
}