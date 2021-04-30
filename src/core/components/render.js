import { SystemStateComponent,Component, TagComponent, Types } from 'ecsy'
import { Vector2Type, Vector3Type, Vector3 } from '../ecs_types'

export class Obj3dComponent extends SystemStateComponent {}
Obj3dComponent.schema = {
  obj: { type: Types.Ref }
}

export class ModelComponent extends Component {}
ModelComponent.schema = {
  geometry: { type: Types.String, default: 'box' },
  material: { type: Types.String, default: 'default' },
  scale: { type: Vector3Type, default: new Vector3(1,1,1) },
  cast_shadow: { type: Types.Boolean, default: true },
  receive_shadow: { type: Types.Boolean, default: true },
}

export class CameraFollowComponent extends Component {}
CameraFollowComponent.schema = {
  offset: { type: Vector3Type },
}

export class RayCastTargetComponent extends Component {}
RayCastTargetComponent.schema = {
  mouse: { type: Vector2Type },
  location: { type: Vector3Type },
}

export class CameraComponent extends Component {}
CameraComponent.schema = {
  location: { type: Vector3Type },
  current: { type: Types.Boolean, default: false },
  lookAt: { type: Vector3Type, default: new Vector3(0,0,0) },
  upVec: { type: Vector3Type, default: new Vector3(0,1,0) },
  fov: { type: Types.Number, default: 50 },
}

export class LightComponent extends Component {}
LightComponent.schema = {
    type: { type: Types.String, default: "point" },
    cast_shadow: { type: Types.Boolean, default: true },
    intensity: { type: Types.Number, default: 0.5 },
    color: { type: Types.Number, default: 0xffffff },
    decay: { type: Types.Number, default: 100 },
}

export class Project2dComponent extends Component {}
Project2dComponent.schema = {
  x: { type: Types.Number },
  y: { type: Types.Number },
}