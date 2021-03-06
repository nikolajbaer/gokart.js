import { Component, TagComponent, Types } from "ecsy"
import { Vector3 } from "three"
import { Vector3Type } from "../../core/ecs_types.js"

export class MoverComponent extends Component {}
MoverComponent.schema = {
    kinematic: { type: Types.Boolean, default: true },
    speed: { type: Types.Number, default: 1.0 },
    turn_speed: { type: Types.Number, default: 2 },
    run_mult: { type: Types.Number, default: 2 },
    turner: { type: Types.Boolean, default: true }, // true if we rotate on left/right, false if we strafe
    local: { type: Types.Boolean, default: true },
    current: { type: Types.String, default: "rest"  },
    current_reverse: { type: Types.Boolean, default: false }, // if we are currently in reverse (useful for playing animations backwards)
    jump_speed: { type:Types.Number, default: 10.0 },
    fly_mode: { type:Types.Boolean, default: false }, // fly around a level, e.g. in Minecraft fly mode, or in CSGO while waiting for a round
    gravity: { type: Types.Number, default: 0 },
    default_run: { type: Types.Boolean, default: false }, // default movement is run, shift to walk (vs shift to run)
}

export class OnGroundComponent extends TagComponent {}