import { Component, Types } from 'ecsy'
import { Vector3Type } from "../ecs_types.js"

export class HeightfieldDataComponent extends Component {}
HeightfieldDataComponent.schema = {
  data: { type: Types.Ref },
  width: { type: Types.Number, default: 100 },
  height: { type: Types.Number, default: 100 },
  scale: { type: Vector3Type },
}