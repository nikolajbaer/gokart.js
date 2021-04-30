import { SystemStateComponent, Component, Types, TagComponent } from 'ecsy'
import { Vector2Type,Vector2 } from '../ecs_types'

// inpsired by https://github.com/macaco-maluco/thermal-runway/blob/master/src/components/

export class Body2dComponent extends Component {}
Body2dComponent.schema = {
  mass: { type: Types.Number, default: 1  },
  bounds_type: { type: Types.String, default:"circle" },
  width: { type: Types.Number, default: 1 },
  height: { type: Types.Number, default: 1 },
  body_type: { type: Types.Number, default: "static"  }, 
  velocity: { type: Vector2Type, default: new Vector2(0,0) },
  destroy_on_collision: { type: Types.Boolean, default: false },
  track_collisions: { type: Types.Boolean, default: false }, 
  fixed_rotation: { type: Types.Boolean, default: false },
}

export class Physics2dComponent extends SystemStateComponent {}
Physics2dComponent.schema = {
  body: { type: Types.Ref }
}

export class Collision2dComponent extends Component {}
Collision2dComponent.schema = {
  entity: { type: Types.Ref },
  normal_impulse: { type: Types.Number },
  tan_impulse: { type: Types.Number },
}

export class Joint2dComponent extends Component {}
Joint2dComponent.schema = {
  entity: { type: Types.Ref },
  joint_type: { type: Types.String, default: "weld" },
  joint_config: { type: Types.JSON },
  anchor_a: { type: Vector2Type },
  anchor_b: { type: Vector2Type, default: null },
}

export class PhysicsJoint2dComponent extends SystemStateComponent {}
PhysicsJoint2dComponent.schema = {
  joint: { type: Types.Ref },
}