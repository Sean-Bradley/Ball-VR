import * as THREE from 'three'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare'

export default class Cosmos {
    lightPivot: THREE.Object3D

    constructor(scene: THREE.Scene) {
        const light = new THREE.DirectionalLight(0xffffff, 2)
        light.position.set(0, 0, 500)
        // light.castShadow = true
        // light.shadow.bias = -0.002
        // light.shadow.mapSize.width = 512
        // light.shadow.mapSize.height = 512
        // light.shadow.camera.left = -150
        // light.shadow.camera.right = 150
        // light.shadow.camera.top = -150
        // light.shadow.camera.bottom = 150
        // light.shadow.camera.near = 350
        // light.shadow.camera.far = 750

        this.lightPivot = new THREE.Object3D()
        this.lightPivot.add(light)
        scene.add(this.lightPivot)

        const flareTexture = new THREE.TextureLoader().load('img/lensflare0.png')
        const lensflare = new Lensflare()
        lensflare.addElement(new LensflareElement(flareTexture, 1000, 0, light.color))
        light.add(lensflare)

        const texture = new THREE.CubeTextureLoader().load([
            'img/px_eso0932a.jpg',
            'img/nx_eso0932a.jpg',
            'img/py_eso0932a.jpg',
            'img/ny_eso0932a.jpg',
            'img/pz_eso0932a.jpg',
            'img/nz_eso0932a.jpg',
        ])
        scene.background = texture
        scene.environment = texture
    }

    update(delta: number) {
        this.lightPivot.rotation.y += delta / 4
    }
}
