import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import Ball from './ball'
import * as CANNON from 'cannon-es'
import Earth from './earth'

export default class Spring {
    private earth: Earth
    mesh = new THREE.Mesh()

    constructor(scene: THREE.Scene, earth: Earth) {
        this.earth = earth
        const material = new THREE.MeshMatcapMaterial({})
        const texture = new THREE.TextureLoader().load('img/matcap-opal.png')
        material.matcap = texture

        const objLoader = new OBJLoader()
        objLoader.load(
            'models/spring.obj',
            (obj) => {
                obj.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const m = child as THREE.Mesh
                        m.receiveShadow = true
                        m.castShadow = true
                        m.material = material
                        this.mesh = m
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
        const p = this.earth.getSpawnPosition()
        this.mesh.position.copy(p)
        this.mesh.lookAt(0, 0, 0)      
    }

    update(ball: Ball) {
        const d = this.mesh.position.distanceTo(ball.object3D.position)
        if (d < 5) {
            //console.log(d)
            const v = new CANNON.Vec3(
                this.mesh.position.x * 2,
                this.mesh.position.y * 2,
                this.mesh.position.z * 2
            )
            ball.body.applyForce(v)
        }
        this.mesh.rotation.z += 0.1
    }
}
