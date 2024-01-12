import { CreateBox } from "./box.js";

//////////////////////////////////
//FOR DEBUGGING AND TESTING ONLY//
//////////////////////////////////

//
//  Controls:
//  
//  \            = Speed up
// 
//  L            = Point1
//  Alt + L      = Point2
//  
//  Q            = Switch point
//  Arrowkeys    = Move (x,z)
//  Y            = Move up
//  Alt + Y      = Move down
//  
//  Alt + S      = Save
//  E            = Edit last hitbox
//  Backspace    = Delete last hitbox
//
//  B            = Move forward building
//  Alt + B      = Move backward building
//
//  C            = Toggle single hitbox visualise
//  V            = Toggle all hitbox visualise
//
//  P            = Print hitboxes


export class HitBoxHelper{
    constructor(scene, structureObjects, character, camera, pressedKeys){
        this.scene = scene;
        this.structureObjects = structureObjects;
        this.character = character;
        this.camera = camera;
        this.point1 = [0,0,0];
        this.point2 = [0,0,0];
        this.points = [this.point1, this.point2];
        this.pointSpeed = 1;
        this.colours = [0xff0000, 0x0000ff];
        this.coloursText = ["red", "blue"];
        this.pointObjects = [];
        this.currentPointPosition = [0,0,0];
        this.currentPoint = 0;
        this.currentID = 0;
        
        this.creatingHitBox = false;
        this.createdHitBoxes = [];
        this.visualisingHitBox = false;
        
        this.currentBuilding = 0;
        this.buildings = [];

        this.deleteEnabled = true;
        this.switchEnabled = true;
        this.switchVisualEnabled = true;
        this.nudgePointEnabled = true;
        this.nudging = false;

        this.pressedKeys = pressedKeys;
        this.createPoints();
    }

    createPoints(){
        for (let i = 0; i < this.points.length; i++){
            const point = this.points[i];
            const x = point[0];
            const y = point[1];
            const z = point[2];
            const w = 10;
            const h = 10;
            const d = 10;
            const colour = this.colours[i];
            const hitbox = new CreateBox(this.scene, [], [x,y,z], [w,h,d], true, colour, false, [1,1], false);
            this.scene.add(hitbox);
            this.pointObjects.push(hitbox);
        }
    }

    updateHelper(){
        this.handleInput();
        this.resetInputs();
        this.updatePoints();
    }

    resetInputs(){
        if (!this.pressedKeys[8]){
            this.deleteEnabled = true;
        } else {
            this.deleteEnabled = false;
        }

        if (!this.pressedKeys[81]){
            this.switchEnabled = true;
        } else {
            this.switchEnabled = false;
        } 

        if (!this.pressedKeys[67]){
            this.switchVisualEnabled = true;
        } else {
            this.switchVisualEnabled = false;
        }

        if (!this.pressedKeys[66]){
            this.switchBuildingEnabled = true;
        } else {
            this.switchBuildingEnabled = false;
        }

        if ((!this.pressedKeys[220]) || (!this.pressedKeys[37] && !this.pressedKeys[38] && !this.pressedKeys[39] && !this.pressedKeys[40] && !this.pressedKeys[89] && !this.pressedKeys[18])){
            this.nudgePointEnabled = true;
        } else {
            this.nudgePointEnabled = false;
        }

    }

    handleInput(){
        if (this.pressedKeys[220]){
            this.character.speed = 60
            this.character.verticalFlySpeed = 60
            this.pointSpeed = 0.3
            this.nudging = true;
        } else {
            this.character.speed = 10
            this.character.verticalFlySpeed = 10
            this.pointSpeed = 1
            this.nudging = false;
        }
        if (this.pressedKeys[76] && this.pressedKeys[18]){
            this.points[1] = [this.character.x, this.character.y, this.character.z];
            this.currentPoint = 1;
            this.creatingHitBox = true;
        } else if (this.pressedKeys[76]){
            this.points[0] = [this.character.x, this.character.y, this.character.z];
            this.currentPoint = 0;
            this.creatingHitBox = true;
        } else if ((this.pressedKeys[38]) && (!this.nudging || (this.nudgePointEnabled && this.nudging)) ){
            this.movePointInDir([0,this.pointSpeed]);
        } else if ((this.pressedKeys[40]) && (!this.nudging || (this.nudgePointEnabled && this.nudging)) ){
            this.movePointInDir([0,-this.pointSpeed]);
        } else if ((this.pressedKeys[39]) && (!this.nudging || (this.nudgePointEnabled && this.nudging)) ){
            this.movePointInDir([-this.pointSpeed,0]);
        } else if ((this.pressedKeys[37]) && (!this.nudging || (this.nudgePointEnabled && this.nudging)) ){
            this.movePointInDir([this.pointSpeed,0]);
        } else if (this.pressedKeys[89] && this.pressedKeys[18]  && (!this.nudging || (this.nudgePointEnabled && this.nudging))){
            this.points[this.currentPoint][1] -= this.pointSpeed;
            this.creatingHitBox = true;
        } else if (this.pressedKeys[89]  && (!this.nudging || (this.nudgePointEnabled && this.nudging))){
            this.points[this.currentPoint][1] += this.pointSpeed;
            this.creatingHitBox = true;
        } else if (this.pressedKeys[81] && this.switchEnabled){
            this.currentPoint = (this.currentPoint + 1) % 2;
            this.switchEnabled = false;
        } else if (this.pressedKeys[66] && this.pressedKeys[18]){
            this.switchBuilding(-1);
            this.switchBuildingEnabled = false;
        } else if (this.pressedKeys[66]){
            this.switchBuilding(1)
            this.switchBuildingEnabled = false;
        } else if (this.pressedKeys[80]){
            this.printHitBoxes();
        } else if (this.pressedKeys[13]){
            this.saveHitBox();
        } else if (this.pressedKeys[69]){
            this.editLastHitBox();
        } else if (this.pressedKeys[8]){
            this.deleteLastHitBox();
        } else if (this.pressedKeys[67] && this.switchVisualEnabled){
            this.switchVisual = true;
        }
    }

    movePointInDir(dir){
        this.creatingHitBox = true;
        const yaw = (this.camera.yaw < 0) ? this.camera.yaw + 360 : this.camera.yaw;
        while (yaw < 0) {yaw += 360};
        const nRotations = Math.round(yaw / 90) % 4;
        for (let i = 0; i < nRotations; i++){
            dir = [dir[1], -dir[0]];
        }
        this.points[this.currentPoint][0] -= dir[0];
        this.points[this.currentPoint][2] -= dir[1];
    }

    switchBuilding(direct){
        if (this.switchBuildingEnabled === false){return}
        let copyArr = [];
        for (const hitBox of this.createdHitBoxes){
            let copyHitBox = [];
            for (const point of hitBox){
                copyHitBox.push([...point]);
            }
            copyArr.push(copyHitBox);
        }
        this.buildings[this.currentBuilding] = copyArr;
        this.currentBuilding += direct;
        if (this.buildings[this.currentBuilding] === undefined){
            this.buildings[this.currentBuilding] = [];
        }
        this.createdHitBoxes = this.buildings[this.currentBuilding];

        const buildingOutput = document.querySelector('.building')
        buildingOutput.innerHTML = `Building ${this.currentBuilding+1}`
    }

    saveHitBox(){
        if (this.creatingHitBox === false){return}

        this.creatingHitBox = false;
        console.log("saving")
        
        if (this.visualisingHitBox){
            this.deleteLastHitBox();
            this.visualisingHitBox = false;
        }
        this.currentID += 1;
        const hitBox = new HitBox(this.points[0], this.points[1], this.scene, this.structureObjects, this.currentID);
        this.createdHitBoxes.push([[...this.points[0]], [...this.points[1]]])
        
        this.point1 = [0,0,0];
        this.point2 = [0,0,0];
    }

    editLastHitBox(){
        if (this.createdHitBoxes.length === 0 || this.creatingHitBox === true){return}
        this.creatingHitBox = true;
        [this.points[0], this.points[1]] = this.createdHitBoxes[this.createdHitBoxes.length-1];
        this.deleteLastHitBox();
    }

    deleteLastHitBox(){
        if (this.deleteEnabled === false || this.createdHitBoxes.length === 0){return}
        const structObjIdx = this.structureObjects.findIndex(object => object.id === this.currentID);
        if (structObjIdx === -1){return}
        this.structureObjects.splice(structObjIdx, 1);

        const meshObjIdx = this.scene.children.findIndex(object => object.name === this.currentID);
        if (meshObjIdx === -1){return}
        this.scene.children.splice(meshObjIdx, 1);

        this.currentID -= 1;
        this.createdHitBoxes.pop();
    }

    toggleVisualise(){
        if (this.creatingHitBox === false) {return}
        if (this.switchVisual === true) {
            this.visualisingHitBox = !this.visualisingHitBox;
        }
        
        if (this.visualisingHitBox){
            if (this.switchVisual === false){
                this.deleteLastHitBox();
            }
            this.currentID += 1;
            const hitBox = new HitBox(this.points[0], this.points[1], this.scene, this.structureObjects, this.currentID, 0x00ffff);
            this.createdHitBoxes.push([[...this.points[0]], [...this.points[1]]])
        } else {
            if (this.switchVisual === true) {
                this.deleteLastHitBox();
            }
        }

        this.switchVisual = false;
    }

    updatePoints(){
        this.toggleVisualise();
        for (let i = 0; i < this.pointObjects.length; i++){
            this.pointObjects[i].position.set(...this.points[i])
        }
        const pointOutput =  document.querySelector('.point')
        pointOutput.innerHTML = `Point ${this.currentPoint+1}`
        pointOutput.style.color = this.coloursText[this.currentPoint]
        // pointOutput.innerHTML = this.currentID
    }

    printHitBoxes(){
        this.buildings[this.currentBuilding] = this.createdHitBoxes;
        const points = ["point1", "point2"]
        let output = "[ \n";
        for (let i = 0; i < this.buildings.length; i++){
            const building = this.buildings[i];
            output += `    [ // Building ${i+1}\n`;
            for (const hitBox of building){
                output += `        { \n`;
                output += `            point1: [${hitBox[0][0]},${hitBox[0][1]},${hitBox[0][2]}],\n`;
                output += `            point2: [${hitBox[1][0]},${hitBox[1][1]},${hitBox[1][2]}]\n`;
                output += `        },\n`;
            }
            output += "    ],\n";
        }
        output += "]";
        console.log(output);
    }
}

class HitBox{
    constructor(point1, point2, scene, structureObjects, id, colour=0x00ff00){
        const x = (point1[0] + point2[0])/2;
        const y = (point1[1] + point2[1])/2;
        const z = (point1[2] + point2[2])/2;
        const w = Math.abs(point1[0] - point2[0]);
        const h = Math.abs(point1[1] - point2[1]);
        const d = Math.abs(point1[2] - point2[2]);
        const hitbox = new CreateBox(scene, structureObjects, [x,y,z], [w,h,d], true, colour, false, [1,1], true, id);
        structureObjects.push(hitbox);
    }
}