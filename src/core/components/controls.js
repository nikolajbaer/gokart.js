import { Component, Types } from "ecsy"

export class ActionListenerComponent extends Component {}
ActionListenerComponent.schema = {
    actions: { type: Types.Ref }
}