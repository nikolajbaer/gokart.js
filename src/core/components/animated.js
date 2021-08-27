import { Component, Types } from "ecsy"
import * as THREE from "three"

export class AnimatedComponent extends Component {}
AnimatedComponent.schema = {
    mixer: { type: Types.Ref },
    actions: { type: Types.Ref },
    current_action: { type: Types.String },
}

export class PlayActionComponent extends Component {}
PlayActionComponent.schema = {
    action: { type: Types.String },
    loop: { type: Types.Number, default: THREE.LoopRepeat },
    blend: { type: Types.Number, default: 0.5 },
    playback_speed: { type: Types.Number, default: 1 },
}
PlayActionComponent.LoopOnce = THREE.LoopOnce
PlayActionComponent.LoopRepeat = THREE.LoopRepeat
PlayActionComponent.LoopPingPong = THREE.LoopPingPong