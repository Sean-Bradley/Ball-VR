import * as THREE from 'three'
import Ball from './ball'
import Game from './game'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min'
import EndRoundUI from './endRoundUI'
import FinishPodium from './finishPodium'
import InGameUI from './inGameUI'
import LevelEditor from './levelEditor'
import { Camera } from 'three'

export default class UI {
    game: Game
    scene: THREE.Scene
    menuActive: boolean
    private renderer: THREE.WebGLRenderer
    ball: Ball
    startButton: HTMLButtonElement
    editButton: HTMLButtonElement
    menuPanel: HTMLDivElement
    private camAngle = 0
    keyMap: { [id: string]: boolean } = {}
    //private gameCommandInterval?: NodeJS.Timer
    controllerGrip0?: THREE.Group
    controllerGrip1?: THREE.Group
    private controllerConnected: { [id: number]: boolean } = {}
    private gamePads: { [id: number]: Gamepad } = {}
    selectLevel: HTMLSelectElement
    endRoundUI?: EndRoundUI
    inGameUI?: InGameUI
    VRsupported: boolean

    constructor(
        game: Game,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,
        ball: Ball,
        VRsupported: boolean
    ) {
        this.game = game
        this.scene = scene
        this.renderer = renderer
        this.menuActive = false
        this.ball = ball
        this.VRsupported = VRsupported
        this.startButton = document.getElementById('startButton') as HTMLButtonElement
        this.editButton = document.getElementById('editButton') as HTMLButtonElement
        this.menuPanel = document.getElementById('menuPanel') as HTMLDivElement
        this.selectLevel = document.getElementById('selectLevel') as HTMLSelectElement
        Object.keys(this.game.levelConfigs).forEach((l) => {
            const o = document.createElement('option')
            o.text = l
            o.value = l
            this.selectLevel.options.add(o)
        })
        const randomLevel = document.createElement('option')
        randomLevel.text = 'Random'
        randomLevel.value = 'Random'
        this.selectLevel.options.add(randomLevel)
        // this.selectLevel.addEventListener('change', () => {
        //     console.log(this.selectLevel.value)
        // })

        this.endRoundUI = new EndRoundUI(
            this.game,
            this.scene,
            this.ball.camera,
            this.renderer,
            this,
            this.ball as Ball,
            VRsupported
        )
        this.inGameUI = new InGameUI(
            this.game,
            this.scene,
            this.ball.camera,
            this.renderer,
            this,
            this.ball as Ball,
            VRsupported
        )

        if (!VRsupported) {
            this.startButton.addEventListener(
                'click',
                () => {
                    this.game.configureLevel(this.selectLevel.value)
                    this.setGameUI(false)
                    renderer.domElement.requestPointerLock()
                },
                false
            )
            this.startButton.style.display = 'inline'
            document.addEventListener('pointerlockchange', this.lockChangeAlert, false)
            this.editButton.addEventListener(
                'click',
                () => {
                    const levelEditor = new LevelEditor(
                        this.game,
                        this.scene,
                        this.renderer,
                        this.ball
                    )
                    levelEditor.setEditMode(this)
                },
                false
            )
        } else {
            this.controllerGrip0 = renderer.xr.getControllerGrip(0)
            this.controllerGrip1 = renderer.xr.getControllerGrip(1)
            this.controllerGrip0.addEventListener('connected', (e: any) => {
                this.controllerConnected[0] = true
                this.gamePads[0] = e.data.gamepad

                // this.scene.add(this.controllerGrip0 as THREE.Object3D)

                // const points = []
                // points.push(new THREE.Vector3(0, 0, 0))
                // points.push(new THREE.Vector3(0, -100, 0))
                // let geometry = new THREE.BufferGeometry().setFromPoints(points)
                // let line = new THREE.Line(
                //     geometry,
                //     new THREE.LineBasicMaterial({ color: 0x8888ff  })
                // )
                // this.controllerGrip0?.add(
                //     new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshNormalMaterial())
                // )
            })
            // this.controllerGrip1.addEventListener('connected', (e: any) => {
            //     this.controllerConnected[1] = true
            //     this.gamePads[1] = e.data.gamepad
            // })
            this.controllerGrip0.addEventListener('selectstart', (e: any) => {
                if (this.controllerConnected[0]) {
                    this.ball.jump()
                }
            })
            // this.controllerGrip1.addEventListener('selectstart', (e: any) => {
            //     if (this.controllerConnected[1]) {
            //         this.ball.jump()
            //     }
            // })
            renderer.xr.addEventListener('sessionstart', () => {
                this.menuActive = false
                this.ball.vrActive = true
                this.ball.chaseCam.add(this.ball.camera)
                this.game.configureLevel(this.selectLevel.value)
                this.setGameUI(true)
            })

            renderer.xr.addEventListener('sessionend', () => {
                //clearInterval(this.gameCommandInterval as NodeJS.Timeout)
                this.updateControls = (delta: number) => {}
                this.menuActive = true
                this.ball.vrActive = false
                this.ball.scene.add(this.ball.camera)
                this.endRoundUI?.deactivate()
                this.inGameUI?.deactivate()
                new TWEEN.Tween(this.ball.chaseCam.position)
                    .to({ y: 20 }, 1000)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start()
            })
        }
    }

    showRoundStats() {
        ;(this.inGameUI as InGameUI).deactivate()
        ;(this.endRoundUI as EndRoundUI).activate()

        //clearInterval(this.gameCommandInterval as NodeJS.Timeout)
        //this.gameCommandInterval = setInterval(() => {
        this.updateControls = (delta: number) => {
            //console.log('showRoundStats key commands')
            if (this.keyMap['r']) {
                //replay
                this.endRoundUI?.deactivate()
                this.game.configureLevel(this.selectLevel.value)
                this.setGameUI(this.VRsupported)
            }
            if (this.keyMap['q']) {
                //quit
                clearInterval(
                    (this.game.finishPodium as FinishPodium)
                        .winnerAnimationInterval as NodeJS.Timeout
                )
                if (this.VRsupported) {
                    this.shutdownXR(this.renderer.xr.getSession() as THREE.XRSession)
                } else {
                    document.exitPointerLock()
                }
            }
            if (this.keyMap['n']) {
                //next level
                if (
                    this.game.clock >= 0 &&
                    this.game.numJewelsFound >= this.game.numJewelsRequired
                ) {
                    this.endRoundUI?.deactivate()
                    this.selectLevel.selectedIndex += 1
                    this.game.configureLevel(this.selectLevel.value)
                    this.setGameUI(this.VRsupported)
                }
            }
        } //, 50)
    }

    lockChangeAlert = () => {
        if (
            document.pointerLockElement === this.renderer.domElement ||
            (document as any).mozPointerLockElement === this.renderer.domElement
        ) {
            this.renderer.domElement.addEventListener('mousemove', this.onDocumentMouseMove, false)
            this.renderer.domElement.addEventListener(
                'mousewheel',
                this.onDocumentMouseWheel,
                false
            )
            document.addEventListener('click', this.onClick, false)
            document.addEventListener('keydown', this.onDocumentKey, false)
            document.addEventListener('keyup', this.onDocumentKey, false)

            this.menuPanel.style.display = 'none'
            this.startButton.style.display = 'none'
            this.menuActive = false
        } else {
            //clearInterval(this.gameCommandInterval as NodeJS.Timeout)
            this.updateControls = (delta: number) => {}
            clearInterval(
                (this.game.finishPodium as FinishPodium).winnerAnimationInterval as NodeJS.Timeout
            )
            this.endRoundUI?.deactivate()
            this.inGameUI?.deactivate()
            this.ball.activate()

            this.renderer.domElement.removeEventListener(
                'mousemove',
                this.onDocumentMouseMove,
                false
            )
            this.renderer.domElement.removeEventListener(
                'mousewheel',
                this.onDocumentMouseWheel,
                false
            )
            document.removeEventListener('click', this.onClick, false)
            document.removeEventListener('keydown', this.onDocumentKey, false)
            document.removeEventListener('keyup', this.onDocumentKey, false)

            this.menuPanel.style.display = 'block'
            this.menuActive = true

            new TWEEN.Tween(this.ball.chaseCam.position)
                .to({ y: 20 }, 1000)
                .easing(TWEEN.Easing.Cubic.Out)
                .start()

            setTimeout(() => {
                // delay start to prevent pointerlock error if restarted to quickly
                this.startButton.style.display = 'inline'
            }, 1000)
        }
    }

    setGameUI(VRsupported: boolean) {
        //clearInterval(this.gameCommandInterval as NodeJS.Timeout)
        if (VRsupported) {
            //this.gameCommandInterval = setInterval(() => {
            this.updateControls = (delta: number) => {
                //console.log('keyCheckInterval xr in game')
                //for (let key in Object.keys(this.gamePads)) {
                // if (this.controllerConnected[0]) {
                //     const gp = this.gamePads[0]
                //     this.ball.targetPivotRotation += gp.axes[2] * 0.1
                // }
                if (this.controllerConnected[0]) {
                    const gp = this.gamePads[0]
                    if (gp.buttons[3].touched) {
                        this.ball.forwardForce = -gp.axes[3]
                        this.ball.rightForce = -gp.axes[2]
                        if (Math.abs(this.ball.forwardForce) > 0.1) {
                            this.ball.adjustingForwardForce = true
                        }
                        if (Math.abs(this.ball.rightForce) > 0.1) {
                            //this.ball.adjustingRightForce = true
                            this.ball.targetPivotRotation += gp.axes[2] * 0.1
                        }
                    }
                }
            } //, 50)
        } else {
            //this.gameCommandInterval = setInterval(() => {
            this.updateControls = (delta: number) => {
                //console.log('desktop game commands')
                // if (this.keyMap['p']) {
                //     console.log(this.ball.object3D.position)
                // }

                if (this.keyMap[' ']) {
                    this.ball.jump()
                }

                this.ball.adjustingForwardForce = false
                if (this.keyMap['w']) {
                    if (this.ball.forwardForce < 1) {
                        this.ball.forwardForce += 2 * delta
                    }
                    this.ball.adjustingForwardForce = true
                }
                if (this.keyMap['s']) {
                    if (this.ball.forwardForce > -1) {
                        this.ball.forwardForce -= 2 * delta
                    }
                    this.ball.adjustingForwardForce = true
                }
                this.ball.adjustingRightForce = false
                if (this.keyMap['a']) {
                    if (this.ball.rightForce < 1) {
                        this.ball.rightForce += 2 * delta
                    }
                    this.ball.adjustingRightForce = true
                }
                if (this.keyMap['d']) {
                    if (this.ball.rightForce > -1) {
                        this.ball.rightForce -= 2 * delta
                    }
                    this.ball.adjustingRightForce = true
                }

                if (!this.ball.adjustingForwardForce) {
                    if (this.ball.forwardForce > 0) {
                        this.ball.forwardForce -= delta
                    }
                    if (this.ball.forwardForce < 0) {
                        this.ball.forwardForce += delta
                    }
                }
                if (!this.ball.adjustingRightForce) {
                    if (this.ball.rightForce > 0) {
                        this.ball.rightForce -= delta
                    }
                    if (this.ball.rightForce < 0) {
                        this.ball.rightForce += delta
                    }
                }
                //round
                this.ball.forwardForce = Math.round(this.ball.forwardForce * 100) / 100
            } //, 50)
        }
        this.game.startRound()
        this.inGameUI?.activate()
    }

    onClick = () => {
        this.ball.jump()
    }
    onDocumentKey = (e: KeyboardEvent) => {
        this.keyMap[e.key] = e.type === 'keydown'
    }

    onDocumentMouseMove = (e: MouseEvent) => {
        this.ball.pivot.rotation.z += e.movementX * 0.0025
        this.camAngle += e.movementY * 0.002
        this.camAngle = Math.max(Math.min(this.camAngle, 1.5), -0.4)
        this.ball.chaseCam.position.z = -this.camAngle * 5
        this.ball.chaseCam.rotation.x = -this.camAngle - Math.PI / 2

        return false
    }

    onDocumentMouseWheel = (e: THREE.Event) => {
        let newVal = this.ball.chaseCam.position.y + e.deltaY * 0.05
        if (newVal > 0.25) {
            this.ball.chaseCam.position.y = newVal
        }
        return false
    }

    async shutdownXR(session: THREE.XRSession) {
        if (session) {
            await session.end()
        }
    }

    updateControls = (delta: number) => {
        //this gets replaced at runtime depending on game phases
    }
}
