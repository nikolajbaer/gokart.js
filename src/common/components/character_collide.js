import { Component,Types } from "ecsy"
import { Vector3 } from "three"
import { Vector3Type } from "../../core/ecs_types"

export class CharacterCollideComponent extends Component {}
CharacterCollideComponent.schema = {
    offset_y: { type: Types.Number, default: 0.5 } ,
    gravity: { type: Vector3Type, default: new Vector3(0,-10,0) },
}
