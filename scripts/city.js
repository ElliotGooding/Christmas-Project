import { CreateBox       } from './box.js'
import { OBJModel } from './objLoader.js';
import { hitBoxData as data }  from './hitBoxData.js'

export class City{
    constructor(scene, structureObjects){
        this.scene = scene;
        this.structureObjects = structureObjects;
        this.model = new OBJModel('map.obj', 'map.mtl', this.scene);
        this.buildingHitBoxes = data;
        this.buildingHitBoxes.forEach(building => {
            new Building(this.scene, this.structureObjects, building);
        });
    }
}

export class Building{
    constructor(scene, structureObjects, geometry){
        this.scene = scene;
        this.structureObjects = structureObjects;
        this.geometry = geometry;
        this.createHitBoxes();
    }

    createHitBoxes(){
        for (const box of this.geometry){
            const hitBox = new HitBox(box.point1, box.point2, this.scene, this.structureObjects);
            this.structureObjects.push(hitBox);   
        }
    }
}

class HitBox{
    constructor(point1, point2, scene, structureObjects){
        const x = (point1[0] + point2[0])/2;
        const y = (point1[1] + point2[1])/2;
        const z = (point1[2] + point2[2])/2;
        const w = Math.abs(point1[0] - point2[0]);
        const h = Math.abs(point1[1] - point2[1]);
        const d = Math.abs(point1[2] - point2[2]);
        const hitbox = new CreateBox(scene, structureObjects, [x,y,z], [w,h,d], false, 0xff0000);
        structureObjects.push(hitbox);
    }
}