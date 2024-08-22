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
import JEASINGS from 'jeasings'
import StartPodium from './startPodium'
import FinishPodium from './finishPodium'
import Jewel from './jewel'
import StatsVR from 'statsvr'
import InGameUI from './inGameUI'
import LevelConfig from './levelConfig'
import * as CANNON from 'cannon-es'

export default class Game {
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    physics: Physics
    ball?: Ball
    //gamePhase = 0 // 0 = running, 1 = finished
    earth: Earth
    //water: Water
    cosmos: Cosmos
    ui: UI | undefined
    platforms: { [id: string]: Platform } = {}
    springs: { [id: string]: Spring } = {}
    mines: { [id: string]: Mine } = {}
    jewels: { [id: string]: Jewel } = {}
    explosions: { [id: string]: Explosion } = {}

    levelConfigs: { [id: string]: LevelConfig } = {}

    maxPlatforms = 100
    maxSprings = 10
    maxMines = 10
    maxJewels = 10

    numJewelsRequired = 0
    numJewelsFound = 0
    clock = 60
    clockInterval?: NodeJS.Timer
    startPosition?: THREE.Vector3
    finishPosition?: THREE.Vector3

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
        this.explosions[3] = new Explosion(new THREE.Color(0xffff00), this.scene)

        this.earth = new Earth(this.scene, this.physics.world, this.completeCB)
        //this.water = new Water(this.scene)
        this.cosmos = new Cosmos(this.scene)
    }

    completeCB = () => {
        this.levelConfigs = {
            Level1: {
                clock: 60,
                numJewelsRequired: 0,
                startPosition: this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60)),
                finishPosition: this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90)),
            },
            Level2: {
                clock: 60,
                numJewelsRequired: 1,
                startPosition: this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60)),
                finishPosition: this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90)),
                jewels: [this.earth.getSpawnPosition(1, new THREE.Vector3(-6, 113, -75))],
            },
            Level3: {
                clock: 60,
                numJewelsRequired: 2,
                startPosition: new THREE.Vector3(
                    56.290472126136905,
                    -91.15760972440741,
                    -1.1767611220036358
                ),
                finishPosition: new THREE.Vector3(
                    69.25996137388414,
                    -83.11928497788188,
                    2.5780233471851015
                ),
                jewels: [
                    new THREE.Vector3(72.67055907828018, -88.41302174580308, -19.724887711044435),
                    new THREE.Vector3(46.00942241774183, -104.53601177104508, -21.548261873282758),
                ],
            },
            Level4: {
                clock: 60,
                numJewelsRequired: 3,
                startPosition: new THREE.Vector3(
                    64.79541208152702,
                    -55.51474878022551,
                    -67.2924991521198
                ),
                finishPosition: new THREE.Vector3(
                    38.72038485474349,
                    -72.82968434602958,
                    -68.50288546920164
                ),
                jewels: [
                    new THREE.Vector3(51.37697965070356, -69.22096127218174, -64.0383484761285),
                    new THREE.Vector3(52.8686013487523, -65.22013854881372, -67.27598413066625),
                    new THREE.Vector3(51.99128682716177, -62.35285622424333, -71.3514111734384),
                ],
                mines: [
                    new THREE.Vector3(46.95563860103769, -66.37763455732465, -69.47745763800025),
                    new THREE.Vector3(47.20319269378013, -69.8747027444523, -65.55146848897994),
                    new THREE.Vector3(50.613893764628195, -71.90494857726968, -59.759684443556246),
                    new THREE.Vector3(54.559621300772, -67.28659994506276, -61.688999305116326),
                    new THREE.Vector3(56.32431584133799, -62.874454916876644, -65.01207444475592),
                    new THREE.Vector3(52.95585080558461, -54.38252817824381, -38.955300901712874),
                    new THREE.Vector3(55.49862656233072, -59.08027277103656, -70.40075042016845),
                ],
            },
            Level5: {
                clock: 60,
                numJewelsRequired: 1,
                startPosition: new THREE.Vector3(
                    61.39346587643479,
                    81.52981814760935,
                    -49.910775652817634
                ),
                finishPosition: new THREE.Vector3(
                    53.821057707957024,
                    77.82577029177817,
                    -79.6113535022746
                ),
                jewels: [
                    new THREE.Vector3(63.29365651590596, 76.58922305926498, -67.21332036541098),
                ],
                platforms: [
                    {
                        type: 0,
                        size: [10, 10],
                        position: new THREE.Vector3(
                            62.3722492060924,
                            77.05346931372728,
                            -64.64758067356155
                        ),
                        path: [] as THREE.Vector3[],
                    },
                ],
            },
        }
        //console.log(JSON.stringify(this.levelConfigs))

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

        JEASINGS.removeAll()
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

        const levelConfig = this.levelConfigs[level]
        if (levelConfig) {
            this.clock = levelConfig.clock
            this.numJewelsRequired = levelConfig.numJewelsRequired
            this.startPosition = levelConfig.startPosition
            this.finishPosition = levelConfig.finishPosition
            levelConfig.jewels?.forEach((o, i) => {
                this.jewels[i].mesh.position.copy(o)
                this.jewels[i].mesh.lookAt(0, 0, 0)
                this.jewels[i].activate()
            })
            levelConfig.mines?.forEach((o, i) => {
                this.mines[i].mesh.position.copy(o)
                this.mines[i].mesh.lookAt(0, 0, 0)
                this.mines[i].activate()
            })
            levelConfig.springs?.forEach((o, i) => {
                this.springs[i].mesh.position.copy(o)
                this.springs[i].mesh.lookAt(0, 0, 0)
                this.springs[i].activate()
            })
            levelConfig.platforms?.forEach((o, i) => {
                this.platforms[i].type = o.type
                this.platforms[i].mesh.geometry.dispose()
                this.platforms[i].mesh.geometry = new THREE.BoxGeometry(o.size[0], o.size[1], 0.5)
                this.platforms[i].mesh.position.copy(o.position)
                this.platforms[i].mesh.lookAt(0, 0, 0)
                this.platforms[i].body = new CANNON.Body({ mass: 0 })
                ;(this.platforms[i].body as CANNON.Body).addShape(
                    new CANNON.Box(new CANNON.Vec3(o.size[0] / 2, o.size[1] / 2, 0.25))
                )
                ;(this.platforms[i].body as CANNON.Body).position.set(
                    o.position.x,
                    o.position.y,
                    o.position.z
                )
                ;(this.platforms[i].body as CANNON.Body).quaternion.set(
                    this.platforms[i].mesh.quaternion.x,
                    this.platforms[i].mesh.quaternion.y,
                    this.platforms[i].mesh.quaternion.z,
                    this.platforms[i].mesh.quaternion.w
                )
                this.platforms[i].path = o.path?.slice() as THREE.Vector3[]
                //
                this.platforms[i].activate(o.type)
                this.ball?.bouncables.push(this.platforms[i].mesh)
            })
        } else {
            //if no levelConfig, then create a random

            this.clock = Math.floor(Math.random() * 100)
            this.numJewelsRequired = Math.floor(Math.random() * 10)

            this.startPosition = this.earth.getSpawnPosition(0.5)
            this.finishPosition = this.earth.getSpawnPosition(0.5)

            for (let i = 0; i < this.maxPlatforms; i++) {
                this.platforms[i].randomise()
                this.platforms[i].activate(Math.floor(Math.random() * 4))
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

            this.levelConfigs['Random'] = {
                clock: this.clock,
                numJewelsRequired: this.numJewelsRequired,
                startPosition: this.startPosition,
                finishPosition: this.finishPosition,
                platforms: Object.keys(this.platforms).map((o) => {
                    return {
                        type: this.platforms[o].type,
                        size: [Math.random() * 20 + 1, Math.random() * 20 + 1],
                        position: this.platforms[o].mesh.position,
                        path: this.platforms[o].path.slice(),
                    }
                }),
                springs: Object.keys(this.springs).map((o) => {
                    return this.springs[o].mesh.position
                }),
                mines: Object.keys(this.mines).map((o) => {
                    return this.mines[o].mesh.position
                }),
                jewels: Object.keys(this.jewels).map((o) => {
                    return this.jewels[o].mesh.position
                }),
            }
            //console.log(JSON.stringify(this.levelConfigs))
            // console.log(this.levelConfigs)
        }

        this.earth.planes.forEach((p) => {
            this.ball?.bouncables.push(p)
        })

        this.startPodium?.activate(this.startPosition)
        this.ball?.bouncables.push((this.startPodium as StartPodium).mesh)

        const ballStartPosition = this.earth.getSpawnPosition(5, this.startPosition)
        this.ball?.spawn(ballStartPosition)

        this.finishPodium?.activate(this.finishPosition)

        //this.gamePhase = 0

        this.ball?.activate()
    }

    configureLevel(value: string) {
        this.resetScene()

        this.setupLevel(value)

        this.update = (delta: number) => {
            //replacing the update function with this
            ;(this.ui as UI).updateControls(delta)

            JEASINGS.update()

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
