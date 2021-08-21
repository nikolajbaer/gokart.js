import React from "react";
import ReactDOM from "react-dom";
import { GameComponent } from "../../src/core/ui_components/GameComponent"
import { HUDView } from "../../src/core/ui_components/HUDView"
import { TopDownScene } from "./scenes/topdown_scene.js"
import { FPSScene } from "./scenes/fps_scene.js"
import "./style.css"
import { ThirdPersonScene } from "./scenes/thirdperson_scene";
import { PhysicsTestScene } from "./scenes/physics_test_scene";
import { KinematicTestScene } from "./scenes/kinematic_test_scene";

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
        }else if(selected_scene == "thirdperson"){
            scene = new ThirdPersonScene()
        }else if(selected_scene == "physics_test"){
            scene = new PhysicsTestScene()
        }else if(selected_scene == "kinematic_test"){
            scene = new KinematicTestScene()
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
                        <HUDView hudState={hudState}>
                	    {hudState => (
                            <div className="overlay">
                        		<h1>Web Game Starter - Demo</h1>
                        		<p>This is an example from the <a href="https://github.com/nikolajbaer/web-game-starter">web game starter kit</a>. WASD to move.</p>
                                <p>{hudState?hudState.fps.toFixed(1):"-"} fps</p>
                        	</div>
                        )} 
                        </HUDView>
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
                    <button onClick={() => this.startLoading("physics_test")}>3D Physics Test</button>
                    <button onClick={() => this.startLoading("kinematic_test")}>Kinematic Character Test</button>
                </div>
            )
        }
    }
}

ReactDOM.render( <Game />, document.getElementById("app"))

