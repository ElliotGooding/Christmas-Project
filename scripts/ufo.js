import * as THREE from 'three';
import { Box, CreateBox  } from './box.js'
import { Laser } from './projectiles.js'
import { Sound } from './sounds.js';
import { OBJModel } from './objLoader.js';
import VolumetricSpotLightMaterial from './volumetric-spotLight/threex.volumetricspotlightmaterial.js'

//UFO Spawn manager
export class UfoSpawner{
    constructor(scene, character, renderer, camera, structureObjects){
        this.scene = scene;
        this.character = character;
        this.renderer = renderer;
        this.camera = camera;
        this.structureObjects = structureObjects;
    }

    //Returns new UFO object
    spawn(){
        const center = [11.5,25,-2121]  //Center of map
        const dims = [16000, 15, 13000] //Dimensions of map
        let pos = null;

        while (pos == null || this.checkValidSpawn(pos) === false){
            const x = Math.random()*dims[0]/2 + center[0];
            const y = 200;
            const z = Math.random()*dims[2]/2 + center[2];
            pos = [x,y,z]
        }

        //Create UFO
        const ufo = new Ufo(pos, this.scene, this.character, this.renderer, this.camera, this.structureObjects);
        return ufo;
    }

    //Checks if UFO can spawn at position
    checkValidSpawn(pos){
        const distToPlayer = (
            (this.character.x - pos[0])**2 +
            (this.character.z - pos[2])**2
        )**0.5
        if (distToPlayer < 4000){return false}
        // const ufoVec = new THREE.Vector3(...pos);
        // const characterVec = new THREE.Vector3(this.character.x, this.character.y, this.character.z);
        // if (!this.checkCollisionBetweenPoints(ufoVec, characterVec)){return false}
        return true;
    }
}

export class Ufo{
    constructor(position, scene, character, renderer, camera, structureObjects){

        ///////////////////////
        //INITALISE VARIABLES//
        ///////////////////////

        this.position = position;
        this.scene = scene;
        this.character = character;
        this.renderer = renderer;
        this.camera = camera;
        this.structureObjects = structureObjects;

        //UFO Dimensions
        this.width = 470;
        this.height = 185;
        this.depth = 470;
        this.scale = [7,7,7];
        this.hitBoxOffset = [0, 160, 0]; //Offset of hitbox from center of UFO

        //Bob animation variables - Random for each UFO
        this.bobAmount = 150 + Math.random()*100;
        this.bobSpeed = 0.5 + Math.random()*0.5;

        //Position variables
        this.equilibrium = [...position];
        this.equilibrium[1] += this.hitBoxOffset[1];
        this.target = null;
        this.passiveDist = 5000; //Distance from player at which UFO becomes passive
        this.minDist = 200; //Minimum distance from player

        //Actions
        this.state = 'hover';
        this.prevState = 'hover';
        this.geometricSpeed = 0.01; //Speed when attacked from a distance    
        this.normalSpeed = 20; //Speed when not attacked from a distance

        //Shooting
        this.shootFreq = 15; //Magic number - determines freq of random shooting
        this.ticksSinceLastShot = 0;
        this.lasers = []; //Array of lasers shot by UFO
        this.damage = 5;
        this.health = 100;
        this.damageSinceLastMove = 0;
        this.isDead = false;

        //TICKS - used for animations
        this.t = 0;
        this.clock = new THREE.Clock();


        ////////////////////
        //CREATE UFO MODEL//
        ////////////////////
        this.createUfo();
        this.showHitBox = false;
        if (this.showHitBox){
            this.hitBox = new CreateBox(this.scene, this.structureObjects, [...position], [this.width, this.height, this.depth], true, 0x00ff00, false, [1,1], false)
            this.hitBox.material.transparent = true;
            this.hitBox.material.opacity = 0.05;
        }        
    }
    
    async createUfo(){
        //Alternative UFO model - not used due to material problems
        // this.modelObj = new GLTFModel('assets/ufo/ufo.glb', this.position, [this.size, this.size, this.size], this.scene, this.renderer, this.camera);
        
        //Loads model
        this.modelObj = new OBJModel('assets/ufo/ufo.obj', 'assets/ufo/ufo.mtl', this.scene, true) 
        this.createLightBeam(); //Creates the volumetric light under the UFO

        //Waits for model to load
        while (this.modelObj.model == null || this.modelObj.model == undefined){
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        //Sets model position and scale
        this.model = this.modelObj.model;
        this.model.scale.set(...this.scale);
        this.model.position.set(this.position[0], this.position[1]-this.hitBoxOffset[1], this.position[2]);
    }

    createLightBeam(){
        //Uses threex.volumetricspotlightmaterial.js to create volumetric light effect

        //Create mesh
        const geometry = new THREE.CylinderGeometry(50, 250, 1000, 256)
        const material = new VolumetricSpotLightMaterial();
        this.beam = new THREE.Mesh(geometry, material);
        this.beam.position.set(...this.position);

        //Set material properties
        material.uniforms.lightColor.value.set('green')
        material.uniforms.spotPosition.value = this.beam.position
        material.uniforms.attenuation.value = 1000

        //Add beam to scene
        this.scene.add(this.beam);
    }

    ////////////////////////
    //MAIN UPDATE FUNCTION//
    ////////////////////////
    update(){
        this.t += this.clock.getDelta()*142.857;
        if (this.model == null || this.model == undefined){return}
        this.updatePosition();
        this.updateModel();
        this.updateLasers();
        if (this.showHitBox){
            this.hitBox.position.set(...this.position);
            this.updateHitBoxColour();
        }
    }

    updatePosition(){
        if      ( this.state == 'hover'   ){ this.hover()   }
        else if ( this.state == 'moving'  ){ this.move()    }
        else if ( this.state == 'attack'  ){ this.attack()  }
        else if ( this.state == 'dead'    ){ this.dead()    }
        this.calcBob();
    }

    calcBob(){
        //Calculates bobbing animation
        if (this.state == 'dead'){return}
        this.position[0] = this.equilibrium[0] + this.bobAmount*Math.cos(this.t/200);
        this.position[1] = this.equilibrium[1] + this.bobAmount*Math.sin(this.t*2/200)/2;
        this.position[2] = this.equilibrium[2];
    }

    updateModel(){
        this.model.position.set(this.position[0], this.position[1]-this.hitBoxOffset[1], this.position[2]);
        this.beam.position.set(...this.position);
        this.beam.position.y -= 500;
        this.beam.material.uniforms.spotPosition.value = this.beam.position
    }

    updateLasers(){
        //Updates lasers shot by UFO
        this.lasers.forEach(laser => {
            laser.update();
        })
    }

    getDistBetweenPoints(v1, v2, includeY=false){
        //Returns distance between two vectors
        if(includeY){
            return ((v1.x-v2.x)**2 + (v1.y-v2.y)**2 + (v1.z-v2.z)**2)**0.5
        } else{
            return ((v1.x-v2.x)**2 + (v1.z-v2.z)**2)**0.5
        }
    }

    checkCollisionBetweenPoints(p1, p2){
        //Iterates through all solid objects and checks if there is a collision between two points
        const dist = p2.distanceTo(p1);
        const direction = p2.sub(p1).normalize();
        const ray = new THREE.Ray(p1, direction);
        for (let object of this.structureObjects){
            if (object.solid === true){
                const box = new THREE.Box3(
                    new THREE.Vector3(object.left, object.bottom, object.back),
                    new THREE.Vector3(object.right, object.top, object.front)
                );
                const intersectPoint = ray.intersectBox(box, new THREE.Vector3());
                if (intersectPoint != null){
                    const distToIntersect = intersectPoint.distanceTo(p1);
                    if (distToIntersect < dist){
                        return false; //COLLISION
                    }
                }
            }
        }
        return true; //NO COLLISION
    }

    checkAttack(){
        //Checks if UFO should attack player
        const ufoVec = new THREE.Vector3(...this.equilibrium);
        const characterVec = new THREE.Vector3(this.character.x, this.character.y, this.character.z);

        const distToPlayer = this.getDistBetweenPoints(ufoVec, characterVec);
        const isPlayerVisible = this.checkCollisionBetweenPoints(ufoVec, characterVec);
        this.inFireRange = false;
        if (distToPlayer < this.passiveDist && isPlayerVisible){ //UFOs attack player if they are close enough and visible
            this.inFireRange = true;
        }
        const Q3 = this.minDist+this.passiveDist*3/4; //Third quartile
        if (distToPlayer < this.minDist && this.inFireRange && this.state != "moving"){ //UFOs move away from player if they are too close
            this.setTarget() //Sets target to move away from player
        } else if (distToPlayer > Q3 && this.inFireRange && this.state != "moving"){ 
            this.setTarget() //Sets target to move towards player
        }

        return this.inFireRange;
        
    }

    hover(){
        if (this.checkAttack()){ 
            this.setTarget();
        } else{
            //Idle animation - Does nothing
        }
    }

    move(){
        //Moves UFO towards its target
        const target = this.target;
        const targetVec = new THREE.Vector3(...target);
        const ufoVec = new THREE.Vector3(...this.equilibrium);
        const directVec = targetVec.clone().sub(ufoVec);
        const dist = directVec.length();
        console.log(`target: ${target[0], target[1], target[2]}`)
        console.log(`ufoVec: ${ufoVec.x, ufoVec.y, ufoVec.z}`)

        //Calculate direction vector
        if (this.prevState == 'attack'){
            directVec.normalize();
            directVec.multiplyScalar(this.normalSpeed); //Linear movement
        } else if (this.prevState == 'hover'){
            directVec.multiplyScalar(this.geometricSpeed); //Non-linear movement (Geometric progression)
        }

        //Add direction vector to UFO position
        this.equilibrium[0] += directVec.x;
        this.equilibrium[1] += directVec.y;
        this.equilibrium[2] += directVec.z;

        //Check if UFO has reached its target
        const newUfoVec = new THREE.Vector3(...this.equilibrium);
        const newDist = this.getDistBetweenPoints(newUfoVec, targetVec);
        if ( (newDist > dist && this.prevState !== "hover") || ( newDist < 10 )){
            this.state = this.prevState;
        }

        //Check if UFO can attack player
        if (this.checkAttack()){ this.attack() };
    }

    attack(){
        //Attacks player
        this.turnToPlayer();
        this.shoot();
        this.checkAttack();
        if (this.checkAttack() == false){ this.state = 'hover' }
    }

    turnToPlayer(){
        //Turns UFO to face player
        const ufoVec = new THREE.Vector3(...this.equilibrium);
        const characterVec = new THREE.Vector3(this.character.x, this.character.y, this.character.z);
        const vecToChar = ufoVec.sub(characterVec);
        const angle = -Math.atan2(vecToChar.z, vecToChar.x);
        this.model.rotation.y = angle;
    }

    shoot(){
        //Shoots laser at player
        this.ticksSinceLastShot += 1;
        const weightedRandInt = Math.random()*100000/this.ticksSinceLastShot //As t increases, the chance of shooting increases

        if (                                    //CONDITIONS:
            this.character.admin === false &&   //Admins are immune to damage
            this.character.dead  === false &&   //Dead players are immune to damage
            this.t > 750                   &&   //UFOs cannot shoot for the first 750 ticks
            weightedRandInt < this.shootFreq    //UFOs have a random chance of shooting  
        ){
            this.ticksSinceLastShot = 0; //Reset

            //Calculate direction vector
            const vector = [
                this.character.x - this.position[0],
                this.character.y - this.position[1],
                this.character.z - this.position[2]
            ]
            const magnitude = (vector[0]**2 + vector[1]**2 + vector[2]**2)**0.5
            const direction = vector.map(x => x/magnitude) //Normalise vector

            //Create laser
            const laser = new Laser(this.position, direction, this.scene, this.character, this.damage);
            this.lasers.push(laser);
            new Sound("assets/laser.mp3") //Play laser sound
        }
    }

    dead(){
        if (this.position[1] > 55){ //Moves UFO down if its not landed
            this.position[1] -= 1;
        } else if (this.isDead === false){ //Runs on UFO death
            this.isDead = true
            this.character.ufosKilled += 1;
        }
    }

    takeDamage(damage){
        if (this.state == 'dead'){return} //UFO is already dead

        this.damageSinceLastMove += damage
        this.health -= damage;
        this.modelObj.takeDamage(100);

        
        if (this.health <= 0 && this.state != 'dead'){ //UFO dies
            this.state = 'dead';
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
        if (this.state == 'hover'){ //UFO is attacked from a distance and moves towards player
            this.setTarget();
        }
    }

    setTarget(){
        //Set state
        if (this.state != 'moving'){
            this.prevState = this.state;
            this.state = 'moving';
        }

        //Loop to find a valid target
        this.target = null;
        while (
            this.target == null ||
            this.collision(this.target, this.structureObjects) //Checks if target is inside a solid object
        ){
            const angle = Math.random() * 360
            const Q1 = this.minDist+this.passiveDist*1/4;
            const Q2 = this.minDist+this.passiveDist/2;
            this.target = [
                Math.round(this.character.x + Q1*Math.sin(angle)),
                Math.round(this.equilibrium[1]),
                Math.round(this.character.z + Q1*Math.cos(angle))
            ]
        }
    }

    collision([x,y,z], structureObjects){
        //Standard AABB (Axis Aligned Bounding Box) collision detection
        let bottom = y-this.height/2;
        let top = y+this.height/2;
        let left = x-this.width/2;
        let right = x+this.width/2;
        let back = z-this.depth/2;
        let front = z+this.depth/2;
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

    updateHitBoxColour(){
        if (this.state === "moving"){
            this.hitBox.material.color.setHex(0xfc7b03);
        } else if (this.state === "attack"){
            this.hitBox.material.color.setHex(0xff0000);
        } else if (this.state === "hover"){
            this.hitBox.material.color.setHex(0x00ff00);
        } else{
            this.hitBox.material.color.setHex(0x0000ff);
        }
    }
}