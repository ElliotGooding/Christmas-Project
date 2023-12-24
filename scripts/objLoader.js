import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

var mtlLoader = new MTLLoader();

export class OBJModel{
    constructor(objPath, mtlPath, scene, glowing=false){
        this.objPath = objPath;
        this.mtlPath = mtlPath;
        this.scene = scene;
        this.glowing = glowing;
        this.model = null;
        this.originalMaterials = [];
        this.loadModel();
    }

    loadModel(){
        mtlLoader.load(this.mtlPath, this.onLoadFunc.bind(this), undefined, function (error) {
            console.error(error);
        });
    }

    onLoadFunc(materials) {
        materials.preload();
    
        var objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
    
        objLoader.load(this.objPath, (object) => {
            this.model = object;
            this.scene.add(object);
    
            this.model.traverse(child => {
                if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((subMaterial, index) => {
                            subMaterial.userData.originalColor = subMaterial.color.clone();
                            this.originalMaterials.push(subMaterial);
                        });
                    } else {
                        child.material.userData.originalColor = child.material.color.clone();
                        this.originalMaterials.push(child.material);
                    }
                    child.castShadow = true;
                    if (this.glowing){
                        child.layers.enable(1);
                    }
                }
            });
        }, function (xhr) {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function (error) {
            console.error("OBJLoader error:", error);
        });
    }

    takeDamage(timeout) {
        if (this.model) {
            this.originalMaterials.forEach(material => {
                material.color.set(0xff0000);
            });
            setTimeout(() => {
                this.originalMaterials.forEach(material => {
                    material.color.copy(material.userData.originalColor);
                });
            }, timeout);
        }
    }
}