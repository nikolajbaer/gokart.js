import React from "react";
import ReactDOM from "react-dom";
import { GameComponent } from "../../src/core/ui_components/GameComponent"
import { TopDownScene } from "./topdown_scene.js"
import { FPSScene } from "./fps_scene.js"
import "./style.css"

export class Game extends React.Component {
    constructor(props){
        super(props)
        this.state = { 
            playing: false,
            loading: false,
            scene: null,
        }
    }

    startLoading(selected_scene){
        this.setState({loading:true}) 
        let scene = null
        if(selected_scene == "fps"){
            scene = new FPSScene() 
        }else if(selected_scene == "topdown"){
            scene = new TopDownScene()
        }
        scene.load().then( () => {
            this.setState({playing:true,loading:false})
        })
        this.setState({scene:scene})
    } 

    render(){
        if(this.state.playing){
            return  (
                <GameComponent scene={this.state.scene}>
                	{hudState => (
                    <div className="overlay">
                		<h1>Web Game Starter - Demo</h1>
                		<p>This is an example from the <a href="https://github.com/nikolajbaer/web-game-starter">web game starter kit</a>. WASD to move.</p>
                	</div>
                    )}
                </GameComponent>
            )
        }else if(this.state.loading){
            return (
                <div className="menu">
                    <p>LOADING ASSETS..</p>
                </div>
            )
        }else{
            return (
                <div className="menu">
                    <h1>Select Example Scene Type:</h1>
                    <button onClick={() => this.startLoading("fps")}>FPS</button>
                    <button onClick={() => this.startLoading("topdown")}>Top Down</button>
                </div>
            )
        }
    }
}

ReactDOM.render( <Game />, document.getElementById("app"))

