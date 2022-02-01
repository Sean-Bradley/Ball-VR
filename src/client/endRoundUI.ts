import * as THREE from 'three'
import Ball from './ball'
import FinishPodium from './finishPodium'
import Game from './game'
import UI from './ui'
import ButtonVR from './utils/buttonvr'

export default class EndRoundUI {
    private game: Game
    private scene: THREE.Scene
    private camera: THREE.PerspectiveCamera
    private renderer: THREE.WebGLRenderer
    ui: UI
    private ball: Ball
    private group = new THREE.Group()
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private texture: THREE.Texture
    private panel: THREE.Mesh
    private buttonVR?: ButtonVR
    private replayButton: THREE.Mesh
    private cancelButton: THREE.Mesh
    private nextButton: THREE.Mesh
    private VRsupported = false

    constructor(
        game: Game,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        ui: UI,
        ball: Ball,
        VRsupported: boolean
    ) {
        this.game = game
        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.ui = ui
        this.ball = ball
        this.VRsupported = VRsupported

        this.canvas = document.createElement('canvas') as HTMLCanvasElement
        this.canvas.width = 512
        this.canvas.height = 384

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        this.texture = new THREE.Texture(this.canvas)
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            depthTest: false,
            transparent: true,
        })
        const geometry = new THREE.PlaneGeometry(2, 1.5, 1, 1)
        this.panel = new THREE.Mesh(geometry, material)
        this.panel.position.x = 0
        this.panel.position.y = 0
        this.panel.position.z = -2
        this.group.add(this.panel)

        if (VRsupported) {
            this.buttonVR = new ButtonVR(this.scene, this.camera, this.renderer)
            this.buttonVR.addEventListener('pressedStart', (intersection: THREE.Intersection) => {
                ;(
                    (intersection.object as THREE.Mesh).material as THREE.MeshBasicMaterial
                ).opacity = 1.0
            })
            this.buttonVR.addEventListener('pressed', (intersection: THREE.Intersection) => {
                if (intersection.object.name === 'cancel') {
                    this.deactivate()
                    clearInterval(
                        (this.game.finishPodium as FinishPodium)
                            .winnerAnimationInterval as NodeJS.Timeout
                    )
                    if (this.VRsupported) {
                        this.ui.shutdownXR(this.renderer.xr.getSession() as THREE.XRSession)
                    }
                } else if (intersection.object.name === 'replay') {
                    this.deactivate()
                    this.game.configureLevel((this.game.ui as UI).selectLevel.value)
                    this.ui.setGameUI(this.VRsupported)
                } else if (intersection.object.name === 'next') {
                    this.ui.endRoundUI?.deactivate()
                    this.ui.selectLevel.selectedIndex += 1
                    this.game.configureLevel(this.ui.selectLevel.value)
                    this.ui.setGameUI(this.VRsupported)
                }
            })
            this.buttonVR.addEventListener('pressedEnd', (intersection: THREE.Intersection) => {
                ;(
                    (intersection.object as THREE.Mesh).material as THREE.MeshBasicMaterial
                ).opacity = 0.5
            })
        }

        this.replayButton = new THREE.Mesh(
            new THREE.PlaneGeometry(0.65, 0.25),
            new THREE.MeshBasicMaterial({
                color: 0x00ff66,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
            })
        )
        this.replayButton.renderOrder = -1
        this.replayButton.name = 'replay'
        this.replayButton.position.set(-0.5, -0.24, -2)
        if (this.buttonVR) this.buttonVR?.buttons.push(this.replayButton)

        this.nextButton = new THREE.Mesh(
            new THREE.PlaneGeometry(0.65, 0.25),
            new THREE.MeshBasicMaterial({
                color: 0x00ff66,
                transparent: true,
                opacity: 0.5,
            })
        )
        this.nextButton.renderOrder = -1
        this.nextButton.name = 'next'
        this.nextButton.position.set(0.5, -0.24, -2)
        if (this.buttonVR) this.buttonVR?.buttons.push(this.nextButton)

        this.cancelButton = new THREE.Mesh(
            new THREE.PlaneGeometry(0.65, 0.25),
            new THREE.MeshBasicMaterial({
                color: 0xff0066,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
            })
        )
        this.cancelButton.renderOrder = -1
        this.cancelButton.name = 'cancel'
        this.cancelButton.position.set(0, -0.55, -2)
        if (this.buttonVR) this.buttonVR?.buttons.push(this.cancelButton)

        this.group.position.y = VRsupported ? 1 : 0
        this.group.position.z = VRsupported ? -0.5 : 0
    }

    public activate() {
        this.group.add(this.replayButton)
        this.group.add(this.cancelButton)

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = `rgba(0,0,0,.5)`
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.strokeStyle = `rgba(255,255,255,1)`
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)

        // this.ctx.strokeRect(63, 159, 130, 66)
        // this.ctx.strokeRect(319, 159, 130, 66)

        this.ctx.fillStyle = `rgba(255,255,255,1)`
        this.ctx.textAlign = 'center'
        if (this.game.clock < 0) {
            this.ctx.font = '50px monospace'
            this.ctx.fillText('Out Of Time', 256, 80)
            this.ctx.fillText('Try Again', 256, 140)
        } else if (this.game.numJewelsFound >= this.game.numJewelsRequired) {
            this.group.add(this.nextButton)
            this.ctx.font = '80px monospace'
            this.ctx.fillText('Winner', 256, 100)
            this.ctx.font = '34px monospace'
            this.ctx.fillText('(N)ext', 384, 262)
        } else {
            this.ctx.font = '45px monospace'
            this.ctx.fillText('Need More Jewels', 256, 80)
            this.ctx.fillText('Try Again', 256, 140)
        }
        this.ctx.font = '34px monospace'
        this.ctx.fillText('(R)eplay', 128, 262)
        this.ctx.fillText('(Q)uit', 256, 342)

        this.texture.needsUpdate = true

        if (this.buttonVR) this.buttonVR?.activate()
        this.VRsupported ? this.ball.chaseCam.add(this.group) : this.ball.camera.add(this.group)
    }
    public deactivate() {
        this.group.remove(this.replayButton)
        this.group.remove(this.nextButton)
        this.group.remove(this.cancelButton)

        if (this.buttonVR) this.buttonVR?.deactivate()
        this.VRsupported
            ? this.ball.chaseCam.remove(this.group)
            : this.ball.camera.remove(this.group)
    }
}
