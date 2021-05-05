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
    
    componentDidMount(){
        this.setState({loading:true}) 
        const scene = new FPSScene() //TopDownScene()
        scene.load().then( () => {
            this.startGame()
        })
        this.setState({scene:scene})
    } 

    startGame(){
        this.setState({playing:true,loading:false})
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
        }else{
            return (
                <div className="menu">
                    <p>LOADING ASSETS..</p>
                </div>
            )
        }
    }
}

ReactDOM.render( <Game />, document.getElementById("app"))

