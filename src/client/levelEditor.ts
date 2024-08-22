import * as THREE from 'three'
import Ball from './ball'
import FinishPodium from './finishPodium'
import Game from './game'
import LevelConfig from './levelConfig'
import StartPodium from './startPodium'
import UI from './ui'
import JEASINGS from 'jeasings'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

export default class LevelEditor {
    game: Game
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    ball: Ball
    raycaster = new THREE.Raycaster()
    trackballControls?: TrackballControls
    dragControls?: DragControls

    constructor(game: Game, scene: THREE.Scene, renderer: THREE.WebGLRenderer, ball: Ball) {
        this.game = game
        this.scene = scene
        this.renderer = renderer
        this.ball = ball
        const createLevelJSON = document.getElementById('createLevelJSON') as HTMLButtonElement
        createLevelJSON.addEventListener(
            'click',
            () => {
                let finishPosition = new THREE.Vector3()
                ;(this.game.finishPodium as FinishPodium).mesh.getWorldPosition(finishPosition)

                const levelConfig: LevelConfig = {
                    clock: this.game.clock,
                    numJewelsRequired: this.game.numJewelsRequired,
                    startPosition: (this.game.startPodium as StartPodium).mesh.position,
                    finishPosition: finishPosition,
                    jewels: Object.keys(this.game.jewels)
                        .filter((o) => {
                            return this.game.jewels[o].enabled
                        })
                        .map((o) => {
                            return this.game.jewels[o].mesh.position
                        }),
                    mines: Object.keys(this.game.mines)
                        .filter((o) => {
                            return this.game.mines[o].enabled
                        })
                        .map((o) => {
                            return this.game.mines[o].mesh.position
                        }),
                    springs: Object.keys(this.game.springs)
                        .filter((o) => {
                            return this.game.springs[o].enabled
                        })
                        .map((o) => {
                            return this.game.springs[o].mesh.position
                        }),
                    platforms: Object.keys(this.game.platforms)
                        .filter((o) => {
                            return this.game.platforms[o].enabled
                        })
                        .map((o) => {
                            return {
                                type: this.game.platforms[o].type,
                                size: [this.game.platforms[o].width, this.game.platforms[o].length],
                                position: this.game.platforms[o].mesh.position,
                                path: this.game.platforms[o].path.slice(),
                            }
                        }),
                }

                console.log(JSON.stringify(levelConfig))
            },
            false
        )
    }

    setEditMode = (ui: UI) => {
        document.exitPointerLock()
        ui.menuPanel.style.display = 'none'
        ui.startButton.style.display = 'none'
        ui.menuActive = false

        const editPanel = document.getElementById('editPanel') as HTMLDivElement
        editPanel.style.display = 'block'

        this.game.configureLevel(ui.selectLevel.value)

        this.ball.update = (delta: number) => {}
        ;(this.game.finishPodium as FinishPodium).update = (ball: Ball) => {}

        ui.endRoundUI?.deactivate()
        ui.inGameUI?.deactivate()

        this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick, false)
        this.renderer.domElement.removeEventListener('mousemove', ui.onDocumentMouseMove, false)
        this.renderer.domElement.removeEventListener('mousewheel', ui.onDocumentMouseWheel, false)
        document.removeEventListener('click', ui.onClick, false)
        document.removeEventListener('keydown', ui.onDocumentKey, false)
        document.removeEventListener('keyup', ui.onDocumentKey, false)

        this.trackballControls = new TrackballControls(this.game.camera, this.renderer.domElement)
        this.trackballControls.rotateSpeed = 5.0
        this.trackballControls.addEventListener('change', (event) => {
            const v = new THREE.Vector3(
                this.game.camera.position.x,
                this.game.camera.position.y,
                this.game.camera.position.z
            ).normalize()

            this.trackballControls?.object.up.copy(v)
        })
        this.trackballControls.target.copy((this.game.startPodium as StartPodium).mesh.position)

        const draggables: THREE.Object3D[] = []
        draggables.push((this.game.startPodium as StartPodium).mesh)
        draggables.push((this.game.finishPodium as FinishPodium).group)
        for (let i = 0; i < this.game.maxJewels; i++) {
            draggables.push(this.game.jewels[i].mesh)
        }
        for (let i = 0; i < this.game.maxPlatforms; i++) {
            if (this.game.platforms[i].type === 3) {
                //console.log(this.game.platforms[i].path.length)
                this.game.platforms[i].path.forEach((p) => {
                    //console.log(j)
                    const pathPoint = new THREE.Mesh(
                        new THREE.SphereGeometry(0.25),
                        new THREE.MeshNormalMaterial()
                    )
                    pathPoint.position.copy(p)
                    pathPoint.userData.type = 'pathPoint'
                    pathPoint.userData.pathPoint = p
                    this.scene.add(pathPoint)
                    draggables.push(pathPoint)
                    //console.log(pathPoint.userData)
                })
            } else {
                draggables.push(this.game.platforms[i].mesh)
            }
        }
        for (let i = 0; i < this.game.maxSprings; i++) {
            draggables.push(this.game.springs[i].mesh)
        }
        for (let i = 0; i < this.game.maxMines; i++) {
            draggables.push(this.game.mines[i].mesh)
        }

        this.dragControls = new DragControls(draggables, this.game.camera, this.renderer.domElement)
        this.dragControls.addEventListener('dragstart', (event: THREE.Event) => {
            ;(this.trackballControls as TrackballControls).enabled = false
            // event.object.material.transparent = true
            // event.object.material.opacity = 0.33
        })
        this.dragControls.addEventListener('dragend', (event: THREE.Event) => {
            ;(this.trackballControls as TrackballControls).enabled = true
            //event.object.material.opacity = 1
            event.object.lookAt(0, 0, 0)
            if (['startpodium', 'finishpodium'].includes(event.object.userData.type)) {
                event.object.rotateX(-Math.PI / 2)
            }
            if (event.object.userData.type === 'finishpodium') {
                const v = new THREE.Vector3()
                event.object.getWorldPosition(v)
                console.log(v)
            } else {
                console.log(event.object.position)
            }

            if (event.object.userData.type === 'pathPoint') {
                console.log(event.object.userData)
                event.object.userData.pathPoint.copy(event.object.position)
            }
        })

        setInterval(() => {
            JEASINGS.update()
            ;(this.trackballControls as TrackballControls).update()
        }, 16.66666)
    }

    onDoubleClick = (event: THREE.Event) => {
        const mouse = {
            x: (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
            y: -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1,
        }
        this.raycaster.setFromCamera(mouse, this.game.camera)

        const intersects = this.raycaster.intersectObjects(this.ball.bouncables, false)

        if (intersects.length > 0) {
            const p = intersects[0].point
            //this.controls?.target.copy(p)
            new JEASINGS.JEasing(this.trackballControls?.target as THREE.Vector3)
                .to(
                    {
                        x: p.x,
                        y: p.y,
                        z: p.z,
                    },
                    500
                )
                //.delay (1000)
                .easing(JEASINGS.Cubic.Out)
                .onUpdate(() => {
                    const v = new THREE.Vector3(
                        this.game.camera.position.x,
                        this.game.camera.position.y,
                        this.game.camera.position.z
                    ).normalize()

                    this.trackballControls?.object.up.copy(v)
                })
                .start()
        }
    }
}
