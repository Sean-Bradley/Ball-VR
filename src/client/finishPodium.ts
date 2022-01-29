import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as CANNON from 'cannon-es'
import Ball from './ball'
import Explosion from './explosion'
import CannonUtils from './utils/cannonUtils'
import Game from './game'
import UI from './ui'

export default class FinishPodium {
    scene: THREE.Scene
    world: CANNON.World
    game: Game
    mesh = new THREE.Mesh()
    body = new CANNON.Body()
    texture = new THREE.Texture()
    explosions: { [id: string]: Explosion } = {}
    explosionCounter = 0
    winnerAnimationInterval?: NodeJS.Timer

    constructor(
        scene: THREE.Scene,
        world: CANNON.World,
        explosions: { [id: string]: Explosion },
        game: Game
    ) {
        this.scene = scene
        this.world = world
        this.explosions = explosions
        this.game = game

        const gltfLoader = new GLTFLoader()
        gltfLoader.load(
            'models/finish.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        this.mesh = child as THREE.Mesh
                        this.texture = (
                            (child as THREE.Mesh).material as THREE.MeshStandardMaterial
                        ).map as THREE.Texture
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
            this.texture.rotation += Math.PI
            this.texture.needsUpdate = true
        }, 500)
    }

    deactivate() {
        clearInterval(this.winnerAnimationInterval as NodeJS.Timer)
        this.update = (ball: Ball) => {}
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

        this.update = (ball: Ball) => {
            const d = this.mesh.position.distanceTo(ball.object3D.position)
            if (d < 3.5) {
                //this.game.gamePhase = 1
                this.explosionCounter = 0
                ball.deactivate()
                this.explosions[this.explosionCounter].explode(this.mesh.position)
                this.explosionCounter += 1
                this.winnerAnimationInterval = setInterval(() => {
                    this.explosions[this.explosionCounter].explode(this.mesh.position)
                    this.explosionCounter += 1
                    if (this.explosionCounter > 2) {
                        this.explosionCounter = 0
                    }
                }, 250)
                this.update = (ball: Ball) => {}
                this.game.endRound()                
            }
        }
    }

    update(ball: Ball) {
        //do not edit this. The function body is created when object is activated
    }
}
