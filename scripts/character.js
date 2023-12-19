import * as THREE from 'three';
import { Model, AnimatedModel } from './model.js'
import { Bullet } from './projectiles.js'
import { Sound } from './sounds.js'

function sin(deg){
    return Math.sin(deg*Math.PI/180)
}

function cos(deg){
    return Math.cos(deg*Math.PI/180)
}

function tan(deg){
    return Math.tan(deg*Math.PI/180)
}

export class Character{
    constructor(startCoords, scene, cam){
        this.scene = scene;
        this.cam = cam;

        this.x = startCoords[0];
        this.y = startCoords[1];
        this.z = startCoords[2];
        this.Height = 100;
        this.Width = 50;
        this.Depth = 50;
        this.defaultHeight = this.Height;

        this.speed = 10;
        this.ySpeed = 0;
        this.yAccel = -0.19;
        this.jumpSpeed = 10;
        this.admin = false;
        this.verticalFlySpeed = 10;

        this.overlayOffset = [0.2,-1.9,0];
        this.aimOverlayOffset = [-0.5,-1.5,-0.1]
        this.normalOverlayTiltDamper = 1.2;
        this.aimOverlayTiltDamper = 1.2;
        this.shooting = false;
        this.animation = 0
        this.bullets = [];
        this.damage = 3;

        this.health = 100
        this.coolDown = 0;
        this.coolDownSpeed = 1;

        this.tSinceLastDamage = 0;
        this.damageOverlay = true;

        this.pressedKeys = {};
        window.onkeyup = (e) => { this.pressedKeys[e.keyCode] = false; };
        window.onkeydown = (e) => { this.pressedKeys[e.keyCode] = true; };
    
        document.addEventListener("mousedown", (e)=>{
            if (e.button == 0 && this.coolDown <= 0){this.shooting = true}
            else if (e.button == 2){
                this.aiming = true
                this.damage = 10;
                this.cam.deltaFOV = -2;
            }
        });

        document.addEventListener("mouseup", (e)=>{
            if (e.button == 2){
                this.aiming = false
                this.damage = 3
                this.cam.deltaFOV = 2;
            }
        });

        this.model = new AnimatedModel("assets/character-overlay-v1.glb", [this.x, this.y, this.z], [10,10,10], this.scene, this.animation);
    
    
    }

    move(cam, structureObjects, ufos){
        this.ufos = ufos;
        this.updateOverlay();
        this.shoot();
        this.handleInput(cam,structureObjects);
        this.fall(structureObjects);
        this.resolveClipping(structureObjects);
    }

    handleInput(cam, structureObjects){
        if (this.pressedKeys[87]){
            this.moveInDirection("XZ", cam.yaw+180, this.speed, structureObjects);
        };
        if (this.pressedKeys[65]){
            this.moveInDirection("XZ", cam.yaw+270, this.speed, structureObjects);
        };
        if (this.pressedKeys[83]){
            this.moveInDirection("XZ", cam.yaw, this.speed, structureObjects);
        };
        if (this.pressedKeys[68]){
            this.moveInDirection("XZ", cam.yaw+90, this.speed, structureObjects);
        };
        if (this.admin === true){
            if (this.pressedKeys[32]){
                this.moveInDirection("Y", this.verticalFlySpeed, this.speed, structureObjects);
            };
            if (this.pressedKeys[16]){
                this.moveInDirection("Y", -this.verticalFlySpeed, this.speed, structureObjects);
            };
        } else {
            if (this.pressedKeys[32] && this.collision([this.x, this.y-1, this.z], structureObjects) === true){
                this.ySpeed = this.jumpSpeed;
            }
            if (this.pressedKeys[16]){
                this.Height = this.defaultHeight/2
            } else {
                this.Height = this.defaultHeight
            }
            // console.log(this.height)
        }; 
    };

    moveInDirection(plane, direction, speed, structureObjects){
        if (plane == "XZ"){
            let deltaZ = speed*cos(direction);
            let deltaX = speed*sin(direction);
            const newX = this.x + deltaX;
            const newZ = this.z + deltaZ;
            if (this.collision([newX, this.y, newZ], structureObjects) === false){
                this.x = newX;
                this.z = newZ;
            }
        } else if (plane == "Y"){
            const newY = this.y + direction;
            if (this.collision([this.x, newY, this.z], structureObjects) === false){
                this.y = newY;
            }
        }
        // console.log(`X: ${this.x}\nY: ${this.y}\nZ: ${this.z}`)
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

    fall(structureObjects){
        if (this.admin) {return}
        const newY = this.y + this.ySpeed;
        if (this.collision([this.x, newY, this.z],structureObjects) === false){
            this.y = newY;
            this.ySpeed += this.yAccel;
        } else {
            this.ySpeed = 0;
        }
    }

    resolveClipping(structureObjects){
        if (this.collision([this.x, this.y, this.z],structureObjects)){
            this.y+=1;
        }
    }

    updateOverlay(){
        if (!this.aiming){this.renderNormalOverlay()}
        else {this.renderAimingOverlay()}

        if (this.damageOverlay){
            this.tSinceLastDamage += 1;
            if (this.tSinceLastDamage > 200){
                this.damageOverlay = false;
                document.querySelector(".game-container").classList.remove("damage-effect");
            }
        }
    }

    renderNormalOverlay(){
        if (this.model.model == null){return}
        const camera = this.cam;
        const yawRadians = THREE.MathUtils.degToRad(camera.yaw+180);
        const pitchRadians = THREE.MathUtils.degToRad(-camera.tilt/this.normalOverlayTiltDamper);
        const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);
        const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRadians);
        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiply(yawQuaternion).multiply(pitchQuaternion);
        const yawAngle = this.cam.yaw-180;
        const x = this.x + (this.overlayOffset[2]*sin(yawAngle) - this.overlayOffset[0]*cos(yawAngle));
        const y = this.y + this.overlayOffset[1];
        const z = this.z + (this.overlayOffset[0]*sin(yawAngle) + this.overlayOffset[2]*cos(yawAngle));
        this.model.model.position.set(x,y,z);
        this.model.model.setRotationFromQuaternion(combinedQuaternion);
        this.model.update(0.005)
    }

    renderAimingOverlay(){
        if (this.model.model == null){return}
        const camera = this.cam;
        const yawRadians = THREE.MathUtils.degToRad(camera.yaw+180);
        const pitchRadians = THREE.MathUtils.degToRad(-camera.tilt/this.aimOverlayTiltDamper);
        const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);
        const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRadians);
        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiply(yawQuaternion).multiply(pitchQuaternion);
        const yawAngle = this.cam.yaw-180;
        const x = this.x + (this.aimOverlayOffset[2]*sin(yawAngle) - this.aimOverlayOffset[0]*cos(yawAngle));
        const y = this.y + this.aimOverlayOffset[1];
        const z = this.z + (this.aimOverlayOffset[0]*sin(yawAngle) + this.aimOverlayOffset[2]*cos(yawAngle));
        this.model.model.position.set(x,y,z);
        this.model.model.setRotationFromQuaternion(combinedQuaternion);
        this.model.update(0.005)
    }

    shoot(){
        this.coolDown -= this.coolDownSpeed;
        if (this.model.model == null){return}
        if (this.shooting && this.coolDown <= 0){
            this.shooting = false;
            this.coolDown = 100;
            this.model.setAnimation(2, false)
            const yaw = -this.cam.yaw-90;
            const pitch = this.cam.tilt;
            const x = cos(yaw)*cos(pitch);
            const y = sin(pitch);
            const z = sin(yaw)*cos(pitch);
            const bullet = new Bullet([this.x+this.overlayOffset[0], this.y+this.overlayOffset[1], this.z+this.overlayOffset[2]], [x,y,z], this.scene, this.character, this.damage, this.cam, this.ufos);
            this.bullets.push(bullet);
            new Sound("assets/gun-sfx.mp3")
        }
        this.updateBullets();
    }

    updateBullets(){
        this.bullets.forEach(bullet => {
            bullet.update();
        });
    }

    takeDamage(damage){
        this.tSinceLastDamage = 0;
        this.damageOverlay = true;
        document.querySelector(".game-container").classList.add("damage-effect");
        this.health -= damage;
        if (this.health <= 0){
            this.health = 0;
            this.dead = true;
            const alpha = "0.3"
        } else {
            const alpha = (100-this.health)/400;
            document.querySelector('.game-container').style.setProperty('--red-alpha', ''+alpha);
        }
        document.querySelector(".health-bar-inner").style.width = `${this.health}%`
    }
}