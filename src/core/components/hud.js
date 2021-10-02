import { Component, Types } from "ecsy"

export class HUDDataComponent extends Component {}
HUDDataComponent.schema = {
    data: { type: Types.JSON, default: {} }, // what we send to the HUD
    recv: { type: Types.JSON, default: {} }, // what we get from the HUD
}