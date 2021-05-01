import React from "react";
import ReactDOM from "react-dom";
import { DefaultMeshCreator } from "../../src/core/asset_creator/mesh_creator";
import { GameComponent } from "../../src/core/ui_components/GameComponent"
import { game_init } from "./game.js"
import mechaGLB from "./assets/mecha.glb"
import "./style.css"

export class Game extends React.Component {
    constructor(props){
        super(props)
        this.state = { 
            playing: false,
            loading: false,
            mesh_creator: null,
        }
    }
    
    componentDidMount(){
        this.setState({loading:true}) 
        if(this.state.mesh_creator == null){
            const creator = new DefaultMeshCreator()
            creator.PREFABS["mecha"] = {url:mechaGLB,scale:1}
            creator.load().then( () => {
                this.startGame()
            })
            this.setState({mesh_creator:creator})
        }else{
            this.startGame()
        }
    } 

    startGame(){
        this.setState({playing:true,loading:false})
    }

    render(){
        if(this.state.playing){
            return  (
                <GameComponent init_game={game_init} mesh_creator={this.state.mesh_creator}>
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

