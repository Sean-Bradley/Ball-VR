import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import Ball from './ball'
import * as CANNON from 'cannon-es'
import Earth from './earth'
import Explosion from './explosion'

export default class Mine {
    scene: THREE.Scene
    private earth: Earth
    mesh = new THREE.Mesh()
    explosions: { [id: string]: Explosion } = {}

    constructor(scene: THREE.Scene, earth: Earth, explosions: { [id: string]: Explosion }) {
        this.scene = scene
        this.earth = earth
        this.explosions = explosions
        //const material = new THREE.MeshMatcapMaterial({})
        //const texture = new THREE.TextureLoader().load('img/matcap-opal.png')
        //material.matcap = texture

        const material = new THREE.MeshPhongMaterial({ color: 0x000000 })

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/mine.obj',
            (obj) => {
                obj.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        // m.receiveShadow = true
                        // m.castShadow = true
                        this.mesh.material = material
                        this.mesh.geometry = m.geometry
                        this.mesh.geometry.rotateX(-Math.PI / 2)
                    }
                })

                scene.add(this.mesh)

                this.randomise()
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
        const p = this.earth.getSpawnPosition(0)
        this.mesh.position.copy(p)
        this.mesh.lookAt(0, 0, 0)
    }

    update(ball: Ball) {
        const d = this.mesh.position.distanceTo(ball.object3D.position)
        if (d < 3) {
            const v1 = new CANNON.Vec3(
                ball.object3D.position.x,
                ball.object3D.position.y,
                ball.object3D.position.z
            )
            const v2 = new CANNON.Vec3(
                this.mesh.position.x,
                this.mesh.position.y,
                this.mesh.position.z
            )
            ball.body.applyForce(v1.vsub(v2).scale(500))
            Object.keys(this.explosions).forEach((o) => {
                this.explosions[o].explode(this.mesh.position)
            })
            this.mesh.position.set(0, 0, 0) //hide mine until next round
        }
    }
}
