# Web Game Starter 

A web game starter kit based on ECSY.io, Three.js, Ammo.js and React with webpack bindings. This starter provides a game canvas with basic Three.js rendering system, ECSY component structure, and 2D/3D physics support, controls handling, as well as a React component layer to build on, and a HUD data communication layer. Mostly targeted at "action" games, currently focused on single player.

[Try Out the Demo](https://webgamestarter.nikolaj.dev)

#### Core Features ####
* 3D with physics pre-connected (just customize the factory classes) 
* Mobile touch based gamepads for on-screen controls
* Control system to handle and map controls to "actions" (ala Godot)
* HUD bindings to show realtime game info in React-driven HUD
* TBD - JEST test setup for unit tests on ECS component/systems
* Webpack example
* Docker-Compose file for build env

## Using This ##

TBD still figuring out how to make this reusable!  Goal is to have something as simple/low-barrier as the Crafty.js API.

For now you just clone it and rework the "example" folder.

## Origin ##

This started as a web game experiment [procgen-bhell](https://github.com/nikolajbaer/procgen-bhell), playable at
[bullethell.nikolaj.dev](https://bullethell.nikolaj.dev), where I put these pieces together. Further advanced in
[our LD48 game](https://ldjam.com/events/ludum-dare/48/oumuamua-from-outer-space-to-deeper-and-deepr-down-the-well), playable
at [ld48.nikolaj.dev](https://ld48.nikolaj.dev). 

## Key Libraries ##

All possible only due to much awesome work:

- [ECSY](https://www.ecsy.io/) for ECS
- [Ammo.js](https://github.com/kripken/ammo.js/) for 3D Physics
- [THREE.js](https://threejs.org/) for Rendering
- [React](https://reactjs.org/) for UI
- [MobX](https://mobx.js.org/) for HUD communication
- [Planck.js](https://https://piqnt.com/planck.js/) for 2D Physics
- [Howler.js](https://howlerjs.com/) for Sound (TBD)

Bundled character model by [nikolaj](https://github.com/nikolajbaer) with animations from [Mixamo](https://www.mixamo.com/).

