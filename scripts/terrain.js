import 'https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.js';
import * as THREE from 'three';

function sin(deg){
    return Math.sin(deg*Math.PI/180)
}

function cos(deg){
    return Math.cos(deg*Math.PI/180)
}

export class Terrain {
    constructor(scene, [width, depth, height], [x,y,z]) {
        this.noise = new SimplexNoise(1);
        this.height = 10;
        this.width = 2000;
        this.depth = 2000;
        this.dimWidth = width;
        this.dimDepth = depth;
        this.dimHeight = height;
        this.x = x;
        this.y = y;
        this.z = z;
        this.generateHeightMap();
        this.createTerrain(scene);
        this.applyHeightMap();
    }

    generateHeightMap() {
        this.heightMap = [];
        const maxDist = this.width / 2;
        for (let x = 0; x < this.width; x++) {
            this.heightMap.push([]);
            for (let z = 0; z < this.depth; z++) {
                const rawNoiseValue = (this.noise.noise2D(x / 100, z / 100) + 1 ) / 2;
                let distFromCenter = Math.sqrt((x - this.width / 2) ** 2 + (z - this.depth / 2) ** 2);
                distFromCenter = (distFromCenter > maxDist) ? maxDist : distFromCenter;
                const noiseValue = rawNoiseValue * (distFromCenter / maxDist)
                let height = noiseValue + 10*(distFromCenter / maxDist)**6
                this.heightMap[x].push(height);
            }
        }
    }

    createTerrain(scene) {
        const geometry = new THREE.PlaneGeometry(this.dimWidth, this.dimDepth, this.width - 1, this.depth - 1);
        const texture = this.loadTexture('textures/moon.png')
        const material = new THREE.MeshStandardMaterial({ map: texture });
        material.side = THREE.DoubleSide;
        // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotateX(Math.PI / 2);
        plane.position.set(this.x, this.y, this.z);
        scene.add(plane);
        this.plane = plane;
    }

    loadTexture(texturePath) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(texturePath);
        // texture.wrapS = THREE.MirroredRepeatWrapping;
        // texture.wrapT = THREE.MirroredRepeatWrapping;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(this.width / 100, this.depth / 100);
        return texture;
    }

    applyHeightMap() {
        const positions = this.plane.geometry.attributes.position.array;
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.depth; z++) {
                const height = this.heightMap[x][z]*this.height;
                const index = (x + z * this.width) * 3 + 2; // Index for the Y component
                positions[index] = -(height*this.dimHeight);
            }
        }
        // Ensure the geometry updates after modifying the vertices
        this.plane.geometry.attributes.position.needsUpdate = true;
    }
}
