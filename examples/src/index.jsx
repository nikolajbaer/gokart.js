import React from "react";
import ReactDOM from "react-dom";
import { DefaultMeshCreator } from "../../src/core/asset_creator/mesh_creator";
import { GameComponent } from "../../src/core/ui_components/GameComponent"
import { game_init } from "./game.js"
import characterFBX from "./assets/characterLargeMale.fbx"
import mechFBX from "./assets/mecha.fbx"
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
            creator.PREFABS["character"] = {url:characterFBX,scale:0.01}
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
                <GameComponent init_game={game_init} mesh_creator={this.state.mesh_creator} />
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

