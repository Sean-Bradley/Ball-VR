import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import CannonUtils from './utils/cannonUtils'

export default class Earth {
    scene: THREE.Scene
    world: CANNON.World
    topoShaderMaterial: THREE.MeshPhongMaterial
    material: THREE.MeshPhongMaterial
    geometries: THREE.BufferGeometry[] = []
    planes: THREE.Mesh[] = []

    constructor(scene: THREE.Scene, world: CANNON.World, completeCB: () => void) {
        this.scene = scene
        this.world = world

        this.material = new THREE.MeshPhongMaterial({
            //color: 0x00ff00,
            //wireframe: true,
            //vertexColors: true,
            //map: texture,
            flatShading: true,
        })
        this.topoShaderMaterial = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('img/worldColour.5400x2700.jpg'),
            normalMap: new THREE.TextureLoader().load('img/earth_normalmap_5400x2700.jpg'),
        })
        this.topoShaderMaterial.onBeforeCompile = (shader) => {
            shader.vertexShader = `       
varying vec3 vPos; // sean

#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>    
    vPos = position; // sean
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
} `
            shader.fragmentShader = `
// sean
varying vec3 vPos;
float PI = 3.14159;
vec2 pointOnSphere(vec3 p) {
    p = normalize(vPos);
    float lon = atan(p.x, -p.z);
    float lat = asin(p.y);
    float u = (-lon / PI + 1.0) / 2.0;
    float v = lat / PI + 0.5;
    return vec2(u,v);
}   
// end sean

#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
    vec2 vUv = pointOnSphere(vPos); // sean
    #include <clipping_planes_fragment>    
    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <normal_fragment_begin>
    #include <normal_fragment_maps>
    #include <emissivemap_fragment>
    #include <lights_phong_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>
    #include <aomap_fragment>
    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
    #include <envmap_fragment>
    #include <output_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>    
}
`
        }

        //const geometry = new THREE.BoxGeometry(1, 1, 1, 512, 512, 512)
        //const geometry = new THREE.IcosahedronGeometry(1, 256)

        const rowOffsets0 = [
            -0.4375, -0.3125, -0.1875, -0.0625, 0.0625, 0.1875, 0.3125, 0.4375, -0.4375, -0.3125,
            -0.1875, -0.0625, 0.0625, 0.1875, 0.3125, 0.4375, -0.4375, -0.3125, -0.1875, -0.0625,
            0.0625, 0.1875, 0.3125, 0.4375, -0.4375, -0.3125, -0.1875, -0.0625, 0.0625, 0.1875,
            0.3125, 0.4375, -0.4375, -0.3125, -0.1875, -0.0625, 0.0625, 0.1875, 0.3125, 0.4375,
            -0.4375, -0.3125, -0.1875, -0.0625, 0.0625, 0.1875, 0.3125, 0.4375, -0.4375, -0.3125,
            -0.1875, -0.0625, 0.0625, 0.1875, 0.3125, 0.4375, -0.4375, -0.3125, -0.1875, -0.0625,
            0.0625, 0.1875, 0.3125, 0.4375,
        ]
        const rowOffsets1 = [
            -0.4375, -0.4375, -0.4375, -0.4375, -0.4375, -0.4375, -0.4375, -0.4375, -0.3125,
            -0.3125, -0.3125, -0.3125, -0.3125, -0.3125, -0.3125, -0.3125, -0.1875, -0.1875,
            -0.1875, -0.1875, -0.1875, -0.1875, -0.1875, -0.1875, -0.0625, -0.0625, -0.0625,
            -0.0625, -0.0625, -0.0625, -0.0625, -0.0625, 0.0625, 0.0625, 0.0625, 0.0625, 0.0625,
            0.0625, 0.0625, 0.0625, 0.1875, 0.1875, 0.1875, 0.1875, 0.1875, 0.1875, 0.1875, 0.1875,
            0.3125, 0.3125, 0.3125, 0.3125, 0.3125, 0.3125, 0.3125, 0.3125, 0.4375, 0.4375, 0.4375,
            0.4375, 0.4375, 0.4375, 0.4375, 0.4375,
        ]

        for (let i = 0; i < 64; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].translate(rowOffsets0[i], rowOffsets1[i], 0.5)
        }
        for (let i = 64; i < 128; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].rotateY(Math.PI / 2)
            this.geometries[i].translate(0.5, rowOffsets0[i - 64], rowOffsets1[i - 64])
        }
        for (let i = 128; i < 192; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].rotateY(Math.PI)
            this.geometries[i].translate(rowOffsets0[i - 128], rowOffsets1[i - 128], -0.5)
        }
        for (let i = 192; i < 256; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].rotateY(-Math.PI / 2)
            this.geometries[i].translate(-0.5, rowOffsets0[i - 192], rowOffsets1[i - 192])
        }
        for (let i = 256; i < 320; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].rotateX(-Math.PI / 2)
            this.geometries[i].translate(rowOffsets0[i - 256], 0.5, rowOffsets1[i - 256])
        }
        for (let i = 320; i < 384; i++) {
            this.geometries.push(new THREE.PlaneGeometry(0.125, 0.125, 8, 8))
            this.geometries[i].rotateX(Math.PI / 2)
            this.geometries[i].translate(rowOffsets0[i - 320], -0.5, rowOffsets1[i - 320])
        }

        this.geometries.forEach((geometry, i) => {
            const plane = new THREE.Mesh(geometry, this.topoShaderMaterial)
            plane.scale.set(100, 100, 100)
            this.scene.add(plane)
            this.planes.push(plane)
        })

        const hgtImage = new Image()
        hgtImage.onload = () => {
            const canvas = document.createElement('canvas') as HTMLCanvasElement
            canvas.width = 2700
            canvas.height = 1350
            const context = canvas.getContext('2d') as CanvasRenderingContext2D
            context.drawImage(hgtImage, 0, 0)
            const data = context.getImageData(0, 0, 2700, 1350)
            this.geometries.forEach((geometry, i) => {
                const positions = geometry.attributes.position.array as Array<number>
                for (let i = 0; i < positions.length; i += 3) {
                    const v = this.cubePointToSpherePoint(
                        new THREE.Vector3(
                            positions[i],
                            positions[i + 1],
                            positions[i + 2]
                        ).multiplyScalar(2)
                    )
                    positions[i] = v.x
                    positions[i + 1] = v.y
                    positions[i + 2] = v.z
                }
                for (let i = 0; i < positions.length; i += 3) {
                    const v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
                    const h = this.spherePointToLatLon(v)

                    const x = Math.floor(-h.lon / 0.00232710567 + 1350)
                    const y = Math.floor(-h.lat / 0.00232710567 + 675)
                    //convert -pi <--> pi   --> 0 to 2700
                    // -pi = 0
                    // pi / 2700 = 0.00232710566 (.00232710567 closes the holes at the poles)
                    // 0 = 1350
                    // pi/2 = 2025

                    const pixel = data.data[x * 4 + y * 2700 * 4]
                    v.addScaledVector(v.clone(), pixel / 1000)

                    positions[i] = v.x
                    positions[i + 1] = v.y
                    positions[i + 2] = v.z
                }

                ;(geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true
                ;(geometry as THREE.BufferGeometry).computeVertexNormals()
                ;(geometry as THREE.BufferGeometry).computeBoundingSphere() //for renderer culling

                const shape = CannonUtils.CreateTrimesh(geometry)
                shape.scale.set(100, 100, 100)
                const earthBody = new CANNON.Body({
                    mass: 0,
                })
                earthBody.addShape(shape)

                this.world.addBody(earthBody)
            })

            completeCB()
        }
        hgtImage.src = 'img/gebco_bathy.2700x1350_8bit.jpg'
    }

    cubePointToSpherePoint(p: THREE.Vector3) {
        const x2 = p.x * p.x
        const y2 = p.y * p.y
        const z2 = p.z * p.z
        const x = p.x * Math.sqrt(1 - (y2 + z2) / 2 + (y2 * z2) / 3)
        const y = p.y * Math.sqrt(1 - (z2 + x2) / 2 + (z2 * x2) / 3)
        const z = p.z * Math.sqrt(1 - (x2 + y2) / 2 + (x2 * y2) / 3)
        return new THREE.Vector3(x, y, z)
    }

    spherePointToLatLon(p: THREE.Vector3) {
        const lat = Math.asin(p.y)
        const lon = Math.atan2(p.x, -p.z)
        return { lat: lat, lon: lon }
    }

    latLonToSpherePoint(lat: number, lon: number) {
        const y = Math.sin(lat)
        const r = Math.cos(lat)
        const x = Math.sin(lon) * r
        const z = -Math.cos(lon) * r
        return new THREE.Vector3(x, y, z)
    }

    getSpawnPosition(lift: number, p?: THREE.Vector3) {
        const raycaster = new THREE.Raycaster()

        const outside = new THREE.Vector3()
        if (p) {
            outside.copy(p)
        } else {
            outside.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        }
        outside.normalize()

        const inside = new THREE.Vector3().subVectors(new THREE.Vector3(), outside).normalize()
        outside.multiplyScalar(200)
        raycaster.set(outside, inside)

        const intersects = raycaster.intersectObjects(this.planes, false)
        let pos = new THREE.Vector3()
        if (intersects.length > 0) {
            pos = intersects[0].point.addScaledVector(outside.normalize(), lift)
        }
        return pos
    }

    // update(delta: number) {

    // }
}
