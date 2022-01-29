import * as THREE from 'three'
import Ball from './ball'
import Game from './game'
import UI from './ui'
//import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

export default class InGameUI {
    // private game: Game
    // private scene: THREE.Scene
    // private camera: THREE.PerspectiveCamera
    // private renderer: THREE.WebGLRenderer
    ui: UI
    private ball: Ball
    private group = new THREE.Group()
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private texture: THREE.Texture
    private panel: THREE.Mesh
    // static material = new THREE.MeshMatcapMaterial({
    //     matcap: new THREE.TextureLoader().load('img/jewel.png'),
    //     depthTest: false,
    //     depthWrite: false,
    // })

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
        // this.game = game
        // this.scene = scene
        // this.camera = camera
        // this.renderer = renderer
        this.ui = ui
        this.ball = ball
        this.VRsupported = VRsupported

        this.canvas = document.createElement('canvas') as HTMLCanvasElement
        this.canvas.width = 128
        this.canvas.height = 128

        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        this.texture = new THREE.Texture(this.canvas)
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            depthTest: false,
            transparent: true,
        })
        const geometry = new THREE.PlaneGeometry(0.5, 0.5, 1, 1)
        this.panel = new THREE.Mesh(geometry, material)
        this.panel.position.x = 0
        this.panel.position.y = 0
        this.panel.position.z = -2
        this.group.add(this.panel)

        // const objLoader = new OBJLoader()
        // objLoader.load(
        //     'models/jewel.obj',
        //     (obj) => {
        //         obj.traverse((child) => {
        //             if ((child as THREE.Mesh).isMesh) {
        //                 const m = child.clone() as THREE.Mesh
        //                 m.material = InGameUI.material
        //                 m.geometry.center()
        //                 m.geometry.rotateX(Math.PI / 7)
        //                 m.scale.set(0.02, 0.02, 0.02)
        //                 m.position.set(0, -1.2, -.2)
        //                 m.renderOrder = 999
        //                 this.group.add(m)
        //             }
        //         })
        //     },
        //     (xhr) => {
        //         console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
        //     },
        //     (error) => {
        //         console.log(error)
        //     }
        // )

        this.group.position.y = VRsupported ? 1.75 : 1.25
        this.group.position.z = VRsupported ? -0.5 : 0
    }

    update(clock: number, jewelsRequired: number, jewelsFound: number) {
        //console.log(clock)

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = `rgba(0,0,0,.5)`
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.strokeStyle = `rgba(255,255,255,1)`
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)

        this.ctx.fillStyle = `rgba(255,255,255,1)`
        this.ctx.textAlign = 'center'
        if (clock >= 0) {
            this.ctx.font = '80px monospace'
            this.ctx.fillText(String(clock), 64, 68)
        }
        this.ctx.font = '34px monospace'
        this.ctx.fillText(jewelsFound + '/' + jewelsRequired + '💎', 64, 108)

        this.texture.needsUpdate = true
    }

    public activate() {
        this.VRsupported ? this.ball.chaseCam.add(this.group) : this.ball.camera.add(this.group)
    }
    public deactivate() {
        this.VRsupported
            ? this.ball.chaseCam.remove(this.group)
            : this.ball.camera.remove(this.group)
    }
}
