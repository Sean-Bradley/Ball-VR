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
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import StartPodium from './startPodium'
import Jewel from './jewel'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    physics: Physics
    ball?: Ball
    earth: Earth
    //water: Water
    cosmos: Cosmos
    ui: UI | undefined
    platforms: { [id: string]: Platform } = {}
    springs: { [id: string]: Spring } = {}
    mines: { [id: string]: Mine } = {}
    jewels: { [id: string]: Jewel } = {}
    explosions: { [id: string]: Explosion } = {}

    maxPlatforms = 100
    maxSprings = 10
    maxMines = 10
    maxJewels = 10

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
        document.body.appendChild(VRButton.createButton(this.renderer))

        this.ball = new Ball(this.scene, this.physics.world, this.camera, this.renderer, this.earth)

        //create objects in memory, but not activated yet
        for (let i = 0; i < this.maxPlatforms; i++) {
            this.platforms[i] = new Platform(this.scene, this.earth, this.physics.world)
        }
        for (let i = 0; i < this.maxSprings; i++) {
            this.springs[i] = new Spring(this.scene, this.earth)
        }
        for (let i = 0; i < this.maxMines; i++) {
            this.mines[i] = new Mine(this.scene, this.earth, this.explosions)
        }
        for (let i = 0; i < this.maxJewels; i++) {
            this.jewels[i] = new Jewel(this.scene, this.earth, this.explosions)
        }

        this.ui = new UI(this, this.renderer, this.ball)

        //todo. activate when socket connected
        this.ui.menuActive = true
        this.ui.menuPanel.style.display = 'block'
    }

    resetScene() {
        // removes all objects from scene, bodies from physics world, resets bouncables array
        TWEEN.removeAll()
        for (let i = 0; i < this.maxPlatforms; i++) {
            this.platforms[i].deactivate()
        }
        for (let i = 0; i < this.maxSprings; i++) {
            this.springs[i].deactivate()
        }
        for (let i = 0; i < this.maxMines; i++) {
            this.mines[i].deactivate()
        }
        for (let i = 0; i < this.maxJewels; i++) {
            this.jewels[i].deactivate()
        }
        ;(this.ball as Ball).bouncables = []
    }

    setupLevel(level: string) {
        //positions, activates scene objects and adds bodies to physics world according to level config.

        if (level === 'level1') {
        } else {
            //default is random
            for (let i = 0; i < 100; i++) {
                this.platforms[i].randomise()
                this.platforms[i].activate()
                this.ball?.bouncables.push(this.platforms[i].mesh)
            }

            for (let i = 0; i < this.maxSprings; i++) {
                this.springs[i].randomise()
                this.springs[i].activate()
            }

            for (let i = 0; i < this.maxMines; i++) {
                this.mines[i].randomise()
                this.mines[i].activate()
            }

            for (let i = 0; i < this.maxJewels; i++) {
                this.jewels[i].randomise()
                this.jewels[i].activate()
            }
        }

        this.earth.planes.forEach((p) => {
            this.ball?.bouncables.push(p)
        })
    }

    configureLevel(value: string) {
        this.resetScene()

        this.setupLevel(value)

        //const startPosition = new THREE.Vector3(0, 113, 0)
        const startPosition = this.earth.getSpawnPosition(0.5)
        const startPodium = new StartPodium(
            this.scene,
            startPosition,
            this.physics.world,
            this.ball as Ball
        )

        //console.log(start.mesh.position)

        const ballStartPosition = this.earth.getSpawnPosition(5, startPosition)
        //console.log(ballStartPosition)
        this.ball?.spawn(ballStartPosition)

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
            Object.keys(this.jewels).forEach((o) => {
                this.jewels[o].update(this.ball as Ball)
            })
            Object.keys(this.explosions).forEach((o) => {
                this.explosions[o].update()
            })
            

            TWEEN.update()
        }

        // const gui = new GUI()
        // gui.add(Platform.material, 'roughness', 0, 1.0)
        // gui.add(Platform.material, 'metalness', 0, 1.0)
        // gui.open()
    }

    update(delta: number) {
        // Dont put anything here
        // this function gets replaced in the earth completed callback
    }
}
