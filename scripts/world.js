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
const clock = new THREE.Clock();

function sin(deg){
    return Math.sin(deg*Math.PI/180);
}

function cos(deg){
    return Math.cos(deg*Math.PI/180);
}

function tan(deg){
    return Math.tan(deg*Math.PI/180);
}


export class World{
    constructor(camera){
        this.structureObjects = [];
        this.scene = new THREE.Scene();
        this.pressedKeys = {};
        this.character = new Character([0,0,0], this.scene, camera, this.pressedKeys);
        // this.hitBoxHelper = new HitBoxHelper(this.scene, this.structureObjects, this.character, camera, this.pressedKeys);
        this.ambience = new Ambience(['ambience/Another Wave from You.mp3', 'ambience/ES_The Clearing.mp3'])
        this.camera = camera;
        const canvas = document.querySelector('#mainGameCanvas');
        this.renderer = new THREE.WebGLRenderer( { canvas: canvas});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.gammaOutput = true; 
        this.renderer.gammaFactor = 1.0   
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setClearColor (0x0a4861, 1);
        this.renderer.logarithmicDepthBuffer = true
        
        this.ufos = [];
        this.backgroundLoaded = false;
        this.buildScene();
        this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera.camObj, 0.0, 0.5, 0.0, 1.1);
        
        $('.mission-screen').css('opacity', '0');

        this.draw = this.draw.bind(this);
        
        this.startAnimation();
    }

    degToRad(deg){
        return deg*Math.PI/180;
    }

    startAnimation(){
        this.camera.yaw = -69;
        this.camera.tilt = 51

        this.camera.camObj.position.set(0, 10000, 0);
        this.camera.camObj.lookAt(sin(this.camera.yaw-180),10000+tan(this.camera.tilt-180),cos(this.camera.yaw-180));
        this.camera.camObj.fov = 0;
        this.camera.camObj.updateProjectionMatrix();
        this.deltaFOV = 0;
        
        this.character.x = 0;
        this.character.y = 10000;
        this.character.z = 0;
        this.character.hideOverlay = true;
        

        this.drawAnimation = this.drawAnimation.bind(this);
        this.drawAnimation();
    }

    drawAnimation(){
        if(!this.backgroundLoaded){
            requestAnimationFrame(this.drawAnimation);
            return;
        }
        this.glowRenderer.render();
        // this.renderer.render( this.scene, this.camera.camObj );
        this.camera.camObj.fov += this.deltaFOV;
        this.deltaFOV += 0.005;
        if (this.camera.camObj.fov < 60){
            this.camera.camObj.updateProjectionMatrix();
            requestAnimationFrame(this.drawAnimation);
        } else {
            this.camera.camObj.fov = 60;
            this.camera.camObj.updateProjectionMatrix();
            this.character.hideOverlay = false;
            this.camera.yaw = -69;
            this.camera.tilt = 51
            this.draw();
        }
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
            'game-skybox/right.png', 'game-skybox/left.png',
            'game-skybox/bottom.png', 'game-skybox/top.png',
            'game-skybox/back.png', 'game-skybox/front.png'
        ], ()=>{this.backgroundLoaded = true;})
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
        while (this.city.model == null || this.city.model == undefined){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
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