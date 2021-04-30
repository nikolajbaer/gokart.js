import React from "react";
import ReactDOM, { render } from "react-dom";
import { GameComponent } from "../../src/core/ui_components/GameComponent"
import { game_init,asset_loader } from "./game.js"
import "./style.css"

ReactDOM.render( <GameComponent init_game={game_init} />, document.getElementById("app"))

