import React from "react";
import { HUDSystem } from "../systems/hud"

export class GameComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hudState: null, 
            world: null,
        }
    }

    componentDidMount(){
        // TOOD make touch control config more sensible
        this.props.scene.init("render", 'ontouchstart' in window)
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