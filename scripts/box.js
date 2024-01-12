import * as THREE from 'three';

const textureLoader = new THREE.TextureLoader(); 

//Creates a box and adds it to the scene and structureObjects
export class CreateBox{
    constructor(scene, structureObjects, [x,y,z], [w,h,d], visible, texture, textured = false, repeat = [1,1], solid = true, id = 0){
        this.scene = scene
        this.structureObjects = structureObjects
        var cube;
        if (visible){ //Create scene object
            const geometry = new THREE.BoxGeometry( w, h, d );
            var material;
            if (textured){ //Load and apply the texture
                const loadedTex = textureLoader.load(texture);
                material = new THREE.MeshStandardMaterial( { map: loadedTex } );
                loadedTex.wrapS = THREE.MirroredRepeatWrapping;
                loadedTex.wrapT = THREE.MirroredRepeatWrapping;
                loadedTex.repeat.set(repeat[0],repeat[1]);
            } else{
                //Solid colour texturing (for debugging)
                material = new THREE.MeshBasicMaterial( { color: texture } );
            }
            cube = new THREE.Mesh( geometry, material );
            cube.position.set(x,y,z);
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.material.side = THREE.DoubleSide;
            cube.name = id;
            this.scene.add( cube );
        }
        if (solid){ //Create structure object
            const box = new Box(x,y,z,w,h,d, id);
            this.structureObjects.push(box)
        }
        return cube;
    }
}

//Custom box class for collision detection
export class Box {
    constructor(x, y, z, width, height, depth, id=0) {
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.width = width;
        this.height= height;
        this.depth = depth;

        this.left = this.x - this.width/2;
        this.right = this.x + this.width/2;
        this.top = this.y + this.height/2;
        this.bottom = this.y - this.height/2;
        this.front = this.z + this.depth/2;
        this.back = this.z - this.depth/2;

        this.solid = true
        this.id = id;
    }
}