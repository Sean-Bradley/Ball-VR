export default interface LevelConfig {
    numJewelsRequired: number // min jewels to pass level
    clock: number // max time in seconds to pass level
    startPosition: THREE.Vector3
    finishPosition: THREE.Vector3
    platforms?: {
        type: number
        size: [number, number]
        position: THREE.Vector3
        path?: THREE.Vector3[]
    }[]
    springs?: THREE.Vector3[]
    mines?: THREE.Vector3[]
    jewels?: THREE.Vector3[]
}

//export default interface LevelConfigs extends Array<LevelConfig>

// constructor(
//     startPosition: THREE.Vector3,
//     finishPosition: THREE.Vector3,
//     platforms: { [id: string]: Platform },
//     springs: { [id: string]: Spring },
//     mines: { [id: string]: Mine },
//     jewels: { [id: string]: Jewel },
//     numJewelsRequired = 0,
//     clock = 60
// ) {
//     this.startPosition = startPosition
//     this.finishPosition = finishPosition
//     this.platforms = platforms
//     this.springs = springs
//     this.mines = mines
//     this.jewels = jewels
//     this.numJewelsRequired = numJewelsRequired
//     this.clock = clock
// }
//}

// const level = new Level(
//     this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60)),
//     this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90)),
//     {},
//     {},
//     {},
//     {},
//     0,
//     60
// )

// this.levels[2] = new Level(
//     this.earth.getSpawnPosition(1.5, new THREE.Vector3(0, 113, -60)),
//     this.earth.getSpawnPosition(0.5, new THREE.Vector3(-5, 113, -90)),
//     {},
//     {},
//     {},
//     { 0: new Jewel(this, this.scene, this.earth, this.explosions) },
//     1,
//     60
// )
// this.jewels[0].mesh.position.copy(
//     this.earth.getSpawnPosition(1, new THREE.Vector3(-2.5, 113, -75))
// )
// this.jewels[0].mesh.lookAt(0, 0, 0)
// this.jewels[0].activate()
