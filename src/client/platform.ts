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
    body: CANNON.Body
    world: CANNON.World

    path: THREE.Vector3[] = []
    pathIndex = 0
    pathFrom = new THREE.Vector3()
    pathTo = new THREE.Vector3()
    tween?: Tween
    //direction = new THREE.Vector3()
    //vector = new THREE.Vector3()
    //distance = 0
    //lerpStepper = 0

    constructor(scene: THREE.Scene, earth: Earth, world: CANNON.World) {
        this.scene = scene
        this.earth = earth
        this.world = world

        const x = Math.floor(Math.random() * 20 + 1)
        const y = Math.floor(Math.random() * 20 + 1)
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, 0.5), Platform.material)
        //scene.add(this.mesh)

        this.body = new CANNON.Body({ mass: 0 })
        this.body.addShape(new CANNON.Box(new CANNON.Vec3(x / 2, y / 2, 0.25)))
        //this.body.sleep()
        //this.world.addBody(this.body)

        //this.randomise()
    }

    randomise() {
        const p = this.earth.getSpawnPosition(2)
        this.mesh.position.copy(p)
        this.mesh.lookAt(0, 0, 0)
        this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
        this.body.quaternion.set(
            this.mesh.quaternion.x,
            this.mesh.quaternion.y,
            this.mesh.quaternion.z,
            this.mesh.quaternion.w
        )
    }

    activate() {
        let type = Math.floor(Math.random() * 4)
        //type = 3
        switch (type) {
            case 0: //static
                this.update = (delta: number, ball: Ball) => {}
                break
            case 1: //spinning clockwise
                this.update = (delta: number, ball: Ball) => {
                    this.mesh.rotation.z += 0.01
                    //this.body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
                    this.body.quaternion.set(
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
                    this.body.quaternion.set(
                        this.mesh.quaternion.x,
                        this.mesh.quaternion.y,
                        this.mesh.quaternion.z,
                        this.mesh.quaternion.w
                    )
                }
                break
            case 3: //up and down
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
                //this.direction.subVectors(this.path[1], this.path[0]).normalize()
                this.pathFrom.copy(this.path[0])
                this.pathTo.copy(this.path[1])
                // this.distance = this.path[0].distanceTo(this.path[1])
                // //this.vector.subVectors(this.pathTo, this.pathFrom)
                // // console.log(this.path)
                // // console.log(this.vector)

                this.startNextTween()

                // this.update = (delta: number, ball: Ball) => {
                //     this.distance = this.mesh.position.distanceTo(this.pathTo)
                //     //this.vector.subVectors(this.pathTo, this.pathFrom)
                //     if (this.distance < 0.1) {
                //         this.pathIndex += 1
                //         //console.log(this.pathIndex)
                //         //console.log(this.path)
                //         if (this.pathIndex === this.path.length - 1) {
                //             this.pathIndex = 0
                //         }
                //         this.pathFrom.copy(this.path[this.pathIndex])
                //         this.pathTo.copy(this.path[this.pathIndex + 1])
                //     } else {
                //         this.mesh.position.lerp(this.pathTo, delta)
                //         // this.lerpStepper += 1 * delta
                //         // if (this.lerpStepper > 1) {
                //         //     this.lerpStepper = 0
                //         // }
                //         // this.mesh.position.lerpVectors(this.pathFrom, this.pathTo, this.lerpStepper)
                //         // this.mesh.position.x += (this.vector.x * delta) / 2
                //         // this.mesh.position.y += (this.vector.y * delta) / 2
                //         // this.mesh.position.z += (this.vector.z * delta) / 2
                //         this.body.position.set(
                //             this.mesh.position.x,
                //             this.mesh.position.y,
                //             this.mesh.position.z
                //         )
                //         // console.log(
                //         //     this.pathIndex +
                //         //         ' ' +
                //         //         this.distance +
                //         //         ' ' +
                //         //         this.pathFrom.x +
                //         //         ' ' +
                //         //         this.pathTo.x
                //         // )
                //     }
                //     //         //console.log(this.mesh.position.y)
                //     //         this.yOffset = Math.sin(delta * 0.5) * 40
                //     //         this.mesh.position.y =
                //     //         this.body.position.set(
                //     //             this.mesh.position.x,
                //     //             this.mesh.position.y,
                //     //             this.mesh.position.z
                //     //         )
                //     //         // this.body.quaternion.set(
                //     //         //     this.mesh.quaternion.x,
                //     //         //     this.mesh.quaternion.y,
                //     //         //     this.mesh.quaternion.z,
                //     //         //     this.mesh.quaternion.w
                //     //         // )
                // }
                break
        }
        //this.body.wakeUp()

        this.scene.add(this.mesh)
        this.world.addBody(this.body)
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
                this.body.position.set(
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

    deactivate() {
        this.update = (delta: number, ball: Ball) => {}
        this.scene.remove(this.mesh)
        this.world.removeBody(this.body)        
        delete this.tween
        this.path = []
        this.pathIndex = 0
        this.pathFrom = new THREE.Vector3()
        this.pathTo = new THREE.Vector3()
    }

    update(delta: number, ball: Ball) {
        //do not edit this. The function body is created when object is activated
    }
}
