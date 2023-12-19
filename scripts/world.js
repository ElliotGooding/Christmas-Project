import * as THREE from 'three';
import { Box       } from './box.js'
import { AnimatedModel, Model     } from './model.js'
import { Ufo       } from './ufo.js'
import { Character } from './character.js'
import { OBJModel  } from './objLoader.js';
import { Ambience  } from './sounds.js';

const textureLoader = new THREE.TextureLoader(); 
const cubeTexLoader = new THREE.CubeTextureLoader();

export class World{
    constructor(camera){
        this.structureObjects = [];
        this.scene = new THREE.Scene();
        this.character = new Character([0,130,20], this.scene, camera);
        this.ambience = new Ambience(['ambience/ES_The Clearing.mp3'])
        this.camera = camera;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.gammaOutput = true; 
        this.renderer.gammaFactor = 1.0   
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        document.querySelector(".game-container").appendChild( this.renderer.domElement );
        this.renderer.setClearColor (0x0a4861, 1);
        this.renderer.logarithmicDepthBuffer = true

        this.ufos = [];
        this.buildScene();
        
        this.draw = this.draw.bind(this);
        this.draw();
    }

    createBox([x,y,z], [w,h,d], texture, textured = false, repeat = [1,1]){
        const geometry = new THREE.BoxGeometry( w, h, d );
        var material;
        if (textured){
            const loadedTex = textureLoader.load(texture);
            material = new THREE.MeshStandardMaterial( { map: loadedTex } );
            loadedTex.wrapS = THREE.MirroredRepeatWrapping;
            loadedTex.wrapT = THREE.MirroredRepeatWrapping;
            loadedTex.repeat.set(repeat[0],repeat[1]);
        } else{
            material = new THREE.MeshBasicMaterial( { color: texture } );
        }
        const cube = new THREE.Mesh( geometry, material );
        cube.position.set(x,y,z);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.material.side = THREE.DoubleSide;
        this.scene.add( cube );
        const box = new Box(x,y,z,w,h,d);
        this.structureObjects.push(box);
        return cube;
    }

    createSphere([x,y,z], r, colour){
        const geometry = new THREE.SphereGeometry( r, 32, 32 );
        const material = new THREE.MeshBasicMaterial( {color: colour} );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x,y,z);
        this.scene.add( sphere );
    }

    async buildScene(){
        this.background = cubeTexLoader.load([
            'skybox/right.png', 'skybox/left.png',
            'skybox/bottom.png', 'skybox/top.png',
            'skybox/back.png', 'skybox/front.png'
        ])
        this.scene.background = this.background;
        this.createBox([45,25,-2155], [21000, 15, 17000], 'textures/ground.jpg', true, [100,100]);
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.createBox.bind(this)));
        const light = new THREE.DirectionalLight( 0xffffff, 0.3 );
        light.position.set( 0, 10000, 0 );
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 1000000;
        light.shadow.camera.left = -10000;
        light.shadow.camera.right = 10000;
        light.shadow.camera.top = 10000;
        light.shadow.camera.bottom = -10000;
        light.castShadow = true;
        this.scene.add( light );
        this.scene.add( new THREE.AmbientLight( 0xd0d0d0 ) );
        this.city = new OBJModel('map.obj', 'map.mtl', this.scene);
        while (this.city.model == null || this.city.model == undefined){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.ambience.fadeIn();
    }

    updateWorld(){
        this.ufos.forEach(ufo => {
            ufo.update();
        })
    }

    draw(){
        this.camera.updateCam(this.character);
        this.character.move(this.camera, this.structureObjects, this.ufos);
        this.updateWorld(this.character)
        this.renderer.render( this.scene, this.camera.camObj );
        requestAnimationFrame(this.draw);
    }
}