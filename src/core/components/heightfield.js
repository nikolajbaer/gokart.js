import { Component, Types } from 'ecsy'

export class HeightfieldDataComponent extends Component {}
HeightfieldDataComponent.schema = {
  data: { type: Types.Ref },
  width: { type: Types.Number, default: 100 },
  height: { type: Types.Number, default: 100 },
  element_size: { type: Types.Number, default: 1 },
}