//import socketIO from 'socket.io'
import Ball from './ball'
import Physics from './physics'
import Earth from './earth'
import Water from './water'
import Cosmos from './cosmos'
import UI from './ui'
import Spring from './spring'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    physics: Physics
    ball: Ball
    earth: Earth
    //water: Water
    cosmos: Cosmos
    ui: UI
    springs: { [id: string]: Spring } = {}

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.physics = new Physics()

        this.ball = new Ball(this.scene, this.physics.world, this.camera, this.renderer)
        this.ui = new UI(this.renderer, this.ball)

        this.earth = new Earth(this.scene, this.physics.world, this.completeCB)
        //this.water = new Water(this.scene)
        this.cosmos = new Cosmos(this.scene)
    }

    completeCB = () => {
        //todo. activate when socket connected
        this.ui.menuActive = true
        this.ui.menuPanel.style.display = 'block'

        for (let i = 0; i < 10; i++) {
            this.springs[i] = new Spring(this.scene, this.earth)
        }

        //const startPosition = new THREE.Vector3(0, 113, 0)
        const startPosition = this.earth.getSpawnPosition()
        //console.log(startPosition)
        this.ball.spawn(startPosition)
    }

    update(delta: number) {
        this.physics.update(delta)
        this.ball.update(delta)
        //this.earth.update(delta)
        this.cosmos.update(delta)

        Object.keys(this.springs).forEach((s) => {
            this.springs[s].update(this.ball)
        })
    }
}
