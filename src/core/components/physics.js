import { SystemStateComponent, Component, Types, TagComponent } from 'ecsy'
import { Vector3Type } from '../ecs_types'
import { Vector3 } from 'three'

// inpsired by https://github.com/macaco-maluco/thermal-runway/blob/master/src/components/

export class BodyComponent extends Component {}
BodyComponent.schema = {
  mass: { type: Types.Number, default: 1  },
  bounds_type: { type: Types.Number, default: 0  },
  bounds: { type: Vector3Type, default: new Vector3(1,1,1) },
  body_type: { type: Types.Number, default: 0 }, 
  material: { type: Types.String, default: 'default' },
  velocity: { type: Vector3Type },
  destroy_on_collision: { type: Types.Boolean, default: false },
  track_collisions: { type: Types.Boolean, default: false }, // CONSIDER this drives  
  fixed_rotation: { type: Types.Boolean, default: false },
  collision_groups: { type: Types.Number, default: 0xFFFF0001 },
}

// Bounds Types
BodyComponent.SPHERE_TYPE = 0
BodyComponent.BOX_TYPE = 1
BodyComponent.CAPSULE_TYPE = 2
BodyComponent.CYLINDER_TYPE = 3
BodyComponent.HEIGHTFIELD_TYPE = 4

// Body Types
BodyComponent.DYNAMIC = 0 
BodyComponent.KINEMATIC = 1
BodyComponent.STATIC = 2
BodyComponent.KINEMATIC_CHARACTER = 3

export class PhysicsComponent extends SystemStateComponent {}
PhysicsComponent.schema = {
  body: { type: Types.Ref }
}

export class PhysicsControllerComponent extends SystemStateComponent {}
PhysicsControllerComponent.schema = {
  ctrl: { type: Types.Ref }
}

export class CollisionComponent extends Component {}
CollisionComponent.schema = {
  entity: { type: Types.Ref },
  contact_normal: { type: Vector3Type },
  contact_point: { type: Vector3Type }, // world coordinates of contact point in relation to this entity's body
  impact_velocity: { type: Types.Number },
}

export class ApplyVelocityComponent extends Component {}
ApplyVelocityComponent.schema = {
  linear_velocity: { type: Vector3Type, default: null },
  angular_velocity: { type: Vector3Type, default: null },
}

export class SetRotationComponent extends Component {}
SetRotationComponent.schema = {
  x: { type: Types.Number, default: null }, // unroll since we may only want to set a specific rotation for a specific axis
  y: { type: Types.Number, default: null },
  z: { type: Types.Number, default: null },
}

export class KinematicCharacterComponent extends Component {}
KinematicCharacterComponent.schema = {
  gravity: { type: Types.Number, default: -10 },
  max_slope: { type: Types.Number, default: Math.PI / 4 },
  walk_speed: { type: Types.Number, default: 1.0 },
  jump_speeed: { type: Types.Number, default: 1.0 },
  step_height: { type: Types.Number, default: 0.25 },
}
