import * as THREE from 'three';
import { Model } from './model.js'
import { Box   } from './box.js'
import { Laser } from './projectiles.js'
import { Sound } from './sounds.js';
import { OBJModel } from './objLoader.js';

export class Ufo{
    constructor(position, scene, character, renderer, camera, createBoxFunc = undefined){
        this.position = position;
        this.scene = scene;
        this.character = character;
        this.renderer = renderer;
        this.camera = camera;

        this.Width = 470;
        this.Height = 185;
        this.Depth = 470;

        this.hitBoxOffset = [0,160,0]

        this.y = 200+this.hitBoxOffset[1];
        this.bobAmount = 100;

        this.size = 7;
        this.scale = [this.size, this.size, this.size]
        this.position = position
        this.equilibrium = [0, this.y, 0]
        this.state = "attack"
        this.shootFreq = 15

        this.t = 0;
        this.ticksSinceLastShot = 0;
        this.lasers = [];
        this.damage = 5
        this.health = 100
        this.damageSinceLastMove = 0;


        this.createUfo();
        // this.hitBox = createBoxFunc([...position], [this.Width, this.Height, this.Depth], 0x00ff00)
    }

    async createUfo(){
        // this.modelObj = new Model('assets/ufo.glb', this.position, [this.size, this.size, this.size], this.scene, this.renderer, this.camera);
        this.modelObj = new OBJModel('ufo.obj', 'ufo.mtl', this.scene)
        while (this.modelObj.model == null || this.modelObj.model == undefined){
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.model = this.modelObj.model;
        this.model.traverse(child => {
            if (child.isMesh) {
                child.material.transparent = false;
                child.material.opacity = 1.0;
            }
        });
        this.model.scale.set(...this.scale);
        this.model.position.set(this.position[0], this.position[1]-this.hitBoxOffset[1], this.position[2]);
    }

    update(){
        if (this.model == undefined){return}
        this.moveLasers();
        this.moveUfo();
        this.model.position.set(this.position[0], this.position[1]-this.hitBoxOffset[1], this.position[2]);
        // this.hitBox.position.set(...this.position);
    }

    moveLasers(){
        this.lasers.forEach(laser => {
            laser.update();
        });
    }

    moveUfo(){
        this.t+=1
        if      ( this.state == 'hover'   ){ this.hover()   }
        else if ( this.state == 'moving'  ){ this.moveTo()  }
        else if ( this.state == 'attack'  ){ this.attack()  }
        else if ( this.state == 'dead'    ){ this.dead()    }
        else if ( this.state == 'takeoff' ){ this.takeoff() }
    }

    hover(){
        this.position[0] = this.equilibrium[0] + this.bobAmount*Math.cos(this.t/200);
        this.position[1] = this.equilibrium[1] + this.bobAmount*Math.sin(this.t*2/200)/2;
        this.position[2] = this.equilibrium[2];
    }

    attack(){
        this.turn();
        this.shoot();
        this.checkDist();
    }

    turn(){
        const c = this.character;
        const characterVec = new THREE.Vector3(c.x, c.y, c.z); 
        this.model.lookAt(characterVec);
    
        this.model.rotation.x = 0;
        this.model.rotation.z = 0;
    }

    shoot(){
        this.ticksSinceLastShot += 1;
        if (this.character.admin === false && this.t > 750 && Math.random() < this.shootFreq*this.ticksSinceLastShot/100000){
        // if (Math.random() < this.ticksSinceLastShot/1000){
            this.ticksSinceLastShot = 0;
            const vector = [
                this.character.x - this.position[0],
                this.character.y - this.position[1],
                this.character.z - this.position[2]
            ]
            const magnitude = (vector[0]**2 + vector[1]**2 + vector[2]**2)**0.5
            const direction = vector.map(x => x/magnitude)
            const laser = new Laser(this.position, direction, this.scene, this.character, this.damage);
            this.lasers.push(laser);
            new Sound("assets/laser.mp3")
        }
    }

    checkDist(){
        const distToCharacter = (
            (this.character.x - this.position[0])**2 +
            (this.character.z - this.position[2])**2
        )**0.5
        if (distToCharacter < 200 || distToCharacter > 500){
            this.state = 'moving';
            const angle = Math.random() * 360
            this.target = [
                Math.round(this.character.x + 1000*Math.sin(angle)),
                Math.round(this.equilibrium[1]),
                Math.round(this.character.z + 1000*Math.sin(angle))
            ]
        } else {
            this.position[0] = this.equilibrium[0] + this.bobAmount*Math.cos(this.t/200);
            this.position[1] = this.equilibrium[1] + this.bobAmount*Math.sin(this.t*2/200)/2;
            this.position[2] = this.equilibrium[2];
        }
    }

    moveTo(){
        this.shoot()
        this.turn()
        this.equilibrium[0] += (this.target[0] - this.equilibrium[0])/100;
        this.equilibrium[1] += (this.target[1] - this.equilibrium[1])/100;
        this.equilibrium[2] += (this.target[2] - this.equilibrium[2])/100;
        const distToTarget = (
            (this.equilibrium[0] - this.target[0])**2 +
            (this.equilibrium[1] - this.target[1])**2 +
            (this.equilibrium[2] - this.target[2])**2
        )**0.5
        if (distToTarget < 10){
            this.state = 'attack';
        }
        this.position[0] = this.equilibrium[0] + this.bobAmount*Math.cos(this.t/200);
        this.position[1] = this.equilibrium[1] + this.bobAmount*Math.sin(this.t*2/200)/2;
        this.position[2] = this.equilibrium[2];
    }

    dead(){
        if (this.position[1] > 55){
            this.position[1] -= 1;
        }
    }

    takeDamage(damage, direction){
        if (this.state == 'dead'){return}
        this.damageSinceLastMove += damage
        this.health -= damage;
        this.modelObj.takeDamage(100);
        if (this.health <= 0 && this.state != 'dead'){
            this.state = 'dead';
            console.log('ufo dead')
            this.modelObj.takeDamage(300);
            setTimeout(() => {
                this.modelObj.takeDamage(300);
                setTimeout(() => {
                    this.modelObj.takeDamage(300);
                }, 600);
            }, 600);
            new Sound("assets/power-down.mp3")
            return;
        }
        if (this.damageSinceLastMove > 20){
            this.damageSinceLastMove = 0;
            this.state = 'moving';
            const randomValue = Math.random();
            const tempAngle = Math.acos(1-2*randomValue);
            const angle = (180* (Math.random() < 0.5 ? tempAngle : -tempAngle) / Math.PI) + this.camera.yaw;
            this.target = [
                Math.round(this.character.x + 100*Math.sin(angle)),
                Math.round(this.equilibrium[1]),
                Math.round(this.character.z + 100*Math.sin(angle))
            ]
        } else if (this.state != 'moving') {
            this.state = 'moving';
            this.target = [
                this.position[0] + direction[0]*100,
                this.equilibrium[1],
                this.position[2] + direction[2]*100,
            ]
        }
    }

    collision([x,y,z], structureObjects){
        let bottom = y-this.Height;
        let top = y+this.Height;
        let left = x-this.Width;
        let right = x+this.Width;
        let back = z-this.Depth;
        let front = z+this.Depth;
        for (let object of structureObjects){
            if (object.solid === true &&
                !(right < object.left || 
                left > object.right || 
                bottom > object.top || 
                top < object.bottom||
                front<object.back||
                back>object.front)){
                    return true;
                }
        }
        return false;
    }
}