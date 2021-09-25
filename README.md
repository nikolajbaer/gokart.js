# GoKart.js

*NOTE: this is very much in alpha stage, more exploring the pure ECS pattern and current web toolkits. Suitable for a jam game at most!*

GoKart.js is a web game starter kit based on ECSY.io, Three.js, and Ammo.js, with React examples. This starter provides a game canvas with basic Three.js rendering system, ECSY component structure, and 2D/3D physics support, controls handling, as well as a React component layer to build on, and a HUD data communication layer. Mostly targeted at "action" games, currently focused on single player.

[Try Out the Demo](https://demo.gokart.dev)

#### Core Features ####
* 3D with physics pre-connected (just customize the entity components classes) 
* Mobile touch based gamepads for on-screen controls
* Control system to handle and map controls to "actions" (ala Godot)
* HUD bindings to show realtime game info in React-driven HUD
* TBD - JEST test setup for unit tests on ECS component/systems
* Webpack example
* Docker-Compose file for build env

## Using This ##

You can either look in the examples folder for the demo projects, or [Look at the template project](https://github.com/nikolajbaer/gokart.js-template).

The template project will show gokart being pulled in as a library, and is currently setup with esbuild rather than webpack.

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

