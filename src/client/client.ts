import * as THREE from 'three'
//import CannonDebugRenderer from './utils/cannonDebugRenderer'
import Game from './game'
import StatsVR from 'statsvr'

const scene = new THREE.Scene()

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000)
camera.position.set(0, 110, -5)

const statsVR = new StatsVR(scene, camera)
statsVR.setX(-0.25)
statsVR.setY(0.25)
statsVR.setZ(-2)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
// renderer.outputEncoding = THREE.sRGBEncoding
// renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.xr.enabled = true
document.body.appendChild(renderer.domElement)

const game = new Game(scene, camera, renderer)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const clock = new THREE.Clock()
let delta

//const cannonDebugRenderer = new CannonDebugRenderer(scene, game.physics.world)

renderer.setAnimationLoop(() => {
    delta = Math.min(clock.getDelta(), 0.1)

    game.update(delta)

    //cannonDebugRenderer.update()

    renderer.render(scene, camera)

    statsVR.update()
})

// setInterval(() => {
//     statsVR.setCustom1(String(renderer.info.render.calls))
// }, 1000)
