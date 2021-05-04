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
            game_over: () => this.handleGameOver(),
            game_paused: () => this.handleGamePaused()
        }
        if(this.props.mesh_creator){
            options.mesh_creator = this.props.mesh_creator
        }
        if(this.props.sound_loader){
            options.sound_loader = this.props.sound_loader
        }
        const scene = this.props.init_game(options)
        this.setState({
            hudState:scene.world.getSystem(HUDSystem).state,
            world:scene.world
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
        </div>
        )
    }
}