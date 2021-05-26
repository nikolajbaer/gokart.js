import { Component, Types } from "ecsy"
import { Vector3Type } from "../../core/ecs_types"

// Track one instanced mesh?
export class ParticleSystemComponent extends Component {}
ParticleSystemComponent.schema = {
    life: { type:Types.Number, default: 1 },
    velocity: { type:Vector3Type, default: 0},
    n: { type: Types.Number, default: 20 },
}