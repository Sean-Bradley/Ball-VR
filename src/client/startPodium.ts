import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as CANNON from 'cannon-es'
import Ball from './ball'

export default class StartPodium {
    scene: THREE.Scene
    mesh = new THREE.Mesh()
    texture = new THREE.Texture()

    constructor(scene: THREE.Scene, position: THREE.Vector3, world: CANNON.World, ball: Ball) {
        this.scene = scene

        const gltfLoader = new GLTFLoader()
        gltfLoader.load(
            'models/start.glb',
            (gltf) => {
                gltf.scene.traverse((child) => {
                    //console.log(child)
                    if ((child as THREE.Mesh).isMesh) {
                        this.mesh = child as THREE.Mesh
                        this.texture = (
                            (child as THREE.Mesh).material as THREE.MeshStandardMaterial
                        ).map as THREE.Texture
                    }
                })
                //this.mesh = gltf.scene.children[0] as THREE.Mesh
                // this.texture = (
                //     (gltf.scene.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
                // ).map as THREE.Texture
                // gltf.scene.position.copy(position)
                // gltf.scene.lookAt(0, 0, 0)
                // gltf.scene.rotateX(-Math.PI / 2)
                //scene.add(gltf.scene)

                this.mesh.position.copy(position)
                this.mesh.lookAt(0, 0, 0)
                this.mesh.rotateX(-Math.PI / 2)
                this.mesh.geometry.normalizeNormals() //toNonIndexed()
                //this.mesh.geometry.computeBoundingSphere
                //this.mesh.geometry.computeVertexNormals()
                //this.mesh.geometry.computeBoundingBox()
                //this.mesh.geometry.computeTangents()
                scene.add(this.mesh)
                ball.bouncables.push(this.mesh)

                const body = new CANNON.Body({ mass: 0 })
                body.addShape(new CANNON.Cylinder(3.4, 3.4, 0.68, 12))
                body.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
                body.quaternion.set(
                    this.mesh.quaternion.x,
                    this.mesh.quaternion.y,
                    this.mesh.quaternion.z,
                    this.mesh.quaternion.w
                )
                world.addBody(body)
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
}
