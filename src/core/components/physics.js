import { SystemStateComponent, Component, Types, TagComponent } from 'ecsy'
import * as CANNON from "cannon-es"
import { Vector3Type } from '../ecs_types'
import { Vector3 } from 'three'

// inpsired by https://github.com/macaco-maluco/thermal-runway/blob/master/src/components/

export class BodyComponent extends Component {}
BodyComponent.schema = {
  mass: { type: Types.Number, default: 1  },
  bounds_type: { type: Types.Number, default: 0  },
  bounds: { type: Vector3Type, default: new Vector3(1,1,1) },
  body_type: { type: Types.Number, default: CANNON.Body.DYNAMIC }, 
  material: { type: Types.String, default: 'default' },
  velocity: { type: Vector3Type },
  destroy_on_collision: { type: Types.Boolean, default: false },
  track_collisions: { type: Types.Boolean, default: false }, // CONSIDER this drives  
  fixed_rotation: { type: Types.Boolean, default: false },
}
// Bounds Types
BodyComponent.SPHERE_TYPE = 0
BodyComponent.BOX_TYPE = 1
BodyComponent.PLANE_TYPE = 2
// Body Types
BodyComponent.KINEMATIC = CANNON.Body.KINEMATIC
BodyComponent.DYNAMIC = CANNON.Body.DYNAMIC
BodyComponent.STATIC = CANNON.Body.STATIC

export class PhysicsComponent extends SystemStateComponent {}
PhysicsComponent.schema = {
  body: { type: Types.Ref }
}

