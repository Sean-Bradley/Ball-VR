/**
 * @license
 * ButtonVR library and demos
 * Copyright 2021 Sean Bradley https://sbcode.net
 * https://github.com/Sean-Bradley/ButtonVR/blob/master/LICENSE
 */

import * as THREE from 'three'

export default class ButtonVR {
    private _scene: THREE.Scene
    private _canvas: HTMLCanvasElement
    private _ctx: CanvasRenderingContext2D
    private _texture: THREE.Texture
    private _buttons: THREE.Object3D[] = new Array()
    private _raycaster = new THREE.Raycaster()
    //private _cameraWorldQuaternion = new THREE.Quaternion()
    private _lookAtVector = new THREE.Vector3(0, 0, -1)
    private _camera: THREE.Camera
    private _renderer: THREE.WebGLRenderer
    private _eventListeners: any[] = new Array()
    private _progress: THREE.Mesh
    private _timer = 0
    private _delta = 0
    private _clock = new THREE.Clock()
    private _buttonPressStarted = false
    private _buttonPressed = false
    private _duration = 1.0
    private _lastIntersect?: THREE.Intersection
    private _circle: THREE.Mesh
    private _interval?: NodeJS.Timeout

    constructor(
        scene: THREE.Scene,
        camera: THREE.Camera,
        renderer: THREE.WebGLRenderer,
        durationMS?: number
    ) {
        this._scene = scene
        this._camera = camera
        this._renderer = renderer

        if (durationMS) {
            this._duration = durationMS / 1000
        }

        // let points = []
        // points.push(new THREE.Vector3(-0.05, 0, 0))
        // points.push(new THREE.Vector3(0.05, 0, 0))
        // const lineGeometry1 = new THREE.BufferGeometry().setFromPoints(points)
        // const lineMesh1 = new THREE.Line(
        //     lineGeometry1,
        //     new THREE.LineBasicMaterial({ color: 0x8888ff, depthTest: false, depthWrite: false })
        // )
        // lineMesh1.position.set(0, 0, -2)
        // this._camera.add(lineMesh1)
        // points = []
        // points.push(new THREE.Vector3(0, -0.05, 0))
        // points.push(new THREE.Vector3(0, 0.05, 0))
        // const lineGeometry2 = new THREE.BufferGeometry().setFromPoints(points)
        // const lineMesh2 = new THREE.Line(
        //     lineGeometry2,
        //     new THREE.LineBasicMaterial({ color: 0x8888ff, depthTest: false, depthWrite: false })
        // )
        // lineMesh2.position.set(0, 0, -2)
        //this._camera.add(lineMesh2)

        const circleGeometry = new THREE.CircleGeometry(0.015, 8)
        this._circle = new THREE.Mesh(
            circleGeometry,
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        )
        this._circle.position.set(0, 0, -2)
        //this._camera.add(this._circle)

        this._canvas = document.createElement('canvas') as HTMLCanvasElement
        this._canvas.width = 100
        this._canvas.height = 1
        this._ctx = this._canvas.getContext('2d') as CanvasRenderingContext2D
        this._texture = new THREE.Texture(this._canvas)
        const material = new THREE.MeshBasicMaterial({
            map: this._texture,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 1.0,
        })
        const geometry = new THREE.PlaneGeometry(0.5, 0.05, 1, 1)
        this._progress = new THREE.Mesh(geometry, material)
        this._progress.position.x = 0
        this._progress.position.y = 0
        this._progress.position.z = -2
        this._progress.renderOrder = 9999
        //this._camera.add(this._progress)
    }

    public get buttons() {
        return this._buttons
    }
    public set buttons(value) {
        this._buttons = value
    }

    public update() {
        if (this._renderer.xr.isPresenting) {
            let xrCamera = this._renderer.xr.getCamera(this._camera)
            //xrCamera.getWorldQuaternion(this._cameraWorldQuaternion);

            this._raycaster.ray.direction
                .copy(this._lookAtVector)
                .applyEuler(new THREE.Euler().setFromQuaternion(xrCamera.quaternion, 'XYZ'))
            this._raycaster.ray.origin.copy(xrCamera.position)

            let intersects = this._raycaster.intersectObjects(this.buttons)
            this._delta = this._clock.getDelta()
            if (intersects.length > 0) {
                this._lastIntersect = intersects[0]
                if (this._timer === 0) {
                    this._buttonPressStarted = true
                    this.dispatchEvent('pressedStart', intersects[0])
                }
                this._timer += this._delta

                this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
                this._ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
                const y = Math.floor((this._timer * 100) / this._duration)
                this._ctx.beginPath()
                this._ctx.moveTo(0, 0)
                this._ctx.lineTo(y, 0)
                this._ctx.stroke()

                if (!this._buttonPressed && this._timer > this._duration) {
                    //1 = 1 second
                    this.dispatchEvent('pressed', intersects[0])
                    this._buttonPressed = true
                }
            } else {
                if (this._buttonPressStarted) {
                    this.dispatchEvent('pressedEnd', this._lastIntersect)
                    this._buttonPressed = false
                    this._buttonPressStarted = false
                }
                this._timer = 0
                this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
                //console.log( this._timer)
            }
            this._texture.needsUpdate = true
        }
    }

    public activate() {
        if (this._camera.parent === null) {
            this._scene.add(this._camera)
        }
        this._camera.add(this._circle)
        this._camera.add(this._progress)

        this._interval = setInterval(() => {
            this.update()
        }, 100)
    }

    public deactivate() {
        clearInterval(this._interval as NodeJS.Timeout)
        this._camera.remove(this._circle)
        this._camera.remove(this._progress)
    }

    public addEventListener(type: string, eventHandler: any) {
        const listener = { type: type, eventHandler: eventHandler }
        this._eventListeners.push(listener)
    }

    public dispatchEvent(type: string, intersection?: THREE.Intersection) {
        for (let i = 0; i < this._eventListeners.length; i++) {
            if (type === this._eventListeners[i].type) {
                this._eventListeners[i].eventHandler(intersection)
            }
        }
    }
}
