import React from "react";
import { MobileStick } from "./MobileStick"
import { HUDView } from "./HUDView"
import { HUDSystem } from "../systems/hud"

export class GameComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hudState: null, 
            fullscreen: false,
            score: null,
            world: null,
        }
        this.handleFullscreen = this.handleFullscreen.bind(this)
    }

    componentDidMount(){
        if(this.state.world != null){
            this.state.world.stop()
        }
        const options = {render_element: "render"}
        const world = this.props.init_game(options)
        this.setState({
            hudState:world.getSystem(HUDSystem).state,
            world:world
        })
    }

    handleFullscreen(event){
        const showFullscreen = event.target.checked
        if (!document.fullscreenElement && showFullscreen) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen && !showFullscreen) {
                document.exitFullscreen();
            }
        }
        this.setState({fullscreen:showFullscreen})
    }

    render() {
        let touch_controls = ""
        if('ontouchstart' in window){
            touch_controls = (
                <React.Fragment>
                    <MobileStick className="dpad" joystickId="dpad" pad_radius={20} width={150} height={150} />
                    <MobileStick activeColor="rgba(255,0,0,0.3)" clasSName="aim" joystickId="aim" pad_radius={20} width={150} height={150} />
                </React.Fragment>
            )
        }

        return (
        <div id="game">
            <canvas id="render"></canvas>
            <HUDView hudState={this.state.hudState} />
            {touch_controls}
        </div>
        )
    }
}