import { SystemStateComponent, Component, Types, TagComponent } from 'ecsy'
import { Vector3Type } from '../ecs_types'
import { Vector3 } from 'three'

export class LocRotComponent extends Component {}
LocRotComponent.schema = {
  location: { type: Vector3Type },
  rotation: { type: Vector3Type },
}
