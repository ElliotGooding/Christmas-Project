import { Box       } from './box.js'
import { OBJModel } from './objLoader.js';

export class City{
    constructor(scene, structureObjects){
        this.scene = scene;
        this.structureObjects = structureObjects;
        this.model = new OBJModel('map.obj', 'map.mtl', this.scene);
        this.createHitBoxes();
    }

    createHitBoxes(){
        
    }
}