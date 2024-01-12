import * as THREE from 'three';
import { Box, CreateBox } from './box.js'
import { Ufo, UfoSpawner } from './ufo.js'
import { Character } from './character.js'
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
        this.structureObjects = []; //objects that the character can collide with
        this.pressedKeys = {}; //keys that are currently pressed

        //Background music
        this.ambience = new Ambience(['ambience/Another Wave from You.mp3', 'ambience/ES_The Clearing.mp3'])
        
        //Custom class for visualising and creating hitboxes
        // this.hitBoxHelper = new HitBoxHelper(this.scene, this.structureObjects, this.character, camera, this.pressedKeys);
        
        //Boilerplate code for setting up the scene
        this.scene = new THREE.Scene();
        this.camera = camera;
        const canvas = document.querySelector('#mainGameCanvas');
        this.renderer = new THREE.WebGLRenderer( { canvas: canvas });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.gammaOutput = true; 
        this.renderer.gammaFactor = 1.0   
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setClearColor (0x0a4861, 1);
        this.renderer.logarithmicDepthBuffer = true
        
        //Handling window resizing during rendering
        window.addEventListener('resize', () => {
            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.camera.camObj.aspect = window.innerWidth / window.innerHeight;
            this.camera.camObj.updateProjectionMatrix();
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera.camObj, 0.0, 0.5, 0.0, 1.1);
        })

        //Character object to control the player
        this.character = new Character([0,0,0], this.scene, camera, this.pressedKeys, this.ambience);
        
        //Create the ufo spawner
        this.ufoSpawner = new UfoSpawner(this.scene, this.character, this.renderer, this.camera, this.structureObjects);
        this.ufos = [];
        this.ufoSpawnChance = 0.003;

        //Build the scene
        this.backgroundLoaded = false;
        this.buildScene();

        //Create renderer with post processing effects
        this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera.camObj, 0.0, 0.5, 0.0, 1.1);

        //Start game
        this.draw = this.draw.bind(this);
        this.startAnimation();
    }

    degToRad(deg){
        return deg*Math.PI/180;
    }

    startAnimation(){
        //Initialise camera pointing at sun
        this.camera.yaw = -69;
        this.camera.tilt = 51
        this.camera.camObj.position.set(0, 10000, 0);
        this.camera.camObj.lookAt(sin(this.camera.yaw-180),10000+tan(this.camera.tilt-180),cos(this.camera.yaw-180));
        this.camera.camObj.fov = 0;
        this.camera.camObj.updateProjectionMatrix();
        this.deltaFOV = 0;
        
        //Initialise character position
        this.character.x = 0;
        this.character.y = 10000;
        this.character.z = 0;
        this.character.hideOverlay = true;
        
        this.drawAnimation = this.drawAnimation.bind(this);
        this.drawAnimation();
    }

    drawAnimation(){
        //Zoom out from sun animation

        if(!this.backgroundLoaded){ //wait for background to load
            requestAnimationFrame(this.drawAnimation);
            return;
        }

        //Render scene
        this.glowRenderer.render();
        // this.renderer.render( this.scene, this.camera.camObj ); //Alternative renderer without post processing effects
        
        //Zoom out
        this.camera.camObj.fov += this.deltaFOV;
        this.deltaFOV += 0.005;

        if (this.camera.camObj.fov < 60){ //Continue animation
            this.camera.camObj.updateProjectionMatrix();
            requestAnimationFrame(this.drawAnimation);
        } else { //Start game
            this.camera.camObj.fov = 60;
            this.camera.camObj.updateProjectionMatrix();
            this.character.hideOverlay = false;
            this.camera.yaw = -69;
            this.camera.tilt = 51
            this.draw();
        }
    }

    async buildScene(){
        //Create city and terrain
        this.city = new City(this.scene, this.structureObjects);
        this.terrain = new Terrain(this.scene, [100000, 100000, 100], [0,-250,0]);

        //Create skybox
        this.background = cubeTexLoader.load([
            'game-skybox/right.png', 'game-skybox/left.png',
            'game-skybox/bottom.png', 'game-skybox/top.png',
            'game-skybox/back.png', 'game-skybox/front.png'
        ], ()=>{this.backgroundLoaded = true;})
        this.scene.background = this.background;

        //Create ground and borders
        new CreateBox(this.scene, this.structureObjects, [11.5,25,-2121], [20000, 15, 17000], true, 'textures/ground.jpg', true, [200,200]);
        new CreateBox(this.scene, this.structureObjects, [11.5,25,-10600], [20000, 1000, 100], false);
        new CreateBox(this.scene, this.structureObjects, [11.5,25,6400], [20000, 1000, 100], false);
        new CreateBox(this.scene, this.structureObjects, [-10000,25,-2121], [100, 1000, 17000], false);
        new CreateBox(this.scene, this.structureObjects, [10000,25,-2121], [100, 1000, 17000], false);
        
        this.ufos.push(new Ufo([6000,200,0], this.scene, this.character, this.renderer, this.camera, this.structureObjects));
        
        //Create realistic lighting/shadows
        const light = new THREE.DirectionalLight( 0xffffff, 0.3 );
        const lightVec = {x: 0.718, y: 1, z: -0.295} //Position of sun
        const y = 10000; //Height of sun
        light.position.set( y*lightVec.x, y, y*lightVec.z );
        light.shadow.camera.near = 0.5;
        light.shadow.camera.far = 2000000;
        light.shadow.camera.left = -10000;
        light.shadow.camera.right = 10000;
        light.shadow.camera.top = 10000;
        light.shadow.camera.bottom = -10000;
        light.shadow.bias = -0.00005; //Needed to stop shadow acne
        light.castShadow = true; 
        this.scene.add( light );
        this.scene.add( new THREE.AmbientLight( 0xffffff, 0.1 ) );

        //Wait for world to load before starting game
        while (this.city.model.model == null || this.city.model.model == undefined || this.ufos[this.ufos.length-1].model == null || this.ufos[this.ufos.length-1].model == undefined){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.ambience.fadeIn();
        $('#mainGameCanvas').css('display', 'block');
        $('#mainGameCanvas').css('visibility', 'visible');
        $('.canvas-overlay').css('visibility', 'visible');
        $('.canvas-overlay').css('opacity', '1');
        $('.mission-screen').css('opacity', '0');
        $('.mission-screen').css('visibility', 'hidden');
        console.log("loaded all models");
    }

    updateWorld(){
        //Update UFOs
        this.ufos.forEach(ufo => {
            if (ufo.isDead == true){
                this.ufos.splice(this.ufos.indexOf(ufo), 1); //Remove dead ufos from global list
            }
            ufo.update();
        })
        this.spawnUfos(); 
        // this.hitBoxHelper.updateHelper(); //Update hitbox helper (for debugging)
    }

    spawnUfos(){
        if (Math.random() < this.ufoSpawnChance){ //Randomised spawning
            const ufo = this.ufoSpawner.spawn()
            this.ufos.push(ufo);
            this.ufoSpawnChance += 0.00002; //Increase spawn chance
        }
    }
    
    draw(){
        this.camera.updateCam(this.character); //Set camera position and orientation
        this.character.move(this.camera, this.structureObjects, this.ufos); //Move character
        this.updateWorld(this.character) //Update world
        // this.renderer.render( this.scene, this.camera.camObj ); //Alternative renderer without post processing effects
        this.glowRenderer.render()

        requestAnimationFrame(this.draw);
    }
}