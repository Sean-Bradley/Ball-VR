import Ball from './ball'
import Game from './game'

export default class UI {
    menuActive: boolean
    private renderer: THREE.WebGLRenderer
    ball: Ball
    private startButton: HTMLButtonElement
    menuPanel: HTMLDivElement
    private camAngle = 0
    keyMap: { [id: string]: boolean } = {}
    private keyCheckInterval: NodeJS.Timer
    controllerGrip0: THREE.Group
    controllerGrip1: THREE.Group
    private controllerConnected: { [id: number]: boolean } = {}
    private gamePads: { [id: number]: Gamepad } = {}

    constructor(renderer: THREE.WebGLRenderer, ball: Ball) {
        this.renderer = renderer
        this.menuActive = false
        this.ball = ball
        this.startButton = document.getElementById('startButton') as HTMLButtonElement
        this.menuPanel = document.getElementById('menuPanel') as HTMLDivElement

        this.startButton.addEventListener(
            'click',
            () => {
                renderer.domElement.requestPointerLock()
            },
            false
        )
        document.addEventListener('pointerlockchange', this.lockChangeAlert, false)

        this.controllerGrip0 = renderer.xr.getControllerGrip(0)
        this.controllerGrip1 = renderer.xr.getControllerGrip(1)
        this.controllerGrip0.addEventListener('connected', (e: any) => {
            this.controllerConnected[0] = true
            this.gamePads[0] = e.data.gamepad
        })
        this.controllerGrip1.addEventListener('connected', (e: any) => {
            this.controllerConnected[1] = true
            this.gamePads[1] = e.data.gamepad
        })
        // this.controllerGrip0.addEventListener('selectstart', (e: any) => {
        //     if (this.controllerConnected[0]) {
        //         this.ball.jump()
        //     }
        // })
        // this.controllerGrip1.addEventListener('selectstart', (e: any) => {
        //     if (this.controllerConnected[1]) {
        //         this.ball.jump()
        //     }
        // })
        renderer.xr.addEventListener('sessionstart', () => {
            this.menuActive = false
            this.ball.vrActive = true
            this.ball.chaseCam.add(this.ball.camera)
        })

        renderer.xr.addEventListener('sessionend', () => {
            this.menuActive = true
            this.ball.vrActive = false
            this.ball.scene.add(this.ball.camera)
        })

        this.keyCheckInterval = setInterval(() => {
            this.ball.adjustingForwardForce = false
            if (this.keyMap['w']) {
                if (this.ball.forwardForce < 1) {
                    this.ball.forwardForce += 0.1
                }
                this.ball.adjustingForwardForce = true
            }
            if (this.keyMap['s']) {
                if (this.ball.forwardForce > -1) {
                    this.ball.forwardForce -= 0.1
                }
                this.ball.adjustingForwardForce = true
            }
            this.ball.adjustingRightForce = false
            if (this.keyMap['a']) {
                if (this.ball.rightForce < 1) {
                    this.ball.rightForce += 0.1
                }
                this.ball.adjustingRightForce = true
            }
            if (this.keyMap['d']) {
                if (this.ball.rightForce > -1) {
                    this.ball.rightForce -= 0.1
                }
                this.ball.adjustingRightForce = true
            }

            if (!this.ball.adjustingForwardForce) {
                if (this.ball.forwardForce > 0) {
                    this.ball.forwardForce -= 0.1
                }
                if (this.ball.forwardForce < 0) {
                    this.ball.forwardForce += 0.1
                }
            }
            if (!this.ball.adjustingRightForce) {
                if (this.ball.rightForce > 0) {
                    this.ball.rightForce -= 0.1
                }
                if (this.ball.rightForce < 0) {
                    this.ball.rightForce += 0.1
                }
            }

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
        }, 50)
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
            //document.addEventListener('click', this.onClick, false)
            document.addEventListener('keydown', this.onDocumentKey, false)
            document.addEventListener('keyup', this.onDocumentKey, false)

            this.menuPanel.style.display = 'none'
            this.menuActive = false
        } else {
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
            //document.removeEventListener('click', this.onClick, false)
            document.removeEventListener('keydown', this.onDocumentKey, false)
            document.removeEventListener('keyup', this.onDocumentKey, false)
            //this.menuPanel.style.display = 'block'
            this.menuActive = true
        }
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
}
