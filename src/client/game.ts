//import socketIO from 'socket.io'
import Ball from './ball'
import Physics from './physics'
import Earth from './earth'
import Water from './water'
import Cosmos from './cosmos'
import UI from './ui'
import Platform from './platform'
import Spring from './spring'
import Mine from './mine'
import Explosion from './explosion'
import THREE = require('three')
import StatsVR from 'statsvr'
import { GUI } from 'dat.gui'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    physics: Physics
    ball: Ball | undefined
    earth: Earth
    //water: Water
    cosmos: Cosmos
    ui: UI | undefined
    platforms: { [id: string]: Platform } = {}
    springs: { [id: string]: Spring } = {}
    mines: { [id: string]: Mine } = {}
    explosions: { [id: string]: Explosion } = {}

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.physics = new Physics()

        this.explosions[0] = new Explosion(new THREE.Color(0xff0000), this.scene)
        this.explosions[1] = new Explosion(new THREE.Color(0x00ff00), this.scene)
        this.explosions[2] = new Explosion(new THREE.Color(0x0000ff), this.scene)

        this.earth = new Earth(this.scene, this.physics.world, this.completeCB)
        //this.water = new Water(this.scene)
        this.cosmos = new Cosmos(this.scene)
    }

    completeCB = () => {
        this.ball = new Ball(this.scene, this.physics.world, this.camera, this.renderer, this.earth)        
        this.ui = new UI(this.renderer, this.ball)

        //todo. activate when socket connected
        this.ui.menuActive = true
        this.ui.menuPanel.style.display = 'block'

        for (let i = 0; i < 100; i++) {
            this.platforms[i] = new Platform(this.scene, this.earth, this.physics.world)
            this.ball.bouncables.push(this.platforms[i].mesh)
        }
        for (let i = 0; i < 5; i++) {
            this.springs[i] = new Spring(this.scene, this.earth)
        }
        for (let i = 0; i < 15; i++) {
            this.mines[i] = new Mine(this.scene, this.earth, this.explosions)
        }

        //const startPosition = new THREE.Vector3(0, 113, 0)
        const startPosition = this.earth.getSpawnPosition(5)
        //console.log(startPosition)
        this.ball.spawn(startPosition)

        this.update = (delta: number) => {
            //replace the update function with this
            
            this.physics.update(delta)
            ;(this.ball as Ball).update(delta)
            //this.earth.update(delta)
            this.cosmos.update(delta)

            Object.keys(this.platforms).forEach((o) => {
                this.platforms[o].update(delta, this.ball as Ball)
            })
            Object.keys(this.springs).forEach((o) => {
                this.springs[o].update(this.ball as Ball)
            })
            Object.keys(this.mines).forEach((o) => {
                this.mines[o].update(this.ball as Ball)
            })
            Object.keys(this.explosions).forEach((o) => {
                this.explosions[o].update()
            })
        }

        // const gui = new GUI()
        // gui.add(Platform.material, 'roughness', 0, 1.0)
        // gui.add(Platform.material, 'metalness', 0, 1.0)
        // gui.open()
    }

    update(delta: number) {
        //this function gets replaced after the earth complete callback
    }
}
