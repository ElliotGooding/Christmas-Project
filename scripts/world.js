import * as THREE from 'three';
import { Box, CreateBox } from './box.js'
import { AnimatedModel, Model } from './model.js'
import { Ufo } from './ufo.js'
import { Character } from './character.js'
import { OBJModel } from './objLoader.js';
import { Ambience } from './sounds.js';
import { City } from './city.js';
import { HitBoxHelper } from './hitBoxHelper.js';
import { Terrain } from './terrain.js';
import { GlowRenderer } from './glow-renderer.js';

const textureLoader = new THREE.TextureLoader(); 
const cubeTexLoader = new THREE.CubeTextureLoader();

export class World{
    constructor(camera){
        this.structureObjects = [];
        this.scene = new THREE.Scene();
        this.pressedKeys = {};
        this.character = new Character([0,130,20], this.scene, camera, this.pressedKeys);
        // this.hitBoxHelper = new HitBoxHelper(this.scene, this.structureObjects, this.character, camera, this.pressedKeys);
        this.ambience = new Ambience(['ambience/Another Wave from You.mp3', 'ambience/ES_The Clearing.mp3'])
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
        this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera.camObj, this.background);
        
        this.draw = this.draw.bind(this);
        this.draw();
    }

    createSphere([x,y,z], r, colour){
        const geometry = new THREE.SphereGeometry( r, 32, 32 );
        const material = new THREE.MeshBasicMaterial( {color: colour} );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x,y,z);
        this.scene.add( sphere );
    }

    async buildScene(){
        this.city = new City(this.scene, this.structureObjects);
        this.terrain = new Terrain(this.scene, [100000, 100000, 100], [0,-250,0]);
        this.background = cubeTexLoader.load([
            'skybox/right.png', 'skybox/left.png',
            'skybox/bottom.png', 'skybox/top.png',
            'skybox/back.png', 'skybox/front.png'
        ])
        this.scene.background = this.background;
        new CreateBox(this.scene, this.structureObjects, [-73.4,25,-343], [30000, 15, 23000], true, 'textures/ground.jpg', true, [200,200]);
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        this.ufos.push(new Ufo([0,0,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        const light = new THREE.DirectionalLight( 0xffffff, 0.3 );
        const lightVec = {x: 0.718, y: 1, z: -0.295}
        const y = 10000;
        light.position.set( y*lightVec.x, y, y*lightVec.z );
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 2000000;
        light.shadow.camera.left = -10000;
        light.shadow.camera.right = 10000;
        light.shadow.camera.top = 10000;
        light.shadow.camera.bottom = -10000;
        light.shadow.bias = -0.00005;
        light.castShadow = true; 
        this.scene.add( light );
        this.scene.add( new THREE.AmbientLight( 0xffffff, 0.1 ) );
        // while (this.city.model == null || this.city.model == undefined){
        //     await new Promise(resolve => setTimeout(resolve, 100));
        // }
        this.ambience.fadeIn();
    }

    updateWorld(){
        this.ufos.forEach(ufo => {
            ufo.update();
        })
        // this.hitBoxHelper.updateHelper();
    }

    draw(){
        this.camera.updateCam(this.character);
        this.character.move(this.camera, this.structureObjects, this.ufos);
        this.updateWorld(this.character)
        // this.renderer.render( this.scene, this.camera.camObj );
        this.glowRenderer.render()
        requestAnimationFrame(this.draw);
    }
}