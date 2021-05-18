import { SystemStateComponent, Component, Types, TagComponent } from 'ecsy'
import { Vector3Type } from '../ecs_types'
import { Vector3 } from 'three'

// inpsired by https://github.com/macaco-maluco/thermal-runway/blob/master/src/components/

export class BodyComponent extends Component {}
BodyComponent.schema = {
  mass: { type: Types.Number, default: 1  },
  bounds_type: { type: Types.Number, default: 0  },
  bounds: { type: Vector3Type, default: new Vector3(1,1,1) },
  body_type: { type: Types.String, default: 0 }, 
  material: { type: Types.String, default: 'default' },
  velocity: { type: Vector3Type },
  destroy_on_collision: { type: Types.Boolean, default: false },
  track_collisions: { type: Types.Boolean, default: false }, // CONSIDER this drives  
  fixed_rotation: { type: Types.Boolean, default: false },
  collision_group: { type: Types.Number, default: 1 },
}

// Bounds Types
BodyComponent.SPHERE_TYPE = 0
BodyComponent.BOX_TYPE = 1
BodyComponent.PLANE_TYPE = 2
BodyComponent.CYLINDER_TYPE = 3
BodyComponent.HEIGHTFIELD_TYPE = 4

// Body Types
BodyComponent.DYNAMIC = 0 
BodyComponent.KINEMATIC = 1
BodyComponent.STATIC = 2

export class PhysicsComponent extends SystemStateComponent {}
PhysicsComponent.schema = {
  body: { type: Types.Ref }
}

export class CollisionComponent extends Component {}
CollisionComponent.schema = {
  entity: { type: Types.Ref },
  contact_normal: { type: Vector3Type },
  contact_point: { type: Vector3Type }, // world coordinates of contact point in relation to this entity's body
  impact_velocity: { type: Types.Number },
}

