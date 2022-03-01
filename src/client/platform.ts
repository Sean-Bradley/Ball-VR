import * as THREE from 'three'
import Ball from './ball'
import * as CANNON from 'cannon-es'
import Earth from './earth'
import { Tween, TWEEN } from 'three/examples/jsm/libs/tween.module.min'

export default class Platform {
    scene: THREE.Scene
    private earth: Earth
    static material = new THREE.MeshMatcapMaterial({
        map: new THREE.TextureLoader().load('img/marble.png'),
        matcap: new THREE.TextureLoader().load('img/matcap-green-yellow-pink.png'),
    })
    mesh: THREE.Mesh
    body?: CANNON.Body
    world: CANNON.World

    path: THREE.Vector3[] = []
    pathIndex = 0
    pathFrom = new THREE.Vector3()
    pathTo = new THREE.Vector3()
    tween?: Tween

    type: number = 0
    width = 1
    length = 1

    enabled = false

    constructor(scene: THREE.Scene, earth: Earth, world: CANNON.World) {
        this.scene = scene
        this.earth = earth
        this.world = world

        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(), Platform.material)
        this.mesh.userData.type = 'platform'

        //this.body = new CANNON.Body({ mass: 0 })
        //this.body.addShape(new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, 0.25)))
    }

    randomise() {
        const p = this.earth.getSpawnPosition(2)
        this.mesh.position.copy(p)
        this.width = Math.floor(Math.random() * 20 + 1)
        this.length = Math.floor(Math.random() * 20 + 1)
        this.mesh.geometry.dispose()
        this.mesh.geometry = new THREE.BoxGeometry(this.width, this.length, 0.5)
        this.mesh.lookAt(0, 0, 0)
        this.body = new CANNON.Body({ mass: 0 })
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(this.width / 2, this.length / 2, 0.25)))
        this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
        this.body.quaternion.set(
            this.mesh.quaternion.x,
            this.mesh.quaternion.y,
            this.mesh.quaternion.z,
            this.mesh.quaternion.w
        )
    }

    deactivate() {
        this.update = (delta: number, ball: Ball) => {}
        this.scene.remove(this.mesh)
        if (this.body !== undefined) this.world.removeBody(this.body as CANNON.Body)
        delete this.tween
        this.path = []
        this.pathIndex = 0
        this.pathFrom = new THREE.Vector3()
        this.pathTo = new THREE.Vector3()

        this.enabled = false
    }

    activate(type: number) {
        this.type = type
        //let type = Math.floor(Math.random() * 4)
        //type = 3
        switch (type) {
            case 0: //static
                this.update = (delta: number, ball: Ball) => {}
                break
            case 1: //spinning clockwise
                this.update = (delta: number, ball: Ball) => {
                    this.mesh.rotation.z += 0.01
                    //this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
                    ;(this.body as CANNON.Body).quaternion.set(
                        this.mesh.quaternion.x,
                        this.mesh.quaternion.y,
                        this.mesh.quaternion.z,
                        this.mesh.quaternion.w
                    )
                }
                break
            case 2: //spinning anti-clockwise
                this.update = (delta: number, ball: Ball) => {
                    this.mesh.rotation.z -= 0.01
                    //this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
                    ;(this.body as CANNON.Body).quaternion.set(
                        this.mesh.quaternion.x,
                        this.mesh.quaternion.y,
                        this.mesh.quaternion.z,
                        this.mesh.quaternion.w
                    )
                }
                break
            case 3: //up and down and all around
                this.path.push(this.mesh.position.clone())
                let next = this.mesh.position.clone()
                next.x += Math.random() * 10
                next.y += Math.random() * 10
                next.z += Math.random() * 10
                this.path.push(next)
                next = this.mesh.position.clone()
                next.x += Math.random() * 10
                next.y += Math.random() * 10
                next.z += Math.random() * 10
                this.path.push(next)
                this.path.push(this.mesh.position.clone())
                this.pathFrom.copy(this.path[0])
                this.pathTo.copy(this.path[1])
                this.startNextTween()
                break
        }

        this.scene.add(this.mesh)
        this.world.addBody(this.body as CANNON.Body)

        this.enabled = true
    }

    startNextTween() {
        this.tween = new TWEEN.Tween(this.mesh.position)
            .to(
                {
                    x: this.path[this.pathIndex].x,
                    y: this.path[this.pathIndex].y,
                    z: this.path[this.pathIndex].z,
                },
                5000
            )
            .onUpdate(() => {
                ;(this.body as CANNON.Body).position.set(
                    this.mesh.position.x,
                    this.mesh.position.y,
                    this.mesh.position.z
                )
            })
            .onComplete(() => {
                this.pathIndex += 1
                //console.log(this.pathIndex)
                //console.log(this.path)
                if (this.pathIndex === this.path.length - 1) {
                    this.pathIndex = 0
                }
                this.pathFrom.copy(this.path[this.pathIndex])
                this.pathTo.copy(this.path[this.pathIndex + 1])

                this.startNextTween()
            })
            .start()
    }

    update(delta: number, ball: Ball) {
        //do not edit this. The function body is created when object is activated
    }
}
