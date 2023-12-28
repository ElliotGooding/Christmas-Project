import * as THREE from 'three';
import { GlowRenderer } from './glow-renderer.js';
import { World } from './world.js';
import { Camera } from './camera.js';
import { MissionScreen } from './mission-screen.js';

const cubeTexLoader = new THREE.CubeTextureLoader();
const clock = new THREE.Clock();

const lastPerc = {x: null, y: null};

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

export class MenuScreen{
    constructor(){
        this.scene = new THREE.Scene();
        const canvas = document.querySelector('#startScreenCanvas');
        this.renderer = new THREE.WebGLRenderer( { canvas: canvas } );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        
        document.querySelector('.canvas-overlay').style.display = 'none';

        this.background = cubeTexLoader.load([
            'menu-skybox/right.png', 'menu-skybox/left.png',
            'menu-skybox/bottom.png', 'menu-skybox/top.png',
            'menu-skybox/back.png', 'menu-skybox/front.png'
        ])
        this.scene.background = this.background;
        this.scene.backgroundBlurriness = 0.06;
        
        const threshold = 0;
        const strength = 2;
        const radius = 1;
        const exposure = 10;

        this.glowRenderer = new GlowRenderer(this.renderer, this.scene, this.camera, threshold, strength, radius, exposure);

        this.menuScreenOn = true;
        this.rotSpeed = 0.05;
        this.draw = this.draw.bind(this);
        this.draw(0);

        this.sunX = 1.309;
        this.sunY = -0.6109;
        this.zSpinSpeed = 0;
        this.zSpinAccel = 0.00005;

        this.initalisePlayButtonGrad();
        // this.loadMissionScreen();
    }

    degToRad(deg){
        return deg*Math.PI/180;
    }

    draw(dt){
        var delta = clock.getDelta();
        this.glowRenderer.render();
        this.camera.rotation.x += this.rotSpeed*dt;
        this.camera.rotation.y += this.rotSpeed*dt;
        // this.camera.rotation.z += this.rotSpeed*dt;
        if (this.menuScreenOn === true){
            requestAnimationFrame( ()=>{
                this.draw(delta);
            });
        }
    }

    initalisePlayButtonGrad(){
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

        $('.play-button').click(this.initaliseMenu.bind(this));
    }

    initaliseMenu(){
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

        $('.start-button').one('click', this.startGameAnimation.bind(this));
    }

    startGameAnimation(){
        var delta = clock.getDelta();
        this.menuScreenOn = false;
        $('.menu').addClass('deactive')
        
        this.startX = this.camera.rotation.x;
        this.startY = this.camera.rotation.y;
        
        this.diffX = this.sunX - this.camera.rotation.x;
        this.diffY = this.sunY - this.camera.rotation.y;

        const maxT = 250
        let t = 0;
        
        requestAnimationFrame( ()=>{
            this.rotateToSun(t, maxT);
        })
    }

    ease(t){
        const PI = Math.PI;
        return ( ( Math.sin( (t*PI) - (PI/2) ) + 1 ) / 2 ) ** 2;
    }

    rotateToSun(t, maxT){
        const overlap = 150;

        let dt = clock.getDelta()*100;
        t+=dt;
        const ease = this.ease(t/maxT);
        this.camera.rotation.x = this.startX + (ease*this.diffX);
        this.camera.rotation.y = this.startY + (ease*this.diffY);

        if (this.scene.backgroundBlurriness > 0){
            this.scene.backgroundBlurriness -= 0.0005;
        
        }
        this.glowRenderer.render();
        if (t < maxT-overlap){
            requestAnimationFrame( ()=>{
                this.rotateToSun(t, maxT);
            })
        } else {
            this.spin(t, maxT);
        }
    }

    spin(t, maxT){
        $('.title').addClass('hide');
        const dt = clock.getDelta()*100;
        t+=dt;
        if (t < maxT){
            const ease = this.ease(t/maxT);
            this.camera.rotation.x = this.startX + (ease*this.diffX);
            this.camera.rotation.y = this.startY + (ease*this.diffY);
        } else {
            this.camera.fov -= 0.15;
            this.camera.updateProjectionMatrix();
            this.camera.rotation.x = this.sunX;
            this.camera.rotation.y = this.sunY;
        }
        this.camera.rotation.z += this.zSpinSpeed;
        this.zSpinSpeed += this.zSpinAccel;
        this.glowRenderer.render();
        if (this.camera.fov > 8){
            requestAnimationFrame( ()=>{
                this.spin(t, maxT);
            })
        } else {
            this.loadMissionScreen();
        }
    }

    loadMissionScreen(){
        $('.mission-screen').addClass('active');
        $('.menu-screen').css({'display': 'none'});
        $('.menu-screen').css({'visibility': 'hidden'});    
        const missionScreen = new MissionScreen();
    }
}