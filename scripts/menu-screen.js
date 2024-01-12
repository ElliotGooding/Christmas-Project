import * as THREE from 'three';
import { GlowRenderer } from './glow-renderer.js';
import { World } from './world.js';
import { Camera } from './camera.js';
import { MissionScreen } from './mission-screen.js';

const cubeTexLoader = new THREE.CubeTextureLoader();
const clock = new THREE.Clock();

//Tracks the last mouse position as a percentage of the play button
const lastPerc = {x: null, y: null};

//Clamps a number between a min and max value
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

export class MenuScreen{
    constructor(){
        this.menuScreenOn = true;
        this.loadBackground();
        this.initalisePlayButton();
    }

    //Create space skybox background
    loadBackground(){
        //Initalise renderer, scene and camera
        this.scene = new THREE.Scene();
        const canvas = document.querySelector('#startScreenCanvas');
        this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

        //Load skybox
        this.background = cubeTexLoader.load([
            'menu-skybox/right.png', 'menu-skybox/left.png',
            'menu-skybox/bottom.png', 'menu-skybox/top.png',
            'menu-skybox/back.png', 'menu-skybox/front.png'
        ])
        this.scene.background = this.background;
        this.scene.backgroundBlurriness = 0.06;
        
        //Create glow renderer
        const threshold = 0;
        const strength = 2;
        const radius = 1;
        const exposure = 10;
        this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera, threshold, strength, radius, exposure);

        //Animate background
        this.rotSpeed = 0.05;
        this.draw = this.draw.bind(this);
        this.draw(0);

        //Sun position
        this.sunX = 1.309;
        this.sunY = -0.6109;

        //Initalise spin
        this.zSpinSpeed = 0;
        this.zSpinAccel = 0.00005;
    }

    degToRad(deg){
        return deg*Math.PI/180;
    }

    draw(dt){
        var delta = clock.getDelta(); //Clock used to standardise animation across different frame rates
        
        //Render scene with glow
        this.glowRenderer.render();

        //Rotate background
        this.camera.rotation.x += this.rotSpeed*dt;
        this.camera.rotation.y += this.rotSpeed*dt;
        
        //Loop while menu screen is active
        if (this.menuScreenOn === true){
            requestAnimationFrame( ()=>{
                this.draw(delta);
            });
        }
    }

    initalisePlayButton(){
        //Create radial gradient at mouse cursor
        $('.play-button-background').mousemove( function(e){
            let xPerc = e.offsetX / $(this).outerWidth() * 100;
            let yPerc = e.offsetY / $(this).outerHeight() * 100;
    
            xPerc = clamp(xPerc, 0, 100);
            yPerc = clamp(yPerc, 0, 100);
    
            $(this).css({
                'background': `radial-gradient(circle at ${xPerc}% ${yPerc}%, rgba(186, 102, 255, 0.9), rgb(135, 102, 255, 0.4)`
            })
            lastPerc.x = xPerc;
            lastPerc.y = yPerc;
        });

        //Show menu on click
        $('.play-button').click(this.initaliseMenu.bind(this));
    }

    initaliseMenu(){
        //Animate menu
        $('.menu').css({'visibility': 'visible'})
        $('.menu').css({'display': 'block'})
        $('.play-button-text').fadeOut(100, ()=>{
            $('.title').addClass('moveToTop')
            $('.menu-background').addClass('active');
            $('.play-button').css({'display': 'none'});
            $('.menu-background').css({
                'background': `radial-gradient(circle at ${lastPerc.x}% ${lastPerc.y}%, rgba(186, 102, 255, 0.9), rgb(135, 102, 255, 0.7)`
            })
        });
        $('.menu-content').css({'display': 'block'});
        $('.menu-content').css({'visibility': 'visible'});
        setTimeout( ()=>{
            $('.menu-content').css({'opacity': '1'});
        }, 500)

        $('.menu').mousemove( (e)=>{
            //Create radial gradient at mouse cursor
            const background = $('.menu-background')[0];
            const rect = background.getBoundingClientRect();
            let xPerc = (e.clientX - rect.left) / rect.width * 100;
            let yPerc = (e.clientY - rect.top) / rect.height * 100;
    
            xPerc = clamp(xPerc, 0, 100);
            yPerc = clamp(yPerc, 0, 100);
    
            $(background).css({
                'background': `radial-gradient(circle at ${xPerc}% ${yPerc}%, rgba(186, 102, 255, 0.95), rgb(135, 102, 255, 0.4)`
            })
            lastPerc.x = xPerc;
            lastPerc.y = yPerc;
        });

        $('.start-button').one('click', this.startGame.bind(this));
    }

    startGame(event){
        //Radial fill from mouse cursor animation
        console.log(event);
        const btn = $('.start-button')[0];
        const fill = document.querySelector(".start-button .fill");
        const rect = btn.getBoundingClientRect();
        const radius = Math.max(rect.width,rect.height);
        fill.style.width = fill.style.height = `${radius}px`;
        fill.style.left = `${event.clientX -rect.left - radius/2}px`;
        fill.style.top = `${event.clientY -rect.top - radius/2}px`;
        const midX = (rect.width/2 - radius/2);
        const midY = (rect.height/2 - radius/2);            
        fill.animate({
            left: [`${event.clientX -rect.left - radius/2}px`, `${midX}px`],
            top: [`${event.clientY -rect.top - radius/2}px`, `${midY}px`],
            transform: ['scale(0)', 'scale(1)'],
            opacity: [0, 0.5]
        }, {
            duration: 500,
            fill: 'forwards'
        })
        setTimeout( ()=>{
            this.startGameAnimation();
        }, 700);
    }

    startGameAnimation(){
        //Start the sun animation
        this.menuScreenOn = false;
        $('.menu').addClass('deactive') //Hide menu
        

        //Calculate rotation to sun
        this.startX = this.camera.rotation.x;
        this.startY = this.camera.rotation.y;
        this.diffX = this.sunX - this.camera.rotation.x;
        this.diffY = this.sunY - this.camera.rotation.y;

        //Wrap rotation to -pi to pi
        while (this.diffX < -Math.PI){
            this.diffX += 2*Math.PI;
        }
        while (this.diffX > Math.PI){
            this.diffX -= 2*Math.PI;
        }
        while (this.diffY < -Math.PI){
            this.diffY += 2*Math.PI;
        }
        while (this.diffY > Math.PI){
            this.diffY -= 2*Math.PI;
        }

        const maxT = 250
        let t = 0;
        
        requestAnimationFrame( ()=>{
            this.rotateToSun(t, maxT);
        })
    }

    //Custom ease function
    ease(t){
        const PI = Math.PI;
        return ( ( Math.sin( (t*PI) - (PI/2) ) + 1 ) / 2 ) ** 2;
    }

    rotateToSun(t, maxT){
        //Turn camera to face sun
        const overlap = 150; // number of ticks before rotation on z axis occurs

        let dt = clock.getDelta()*100;
        t+=dt;

        //Calculate camera rotation
        const ease = this.ease(t/maxT);
        this.camera.rotation.x = this.startX + (ease*this.diffX);
        this.camera.rotation.y = this.startY + (ease*this.diffY);

        //Decrease background blurriness
        if (this.scene.backgroundBlurriness > 0){
            this.scene.backgroundBlurriness -= 0.0005;
        }

        //Render scene
        this.glowRenderer.render();

        //Loop until sun is reached
        if (t < maxT-overlap){
            requestAnimationFrame( ()=>{
                this.rotateToSun(t, maxT);
            })
        } else {
            this.spin(t, maxT);
        }
    }

    spin(t, maxT){
        $('.title').addClass('hide'); //Delay title hide until sun is reached
        const dt = clock.getDelta()*100;
        t+=dt;

        if (t < maxT){ //Continue cam rotation to sun
            const ease = this.ease(t/maxT);
            this.camera.rotation.x = this.startX + (ease*this.diffX);
            this.camera.rotation.y = this.startY + (ease*this.diffY);
        } else { //Sun is reached, start zoom
            this.camera.fov -= 0.15;
            this.camera.updateProjectionMatrix();
            this.camera.rotation.x = this.sunX;
            this.camera.rotation.y = this.sunY;
        }

        //Spin camera on z axis
        this.camera.rotation.z += this.zSpinSpeed;
        this.zSpinSpeed += this.zSpinAccel; //Increase spin speed

        //Render scene
        this.glowRenderer.render();

        //Loop until zoom is complete
        if (this.camera.fov > 8){
            requestAnimationFrame( ()=>{
                this.spin(t, maxT);
            })
        } else {
            this.loadMissionScreen(); //Load mission screen
        }
    }

    loadMissionScreen(){
        //Hide menu screen
        $('.menu-screen').css({'display': 'none'});
        $('.menu-screen').css({'visibility': 'hidden'});    

        //Show mission screen
        $('.mission-screen').addClass('active');
        const missionScreen = new MissionScreen();
    }
}