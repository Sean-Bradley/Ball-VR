import * as CANNON from 'cannon-es'

export default class Physics {
    world: CANNON.World

    constructor() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, -1, 0)

        this.world.addEventListener('postStep', () => {
            //Gravity towards (0,0,0)
            this.world.bodies.forEach((b) => {
                const v = new CANNON.Vec3()
                v.set(-b.position.x, -b.position.y, -b.position.z).normalize()
                v.scale(9.8, b.force)
                b.applyLocalForce(v)
                b.force.y += b.mass //cancel out world gravity                
            })
        })
    }

    update = (delta: number) => {
        this.world.step(delta)
    }
}
