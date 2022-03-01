import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as CANNON from 'cannon-es'

export default class StartPodium {
    scene: THREE.Scene
    world: CANNON.World
    mesh = new THREE.Mesh()
    body = new CANNON.Body()
    texture = new THREE.Texture()

    constructor(scene: THREE.Scene, world: CANNON.World) {
        this.scene = scene
        this.world = world

        const gltfLoader = new GLTFLoader()
        gltfLoader.load(
            'models/start.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        this.mesh = child as THREE.Mesh
                        this.texture = (
                            (child as THREE.Mesh).material as THREE.MeshStandardMaterial
                        ).map as THREE.Texture
                        this.mesh.userData.type = "startpodium"
                    }
                })
                this.body = new CANNON.Body({ mass: 0 })
                this.body.addShape(new CANNON.Cylinder(3.4, 3.4, 0.68, 12))
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        setInterval(() => {
            //console.log("startpodium setInterval")
            this.texture.rotation += Math.PI
            this.texture.needsUpdate = true
        }, 500)
    }

    deactivate() {
        this.scene.remove(this.mesh)
        this.world.removeBody(this.body)
    }

    activate(position: THREE.Vector3) {
        this.mesh.position.copy(position)
        this.mesh.lookAt(0, 0, 0)
        this.mesh.rotateX(-Math.PI / 2)
        this.scene.add(this.mesh)

        this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
        this.body.quaternion.set(
            this.mesh.quaternion.x,
            this.mesh.quaternion.y,
            this.mesh.quaternion.z,
            this.mesh.quaternion.w
        )
        this.world.addBody(this.body)
    }
}
