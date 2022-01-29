// import * as THREE from 'three'
// import Earth from './earth'
// import Explosion from './explosion'
// import Jewel from './jewel'
// import Level from './level'

// export default class Level2 implements Level {
//     static startPosition = new THREE.Vector3(0, 100.08096575794471, -53.14033580067859) //this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60))
//     static finishPosition = new THREE.Vector3(-3.915382320353649, 88.48764043999248, -70.4768817663657) //this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90))
//     static jewels: { [id: string]: Jewel } = {}
//     static numJewelsRequired = 1
//     static roundTimeoutSeconds = 60

//     constructor(scene: THREE.Scene, earth: Earth, explosions: { [id: string]: Explosion }) {
//         Level2.jewels[0] = new Jewel(scene, earth, explosions)
//         Level2.jewels[0].mesh.position.set(-2.093739489482488, 94.6370249246085, -62.81218468447466) //this.earth.getSpawnPosition(1, new THREE.Vector3(-2.5, 113, -75))
//         Level2.jewels[0].mesh.lookAt(0, 0, 0)
//         Level2.jewels[0].activate()
//     }
// }
