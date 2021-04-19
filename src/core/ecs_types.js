import { createType, copyCopyable, cloneClonable } from "ecsy";

// TODO make it easier to transmit between Three/Cannon vectors
export class Vector2 {
  constructor(x=0,y=0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(source) {
    this.x = source.x;
    this.y = source.y;
    return this;
  }

  clone() {
    return new Vector2().set(this.x, this.y);
  }
}
export const Vector2Type = createType({
  name: "Vector2",
  default: new Vector2(),
  copy: copyCopyable,
  clone: cloneClonable
});



export class Vector3 {
  constructor(x=0,y=0,z=0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(source) {
    this.x = source.x;
    this.y = source.y;
    this.z = source.z;
    return this;
  }

  clone() {
    return new Vector3().set(this.x, this.y, this.z);
  }
}

export const Vector3Type = createType({
  name: "Vector3",
  default: new Vector3(),
  copy: copyCopyable,
  clone: cloneClonable
});

