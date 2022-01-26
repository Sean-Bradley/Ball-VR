import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { GUI } from 'dat.gui'
import StatsVR from 'statsvr'
import Earth from './earth'

export default class Ball {
    scene: THREE.Scene
    world: CANNON.World
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    object3D: THREE.Object3D
    pivot: THREE.Object3D
    material: THREE.MeshPhysicalMaterial
    //cubeCamera: THREE.CubeCamera
    mesh: THREE.Mesh
    body: CANNON.Body
    private camPos = new THREE.Vector3()
    private camQuat = new THREE.Quaternion()
    chaseCam = new THREE.Object3D()
    forwardForce = 0
    rightForce = 0
    adjustingForwardForce = false
    adjustingRightForce = false
    vForward = new THREE.Vector3(-1, 0, 0)
    vRight = new THREE.Vector3(0, 0, 1)
    enabled = false
    totalForce = new THREE.Vector3()
    vrActive = false
    targetPivotRotation = 0
    raycaster = new THREE.Raycaster()
    earth: Earth
    bouncables: THREE.Mesh[] = []

    constructor(
        scene: THREE.Scene,
        world: CANNON.World,
        camera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer,
        earth: Earth
    ) {
        this.scene = scene
        this.world = world
        this.camera = camera
        this.renderer = renderer
        this.earth = earth

        this.object3D = new THREE.Object3D()
        this.scene.add(this.object3D)

        //desktop camera
        this.pivot = new THREE.Object3D()
        this.object3D.add(this.pivot)

        // const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(16, {})
        // this.cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRenderTarget)
        // this.scene.add(this.cubeCamera)
        // const material = new THREE.MeshBasicMaterial({
        //     map: new THREE.TextureLoader().load('img/marble.png'),
        //     reflectivity: 0.9,
        //     color: 0xffffff,
        //     envMap: cubeRenderTarget.texture,
        //     side: THREE.FrontSide,
        // })

        this.material = new THREE.MeshPhysicalMaterial({
            reflectivity: 1.0,
            transmission: 1.0,
            roughness: 0,
            metalness: 0,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
            color: new THREE.Color(0xffffff),
            ior: 1.5,
            side: THREE.FrontSide,
            map: new THREE.TextureLoader().load('img/marble.png'),
        })
        this.material.thickness = 50.0

        this.mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 24, 24), this.material)
        this.scene.add(this.mesh)
        // const innerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.95, 0), new THREE.MeshNormalMaterial({wireframe:true}))
        // this.mesh.add(innerMesh)

        this.body = new CANNON.Body({ mass: 1 })
        this.body.addShape(new CANNON.Sphere(1))
        // this.body.addEventListener('collide', (e: any) => {
        //     //if (e.contact.ni.dot(new CANNON.Vec3(0, 1, 0)) < -0.5) {
        //     //}
        // })
        this.world.addBody(this.body)

        this.chaseCam = new THREE.Object3D()
        this.chaseCam.position.set(0, 5, 0)
        this.chaseCam.rotateX(-Math.PI / 2)
        this.pivot.add(this.chaseCam)

        // const gui = new GUI()
        // gui.add(this.material, 'reflectivity', 0, 1.0)
        // gui.add(this.material, 'transmission', 0, 1.0)
        // gui.add(this.material, 'roughness', 0, 1.0)
        // gui.add(this.material, 'metalness', 0, 1.0)
        // gui.add(this.material, 'clearcoat', 0, 1.0)
        // gui.add(this.material, 'clearcoatRoughness', 0, 1.0)
        // gui.add(this.material, 'ior', 1.0, 2.333)
        // gui.add(this.material, 'thickness', 0, 100)
        // gui.open()

        this.earth.planes.forEach((p) => {
            this.bouncables.push(p)
        })
    }

    jump() {
        const dir = this.object3D.position.clone().negate().normalize()
        this.raycaster.set(this.object3D.position, dir)

        const intersects = this.raycaster.intersectObjects(this.bouncables, false)
        if (intersects.length > 0) {
            if (intersects[0].distance < 1.25) {
                const v = new CANNON.Vec3(
                    this.mesh.position.x * 5,
                    this.mesh.position.y * 5,
                    this.mesh.position.z * 5
                )
                this.body.applyForce(v)
            }
        }
    }

    spawn(startPosition: THREE.Vector3) {
        console.log('Spawn Ball')

        this.enabled = false

        this.world.removeBody(this.body)

        const o = new THREE.Object3D()
        o.position.copy(startPosition)
        o.lookAt(new THREE.Vector3())

        const q = new CANNON.Quaternion().set(
            o.quaternion.x,
            o.quaternion.y,
            o.quaternion.z,
            o.quaternion.w
        )

        this.body.position.set(startPosition.x, startPosition.y, startPosition.z)
        this.body.quaternion.copy(q)

        setTimeout(() => {
            this.body.velocity.set(0, 0, 0)
            this.body.angularVelocity.set(0, 0, 0)
            this.world.addBody(this.body)
            this.enabled = true
        }, 1000)
    }

    lerp = (x: number, y: number, a: number): number => {
        return (1 - a) * x + a * y
    }

    update(delta: number) {
        this.object3D.position.set(this.body.position.x, this.body.position.y, this.body.position.z)
        this.object3D.lookAt(0, 0, 0)

        this.mesh.position.copy(this.object3D.position)
        this.mesh.quaternion.set(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        )
        // this.mesh.visible = false
        // this.cubeCamera.position.copy(this.mesh.position)
        // this.cubeCamera.update(this.renderer, this.scene)
        // this.mesh.visible = true

        if (!this.vrActive) {
            this.chaseCam.getWorldPosition(this.camPos)
            this.camera.position.lerpVectors(this.camera.position, this.camPos, 0.2)

            this.chaseCam.getWorldQuaternion(this.camQuat)
            this.camera.quaternion.slerp(this.camQuat, 0.2)
        } else {
            this.pivot.rotation.z = this.lerp(
                this.pivot.rotation.z,
                this.targetPivotRotation,
                0.025
            )
        }

        this.totalForce.set(0, 0, 0)
        if (this.adjustingForwardForce) {
            this.vForward.set(-1, 0, 0)
            this.vForward.applyQuaternion(this.camera.quaternion)
            this.vForward.multiplyScalar(this.forwardForce * 20)
            this.totalForce.add(this.vForward)
            // const v = new CANNON.Vec3(this.totalForce.x, this.totalForce.y, this.totalForce.z)
            // v.normalize()
            // this.body.applyImpulse(v)
        }
        if (this.adjustingRightForce) {
            this.vRight.set(0, 0, 1)
            this.vRight.applyQuaternion(this.camera.quaternion)
            this.vRight.multiplyScalar(this.rightForce * 20)
            this.totalForce.add(this.vRight)            
        }
        if (this.adjustingForwardForce || this.adjustingRightForce) {
            this.body.angularVelocity.set(this.totalForce.x, this.totalForce.y, this.totalForce.z)

          
        }
    }
}
