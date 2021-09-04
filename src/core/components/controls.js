import { Component, Types } from "ecsy"

export class ActionListenerComponent extends Component {}
ActionListenerComponent.schema = {
    actions: { type: Types.Ref },
}

export class MouseListenerComponent extends Component {}
MouseListenerComponent.schema = {
    mousex: { type: Types.Number, default: null },
    mousey: { type: Types.Number, default: null },
    amousex: { type: Types.Number, default: null },
    amousey: { type: Types.Number, default: null },
    mousewheel: { type: Types.Number, default: null },
}

export class MouseLockComponent extends Component {}
