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
    group = new THREE.Group()
    cylinder: THREE.Mesh

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

        const texture = new THREE.TextureLoader().load('img/finish.png')
        this.cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(3.4, 3.4, 2, 12, 1, true),
            new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide,
            })
        )
        texture.repeat.x = 2
        texture.wrapS = THREE.RepeatWrapping
        this.cylinder.position.y = 6
        this.group.add(this.cylinder)

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
                        this.mesh.userData.type = "finishpodium"
                    }
                })
                this.body = new CANNON.Body({ mass: 0 })
                this.body.addShape(new CANNON.Cylinder(3.4, 3.4, 0.68, 12))
                this.group.add(this.mesh)
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
            },
            (error) => {
                console.log(error)
            }
        )

        setInterval(() => {
            //console.log("finishpodium setInterval")
            this.texture.rotation += Math.PI
            this.texture.needsUpdate = true
        }, 500)
    }

    deactivate() {
        clearInterval(this.winnerAnimationInterval as NodeJS.Timer)
        this.update = (ball: Ball) => {}
        this.scene.remove(this.group)
        this.world.removeBody(this.body)
    }

    activate(position: THREE.Vector3) {
        this.group.position.copy(position)
        this.group.lookAt(0, 0, 0)
        this.group.rotateX(-Math.PI / 2)
        this.scene.add(this.group)

        this.body.position.set(this.group.position.x, this.group.position.y, this.group.position.z)
        this.body.quaternion.set(
            this.group.quaternion.x,
            this.group.quaternion.y,
            this.group.quaternion.z,
            this.group.quaternion.w
        )
        this.world.addBody(this.body)

        this.update = (ball: Ball) => {
            this.cylinder.rotation.y -= 0.01
            const d = this.group.position.distanceTo(ball.object3D.position)
            if (d < 3.5) {
                //this.game.gamePhase = 1
                this.explosionCounter = 0
                ball.deactivate()
                if (
                    this.game.clock >= 0 &&
                    this.game.numJewelsFound >= this.game.numJewelsRequired
                ) {
                    this.explosions[this.explosionCounter].explode(this.group.position)
                    this.explosionCounter += 1
                    this.winnerAnimationInterval = setInterval(() => {
                        //console.log("winnerAnimationInterval setInterval")
                        this.explosions[this.explosionCounter].explode(this.group.position)
                        this.explosionCounter += 1
                        if (this.explosionCounter > 3) {
                            this.explosionCounter = 0
                        }
                    }, 250)
                }
                this.update = (ball: Ball) => {}
                this.game.endRound()
            }
        }
    }

    update(ball: Ball) {
        //do not edit this. The function body is created when object is activated
    }
}
