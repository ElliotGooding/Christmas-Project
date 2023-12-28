import * as THREE from 'three';

function sin(deg){
    return Math.sin(deg*Math.PI/180)
}

function cos(deg){
    return Math.cos(deg*Math.PI/180)
}

function tan(deg){
    return Math.tan(deg*Math.PI/180)
}

export class Camera{
    constructor(){
        this.camObj = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 50000 );
        this.yaw = 0;
        this.tilt = 15;
        this.roll = 0;
        this.mouseSpeed = -0.5;
        this.fov = 60;
        this.nearPlane = 0.1;
        this.farPlane = 80000;

        this.deltaFOV = 0;

        this.handleMouseMove();

        //Hides pointer on click
        document.addEventListener("click", function(){
            document.body.requestPointerLock();
        })
    }

    handleMouseMove(){
        document.onmousemove = (event) => {
            this.yaw += event.movementX * this.mouseSpeed * 0.1;
            while (this.yaw>360) {this.yaw -= 360};
            while (this.yaw<0) (this.yaw+=360);
        
            this.tilt += event.movementY * this.mouseSpeed * 0.1;
        };
    }

    updateCam(character){
        this.camObj.position.set(character.x, character.y, character.z);
        this.checkTilt();
        this.camObj.lookAt(character.x+100*sin(this.yaw-180),character.y+100*tan(this.tilt-180),character.z+100*cos(this.yaw-180));
        this.updateFOV();
    }


    checkTilt(){
        if (this.tilt >= 90){
            this.tilt = 89.99;
        } else if (this.tilt <= -90){
            this.tilt = -89.99;
        }
    }

    updateFOV(){
        const newFOV = this.fov + this.deltaFOV;
        if (newFOV > 60 || newFOV < 30){
            this.deltaFOV = 0;
        } else{
            this.fov = newFOV;
            this.camObj.fov = this.fov;
            this.camObj.updateProjectionMatrix();
        }
    }

}