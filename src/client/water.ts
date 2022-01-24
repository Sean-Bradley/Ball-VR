import * as THREE from 'three'
export default class Water {
    material: THREE.MeshPhongMaterial
    mesh: THREE.Mesh
    constructor(scene: THREE.Scene) {
        this.material = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.5,
        })
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(112.75, 256, 256), this.material)
        scene.add(this.mesh)
    }
}
