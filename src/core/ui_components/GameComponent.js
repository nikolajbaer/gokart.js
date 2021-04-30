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
            world: null,
        }
        this.handleFullscreen = this.handleFullscreen.bind(this)
    }

    componentDidMount(){
        if(this.state.world != null){
            this.state.world.stop()
        }
        const options = {
            render_element: "render",
            overlay_element: "overlay2d",
            game_over: () => this.handleGameOver(),
            game_paused: () => this.handleGamePaused()
        }
        if(this.props.mesh_creator){
            options.mesh_creator = this.props.mesh_creator
        }
        const world = this.props.init_game(options)
        this.setState({
            hudState:world.getSystem(HUDSystem).state,
            world:world
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
            <canvas id="overlay2d"></canvas>
            {this.props.children(this.state.hudState)}
        </div>
        )
    }
}