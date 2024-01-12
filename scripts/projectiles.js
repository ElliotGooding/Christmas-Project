import * as THREE from 'three';
import {Box} from './box.js'

export class Projectile{
    constructor(position, direction, scene, character, damage, camera = null, ufos = null){
        this.position = position;
        this.direction = direction;
        this.scene = scene;
        this.character = character;
        this.camera = camera;
        this.ufos = ufos;

        this.scale = [1,1,1]
        this.position = [...position]
        
        this.active = true

        this.speed = 40;
        this.damage = damage
        this.clock = new THREE.Clock();

        this.model = null;
        this.createProjectile();
    }

    update(){
        if (this.active){
            this.move();
            this.model.position.set(...this.position);
            this.checkCollision();
        }
    }

    move(){
        const dt = this.clock.getDelta()*142.857;
        this.position[0] += this.direction[0]*this.speed*dt;
        this.position[1] += this.direction[1]*this.speed*dt;
        this.position[2] += this.direction[2]*this.speed*dt;
    }
}

export class Laser extends Projectile{
    constructor(position, direction, scene, character, damage){
        super(position, direction, scene, character, damage);
    }

    createProjectile(){
        const directionVec = new THREE.Vector3(...this.direction);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), directionVec.normalize());
        const geometry = new THREE.CylinderGeometry( 1, 1, 100, 32 );
        const material = new THREE.MeshBasicMaterial( {color: 0xFF0000} );
        this.model = new THREE.Mesh( geometry, material );
        this.model.position.set(...this.position);
        this.model.setRotationFromQuaternion(quaternion);
        this.scene.add( this.model );
    }

    checkCollision(){
        const character = this.character;
        const x = this.position[0];
        const y = this.position[1];
        const z = this.position[2];
        const w = 0.1;
        const h = 0.1;
        const d = 0.1;
        const hitBox = new Box(x,y,z,w,h,d);
        const collision = character.collision([character.x, character.y, character.z], [hitBox]);
        if (collision){
            character.takeDamage(this.damage);
            this.scene.remove(this.model);
            this.active = false;
        }
    }
}

export class Bullet extends Projectile{
    constructor(position, direction, scene, damage, character, camera, ufos){
        super(position, direction, scene, damage, character, camera, ufos);
    }

    createProjectile(){
        const camera = this.camera;
        const yawRadians = THREE.MathUtils.degToRad(camera.yaw);
        const pitchRadians = THREE.MathUtils.degToRad(camera.tilt-90);
        const yawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRadians);
        const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRadians);
        const combinedQuaternion = new THREE.Quaternion();
        combinedQuaternion.multiply(yawQuaternion).multiply(pitchQuaternion);
        const geometry = new THREE.CylinderGeometry( 1, 1, 20, 32 );
        const material = new THREE.MeshBasicMaterial( {color: 0x444444} );
        this.model = new THREE.Mesh( geometry, material );
        this.model.position.set(...this.position);
        this.model.setRotationFromQuaternion(combinedQuaternion);
        this.scene.add( this.model );
    }

    checkCollision(){
        const x = this.position[0];
        const y = this.position[1];
        const z = this.position[2];
        const w = 0.1;
        const h = 0.1;
        const d = 0.1;
        const hitBox = new Box(x,y,z,w,h,d);
        this.ufos.forEach(ufo => {
            const collision = ufo.collision(ufo.position, [hitBox]);
            if (collision && this.active){
                ufo.takeDamage(this.damage, this.direction);
                this.scene.remove(this.model);
                this.active = false;
            }
        })
    }
}