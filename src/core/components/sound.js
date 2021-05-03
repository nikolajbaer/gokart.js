import { Component, Types } from "ecsy"
import { Vector3Type } from "../ecs_types"

export class SoundEffectComponent extends Component {}
SoundEffectComponent.schema = {
    sound: { type: Types.String },
    location: { type: Vector3Type },
    volume: { type: Types.Number, default: 1 },
}

export class MusicLoopComponent extends Component {}
MusicLoopComponent.schema = {
    sound: { type: Types.String },
    playing: { type: Types.Boolean, default: false },
}