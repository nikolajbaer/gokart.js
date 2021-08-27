import React from "react";
import { MobileStick } from "./MobileStick"
import { HUDSystem } from "../systems/hud"

export class GameComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hudState: null, 
            fullscreen: false,
            world: null,
        }
        this.handleFullscreen = this.handleFullscreen.bind(this)
    }

    componentDidMount(){
        this.props.scene.init("render")
        this.props.scene.start()

        this.setState({
            hudState:this.props.scene.world.getSystem(HUDSystem).state,
            world:this.props.scene.world
        })
    }

    handleGameOver(){
        if(this.props.gameOverHandler){
            this.props.gameOverHandler()
        }
    }

    handleGamePaused(){
        if(this.props.gamePausedHandler){
            this.props.gamePausedHandler()
        }
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
        return (
        <div id="game">
            <canvas id="render"></canvas>
            {this.props.children?this.props.children(this.state.hudState):""}
            {this.props.touch_controls}
        </div>
        )
    }
}