import * as THREE from 'three';
import { AnimatedGLTFModel } from './model.js'
import { Bullet } from './projectiles.js'
import { Sound } from './sounds.js'


//Custom trig functions for degrees
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
    constructor(startCoords, scene, cam, pressedKeys, ambience){
        ///////////////////////
        //INITALISE VARIABLES//
        ///////////////////////

        //Boilerplate variables for setting up the scene
        this.scene = scene;
        this.cam = cam;
        this.ambience = ambience;

        //Character position/dimensions
        this.x = startCoords[0];
        this.y = startCoords[1];
        this.z = startCoords[2];
        this.Height = 100;
        this.Width = 50;
        this.Depth = 50;
        this.defaultHeight = this.Height;

        //Movement
        this.speed = 10;
        // this.speed = 60; //For testing
        this.defaultSpeed = this.speed
        this.ySpeed = 0;
        this.yAccel = -0.19;
        this.jumpSpeed = 10;
        // this.verticalFlySpeed = 10; //For testing
        // this.verticalFlySpeed = 60; //For testing
        this.admin = false;

        //Overlay
        this.enableOverlay = true;
        this.overlayOffset = [0.1,-2.6,2.35];
        this.aimOverlayOffset = [0.53,-1.43,-0.1]
        this.animation = 0
        this.damageOverlayEnabled = true;

        //Shooting
        this.shooting = false;
        this.bullets = [];
        this.damage = 3;
        this.ufosKilled = 0;

        //Health
        this.dead = false;
        this.health = 100
        this.coolDown = 0;
        this.coolDownSpeed = 1;
        this.tSinceLastHeal = 0;
        this.tSinceLastDamage = 0;

        //Clock
        this.clock = new THREE.Clock();

        //////////////////
        //INPUT HANDLING//
        //////////////////

        //Initialise pressedKeys array
        this.pressedKeys = pressedKeys;
        window.onkeyup = (e) => { this.pressedKeys[e.keyCode] = false; };
        window.onkeydown = (e) => { this.pressedKeys[e.keyCode] = true; };
    
        //Handle mouse input
        document.addEventListener("mousedown", (e)=>{
            if (this.dead){return} //Prevents shooting/aiming after death
            if (e.button == 0 && this.coolDown <= 0){this.shooting = true} //Shoot
            else if (e.button == 2){ //Aiming
                this.aiming = true
                this.speed = this.defaultSpeed/2
                this.damage = 10;
                this.cam.deltaFOV = -2;
            }
        });
        document.addEventListener("mouseup", (e)=>{
            if (this.dead){return} //Prevents shooting/aiming after death
            if (e.button == 2){ //Stop aiming
                this.aiming = false
                this.speed = this.defaultSpeed
                this.damage = 3
                this.cam.deltaFOV = 2;
            }
        });

        //Create gun overlay
        this.model = new AnimatedGLTFModel("assets/character-overlay-v1.glb", [this.x, this.y, this.z], [10,10,10], this.scene, this.animation);
    }

    move(cam, structureObjects, ufos){
        this.ufos = ufos;
        //Clock used to standardise movement/animation across different framerates
        this.dt = this.clock.getDelta()*142.857;

        this.updateHealth();
        this.updateOverlay();
        this.shoot();
        this.handleInput(cam,structureObjects);
        this.fall(structureObjects);
        this.resolveClipping(structureObjects);
    }

    updateHealth(){
        if (this.dead){return} //Prevents healing after death
        this.tSinceLastHeal += 1;
        if (this.tSinceLastHeal > 250 && this.health < 100){ //Heal every 250 frames
            this.health += 1;
            this.tSinceLastHeal = 0; //Reset timer
            //Update health bar
            document.querySelector(".health-bar-inner").style.width = `${this.health}%`
            document.querySelector(".health-amount").innerHTML = `${Math.round(this.health)}/100`
        }
    }

    handleInput(cam, structureObjects){
        if (this.dead){return;} //Prevents movement after death
        let sumDirectVec = new THREE.Vector3(0,0,0); //Vector to store the sum of all movement vectors
        
        //Add any movement vectors to sumDirectVec
        if (this.pressedKeys[87]){ //W
            sumDirectVec.add(this.createDirectVec("XZ", cam.yaw+180, this.speed))
        };
        if (this.pressedKeys[65]){ //A
            sumDirectVec.add(this.createDirectVec("XZ", cam.yaw+270, this.speed));
        };
        if (this.pressedKeys[83]){ //S
            sumDirectVec.add(this.createDirectVec("XZ", cam.yaw, this.speed));
        };
        if (this.pressedKeys[68]){ //D
            sumDirectVec.add(this.createDirectVec("XZ", cam.yaw+90, this.speed,));
        };
        if (this.admin === true){ //For testing
            if (this.pressedKeys[32]){ //Space
                sumDirectVec.add(this.createDirectVec("Y", this.verticalFlySpeed, this.speed));
            };
            if (this.pressedKeys[16]){ //Shift
                sumDirectVec.add(this.createDirectVec("Y", -this.verticalFlySpeed, this.speed));
            };
        } else {
            //Space
            if (this.pressedKeys[32] && this.collision([this.x, this.y-1, this.z], structureObjects) === true){
                //Create jump force if on ground
                this.ySpeed = this.jumpSpeed; 
            }
            //Decrease height/hitbox size when crouching
            if (this.pressedKeys[16]){ //Shift
                this.Height = this.defaultHeight/2
            } else {
                this.Height = this.defaultHeight
            }
        }; 
        this.moveCharacterBy(sumDirectVec, structureObjects);
    };

    createDirectVec(plane, direction, speed){
        //Creates the movement vector for a given plane and direction
        let deltaPos;
        if (plane == "XZ"){
            //Calculate the x and z components of the movement vector
            let deltaZ = speed*cos(direction);
            let deltaX = speed*sin(direction);
            deltaPos = new THREE.Vector3(deltaX, 0, deltaZ);
        } else if (plane == "Y"){
            //Calculate the y component of the movement vector
            deltaPos = new THREE.Vector3(0, direction, 0);
        }
        document.querySelector(".coordinates").innerHTML = `${Math.round(this.x)}, ${Math.round(this.y)}, ${Math.round(this.z)}`
        // console.log(`X: ${this.x}\nY: ${this.y}\nZ: ${this.z}`)
        return deltaPos;
    }

    moveCharacterBy(deltaPos, structureObjects){
        //Normalise movement vector on XZ plane
        const y = deltaPos.y;
        deltaPos.y = 0;
        deltaPos.x = (Math.abs(deltaPos.x) < 0.001) ? 0 : deltaPos.x; //Remove floating point errors
        deltaPos.z = (Math.abs(deltaPos.z) < 0.001) ? 0 : deltaPos.z; //Remove floating point errors
        deltaPos.normalize();
        deltaPos.multiplyScalar(this.speed*this.dt); //Scale movement vector by speed (and dt)
        deltaPos.y = y; //Restore y component of movement vector

        //Calculate new position
        const newX = this.x + deltaPos.x;
        const newY = this.y + deltaPos.y;
        const newZ = this.z + deltaPos.z;

        //Check for collisions in each axis INDEPENDENTLY
        if (this.collision([newX, this.y, this.z], structureObjects) === false){
            this.x = newX;
        }
        if (this.collision([this.x, newY, this.z], structureObjects) === false){
            this.y = newY;
        }
        if (this.collision([this.x, this.y, newZ], structureObjects) === false){
            this.z = newZ;
        }
    }

    collision([x,y,z], structureObjects){
        //Standard AABB (Axis Aligned Bounding Box) collision detection
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
        if (this.admin) {return} //Admins can fly
        const newY = this.y + this.ySpeed; //Calculate new y position
        //Check for collisions in y axis
        if (this.collision([this.x, newY, this.z],structureObjects) === false){
            this.y = newY;
            this.ySpeed += this.yAccel; //Apply gravity
        } else {
            //Stop falling if on ground
            this.ySpeed = 0;
        }
    }

    resolveClipping(structureObjects){
        //Acts as a failsafe to prevent any bugs caused by clipping
        if (this.collision([this.x, this.y, this.z],structureObjects)){
            this.y+=1;
        }
    }

    updateOverlay(){
        if (this.enableOverlay == false){return} //Prevents overlay from rendering

        //Render overlay depending on aiming state
        if (!this.aiming){this.renderOverlay(this.overlayOffset, -4)}
        else {this.renderOverlay(this.aimOverlayOffset, 0)}

        //Remove damage overlay after 300 ticks
        if (this.damageOverlayEnabled){
            this.tSinceLastDamage += 1;
            if (this.tSinceLastDamage > 300 && this.dead == false){
                this.damageOverlayEnabled = false;
                document.querySelector(".damage-overlay").classList.remove("damage-effect");
            }
        }
    }

    renderOverlay(rawOffset, tiltOffset){
        if (this.model.model == null){return} //Prevents overlay from rendering before model is loaded
        const camera = this.cam;

        //Calculate Euler angles
        const yawRadians = THREE.MathUtils.degToRad(camera.yaw+180);
        const pitchRadians = THREE.MathUtils.degToRad(-camera.tilt+tiltOffset);

        //Calculate combined quaternion
        const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);
        const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRadians);
        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiply(yawQuaternion).multiply(pitchQuaternion);

        //Apply offset on overlays local axis
        const offset = new THREE.Vector3(...rawOffset)
        offset.applyQuaternion(combinedQuaternion)
        const x = this.x + offset.x;
        const y = this.y + offset.y;
        const z = this.z + offset.z;

        //Update overlay position and rotation
        this.model.model.position.set(x,y,z);
        this.model.model.setRotationFromQuaternion(combinedQuaternion);
        this.model.update(0.005 * this.dt)
    }

    shoot(){
        if (this.dead){return;} //Prevents shooting after death
        this.coolDown -= this.coolDownSpeed*this.dt; //Decrease cooldown
        if (this.model.model == null){return} //Prevents shooting before model is loaded
        if (this.shooting && this.coolDown <= 0){ 
            this.shooting = false;
            this.coolDown = 100; //Reset cooldown
            this.model.setAnimation(2, false) //Play shooting animation

            //Create bullet
            const yaw = -this.cam.yaw-90;
            const pitch = this.cam.tilt;
            const x = cos(yaw)*cos(pitch);
            const y = sin(pitch);
            const z = sin(yaw)*cos(pitch);
            const bullet = new Bullet([this.x, this.y, this.z], [x,y,z], this.scene, this.character, this.damage, this.cam, this.ufos);
            this.bullets.push(bullet);

            //Play sound
            new Sound("assets/gun-sfx.mp3")
        }
        this.updateBullets();
    }

    updateBullets(){
        this.bullets.forEach(bullet => {
            bullet.update(); //Update bullet position
        });
    }

    takeDamage(damage){
        this.tSinceLastDamage = 0; //Reset timer

        //Show damage overlay
        this.damageOverlayEnabled = true; 
        const damageOverlay = document.querySelector(".damage-overlay");
        damageOverlay.classList.add("damage-effect");

        //Decrease health
        this.health -= damage;
        if (this.health <= 0){ //Die if health is 0
            this.die();
            this.health = 0;
        } else {
            //Make damage overlay less transparent depending on health
            const alpha = (100-this.health)/400;
            damageOverlay.style.setProperty('--red-alpha', ''+alpha);
        }
        //Update health bar
        document.querySelector(".health-bar-inner").style.width = `${this.health}%`
        document.querySelector(".health-amount").innerHTML = `${this.health}/100`
    }

    die(){
        if (this.dead){return} //Prevents dying twice
        this.health = 0;
        this.dead = true;
        this.Height /= 10;  //Creates falling effect
        this.aiming = false;
        this.ySpeed = 0;
        this.yAccel =-0.1;
        this.ambience.fadeOut(10)

        //Show game over message
        if (this.ufosKilled == 1){
            $('.kills').html(`You killed ${this.ufosKilled} UFO`);
        } else{
            $('.kills').html(`You killed ${this.ufosKilled} UFOs`);
        }
        $('.game-over-content').addClass('active');
        const damageOverlay = document.querySelector(".damage-overlay");
        damageOverlay.classList.add("dead-effect");
    }
}