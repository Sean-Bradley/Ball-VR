import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import Ball from './ball'
import Earth from './earth'
import Explosion from './explosion'

export default class Jewel {
    scene: THREE.Scene
    private earth: Earth
    mesh = new THREE.Mesh()
    explosions: { [id: string]: Explosion } = {}

    static material = new THREE.MeshMatcapMaterial({
        matcap: new THREE.TextureLoader().load('img/jewel.png'),
    })

    constructor(scene: THREE.Scene, earth: Earth, explosions: { [id: string]: Explosion }) {
        this.scene = scene
        this.earth = earth
        this.explosions = explosions

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/jewel.obj',
            (obj) => {
                obj.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        // m.receiveShadow = true
                        // m.castShadow = true
                        this.mesh.material = Jewel.material
                        this.mesh.geometry = m.geometry
                        this.mesh.geometry.rotateX(-Math.PI / 2)
                    }
                })
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )
    }

    randomise() {
        const p = this.earth.getSpawnPosition(1)
        this.mesh.position.copy(p)
        this.mesh.lookAt(0, 0, 0)
    }

    deactivate() {
        this.update = (ball: Ball) => {}
        this.scene.remove(this.mesh)
    }

    activate() {
        this.update = (ball: Ball) => {
            const d = this.mesh.position.distanceTo(ball.object3D.position)
            if (d < 2) {
                Object.keys(this.explosions).forEach((o) => {
                    this.explosions[o].explode(this.mesh.position)
                })
                this.deactivate()
            }
            this.mesh.rotation.z -= 0.025
        }

        this.scene.add(this.mesh)
    }

    update(ball: Ball) {
        //do not edit this. The function body is created when object is activated
    }
}
