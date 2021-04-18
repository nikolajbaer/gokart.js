# RECT Game Starter 

* R(eact)
* E(csy)
* C(annon-es)
* T(hree)

A web game starter kit based on ECSY.io, Three.js, Cannon-es and React with webpack bindings. This starter provides 
a game canvas with basic Three.js rendering system, ECSY component structure, and Cannon-ES 
physics support, as well as a React component layer to build on, and a HUD data communication
layer. 

#### Core Features ####
* 3D with physics pre-connected (just customize the factory classes) 
* Mobile touch based gamepads for on-screen controls
* HUD bindings to show realtime game info in React-driven HUD
* JEST test setup for unit tests on ECS component/systems
* Webpack example
* Docker-Compose file for build env

## Using This ##

TBD still figuring out how to make this reusable! 

## Origin ##

This started as a web game experiment [procgen-bhell](https://github.com/nikolajbaer/procgen-bhell), playable at
[bullethell.nikolaj.dev](https://bullethell.nikolaj.dev), where I put these pieces together. I wanted to abstract
out the boilerplate pieces to facilitate an upcoming [Ludum Dare](https://ldjam.com)..

## Key Libraries ##

- [ECSY](https://www.ecsy.io/) for ECS
- [CANNON-ES](https://pmndrs.github.io/cannon-es/) for Physics
- [THREE.js](https://threejs.org/) for Rendering
- [React](https://reactjs.org/) for UI
- [MobX](https://mobx.js.org/) for HUD communication
