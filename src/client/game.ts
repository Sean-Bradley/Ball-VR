//import socketIO from 'socket.io'
import * as THREE from 'three'
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
import { VRButton } from 'three/examples/jsm/webxr/VRButton'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import StartPodium from './startPodium'
import FinishPodium from './finishPodium'
import Jewel from './jewel'
import StatsVR from 'statsvr'
import InGameUI from './inGameUI'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    physics: Physics
    ball?: Ball
    gamePhase = 0 // 0 = running, 1 = finished
    earth: Earth
    //water: Water
    cosmos: Cosmos
    ui: UI | undefined
    platforms: { [id: string]: Platform } = {}
    springs: { [id: string]: Spring } = {}
    mines: { [id: string]: Mine } = {}
    jewels: { [id: string]: Jewel } = {}
    explosions: { [id: string]: Explosion } = {}

    levels = ['Level1', 'Level2', 'Level3', 'Random']

    maxPlatforms = 100
    maxSprings = 10
    maxMines = 10
    maxJewels = 10

    numJewelsRequired = 0
    numJewelsFound = 0
    clock = 60
    clockInterval?: NodeJS.Timer

    startPodium?: StartPodium
    finishPodium?: FinishPodium

    statsVR: StatsVR

    constructor(
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        statsVR: StatsVR
    ) {
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.statsVR = statsVR

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
            this.jewels[i] = new Jewel(this, this.scene, this.earth, this.explosions)
        }

        this.startPodium = new StartPodium(this.scene, this.physics.world)
        this.finishPodium = new FinishPodium(this.scene, this.physics.world, this.explosions, this)

        if ('xr' in navigator) {
            ;(navigator as any).xr
                .isSessionSupported('immersive-vr')
                .then((VRsupported: boolean) => {
                    this.ui = new UI(
                        this,
                        this.scene,
                        this.renderer,
                        this.ball as Ball,
                        VRsupported
                    )

                    //todo. activate when socket connected
                    this.ui.menuActive = true
                    this.ui.menuPanel.style.display = 'block'
                })
        } else {
            this.ui = new UI(this, this.scene, this.renderer, this.ball as Ball, false)

            //todo. activate when socket connected
            this.ui.menuActive = true
            this.ui.menuPanel.style.display = 'block'
        }
    }

    resetScene() {
        // removes all objects from scene, bodies from physics world, resets bouncables array
        this.clock = 0
        this.numJewelsFound = 0

        ;(this.ui as UI).keyMap = {}
        ;(this.ball as Ball).forwardForce = 0
        ;(this.ball as Ball).rightForce = 0

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
        this.startPodium?.deactivate()
        this.finishPodium?.deactivate()
        ;(this.ball as Ball).bouncables = []
    }

    setupLevel(level: string) {
        //positions, activates scene objects and adds bodies to physics world according to level config.

        let startPosition: THREE.Vector3
        let finishPosition: THREE.Vector3

        if (level === 'Level1') {
            this.clock = 60
            this.numJewelsRequired = 0
            startPosition = this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60))
            finishPosition = this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90))
        } else if (level === 'Level2') {
            this.clock = 60
            this.numJewelsRequired = 1
            startPosition = this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60))
            finishPosition = this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90))
            this.jewels[0].mesh.position.copy(
                this.earth.getSpawnPosition(1, new THREE.Vector3(-6, 113, -75))
            )
            this.jewels[0].mesh.lookAt(0, 0, 0)
            this.jewels[0].activate()
        } else if (level === 'Level3') {
            this.clock = 60
            this.numJewelsRequired = 2
            startPosition = new THREE.Vector3(
                56.290472126136905,
                -91.15760972440741,
                -1.1767611220036358
            )
            finishPosition = new THREE.Vector3(
                69.25996137388414,
                -83.11928497788188,
                2.5780233471851015
            )
            this.jewels[0].mesh.position.set(
                72.67055907828018,
                -88.41302174580308,
                -19.724887711044435
            )
            this.jewels[0].mesh.lookAt(0, 0, 0)
            this.jewels[0].activate()
            this.jewels[1].mesh.position.set(
                46.00942241774183,
                -104.53601177104508,
                -21.548261873282758
            )
            this.jewels[1].mesh.lookAt(0, 0, 0)
            this.jewels[1].activate()
        } else {
            //default is random
            this.clock = Math.floor(Math.random() * 100)
            this.numJewelsRequired = Math.floor(Math.random() * 10)

            startPosition = this.earth.getSpawnPosition(0.5)
            finishPosition = this.earth.getSpawnPosition(0.5)

            console.log(startPosition)
            console.log(finishPosition)

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

        this.startPodium?.activate(startPosition)
        this.ball?.bouncables.push((this.startPodium as StartPodium).mesh)

        const ballStartPosition = this.earth.getSpawnPosition(5, startPosition)
        this.ball?.spawn(ballStartPosition)

        this.finishPodium?.activate(finishPosition)

        this.gamePhase = 0

        this.ball?.activate()
    }

    configureLevel(value: string) {
        this.resetScene()

        this.setupLevel(value)

        this.update = (delta: number) => {
            //replacing the update function with this
            TWEEN.update()

            this.physics.update(delta)
            ;(this.ball as Ball).update(delta)

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

            this.finishPodium?.update(this.ball as Ball)
        }

        // const gui = new GUI()
        // gui.add(Platform.material, 'roughness', 0, 1.0)
        // gui.add(Platform.material, 'metalness', 0, 1.0)
        // gui.open()
    }

    update(delta: number) {
        // This is only run at first visit to web page
        // this function gets replaced in the earth completed callback
    }

    startRound() {
        clearInterval(this.clockInterval as NodeJS.Timeout)
        this.clockInterval = setInterval(() => {
            this.clock -= 1
            ;((this.ui as UI).inGameUI as InGameUI).update(
                this.clock,
                this.numJewelsRequired,
                this.numJewelsFound
            )
        }, 1000)
    }

    endRound() {
        clearInterval(this.clockInterval as NodeJS.Timeout)
        ;(this.ui as UI).showRoundStats()
    }
}
