import * as THREE from 'three';

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

export class Camera{
    constructor(){
        //Initalise camera
        this.camObj = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 50000 );
        this.yaw = 0;
        this.tilt = 15;
        this.roll = 0; //Not used
        this.mouseSpeed = -0.5;
        this.fov = 60;
        this.nearPlane = 0.1;
        this.farPlane = 80000;

        this.deltaFOV = 0;
        this.clock = new THREE.Clock();

        this.handleMouseMove();

        //Hides pointer on click
        document.addEventListener("click", function(){
            document.body.requestPointerLock();
            document.body.requestFullscreen();
        })

        
    }

    handleMouseMove(){
        document.onmousemove = (event) => {
            //Mouse movement is used to change the camera's yaw and tilt
            this.yaw += event.movementX * this.mouseSpeed * 0.1;
            while (this.yaw>360) {this.yaw -= 360};
            while (this.yaw<0) (this.yaw+=360);
        
            this.tilt += event.movementY * this.mouseSpeed * 0.1;
        };
    }

    updateCam(character){
        this.character = character;
        this.checkTilt();   //Prevents camera from flipping upside down
        this.updateFOV();   //Updates FOV based on deltaFOV
        
        //Set camera properties
        this.camObj.position.set(character.x, character.y, character.z); //Camera follows character
        this.camObj.lookAt(character.x+100*sin(this.yaw-180),character.y+100*tan(this.tilt-180),character.z+100*cos(this.yaw-180));
    }


    checkTilt(){ //Prevents camera from flipping upside down
        if (this.tilt >= 90){
            this.tilt = 89.99;
        } else if (this.tilt <= -90){
            this.tilt = -89.99;
        }
    }

    updateFOV(){
        //Updates FOV based on deltaFOV
        const newFOV = this.fov + this.deltaFOV*this.clock.getDelta()*142.857; //clock used to standardise FOV change across different framerates
        if (newFOV > 60 || newFOV < 30){ //Prevents FOV from going outside of 30-60 range
            this.deltaFOV = 0;
        } else{
            this.fov = newFOV;
            this.camObj.fov = this.fov;
            this.camObj.updateProjectionMatrix(); //Need to call this to update camera
        }
    }

}