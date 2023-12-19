import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'


const loader = new GLTFLoader();

export class Model {
    constructor(modelPath, position, scale, scene) {
        this.model = null;
        this.originalMaterials = [];
        this.loadModel(modelPath, position, scale, scene);
    }

    async loadModel(modelPath, position, scale, scene) {
        await new Promise((resolve, reject) => {
            loader.load(modelPath, (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(...scale);
                this.model.position.set(...position);
                this.model.castShadow = true;
                this.model.receiveShadow = true;

                scene.add(this.model);

                this.model.traverse(child => {
                    if (child.isMesh) {
                        if (Array.isArray(child.material)) {
                            this.originalMaterials.push(...child.material);
                        } else {
                            this.originalMaterials.push(child.material);
                        }
                        child.material.userData.originalColor = child.material.color.clone();
                    }
                });

                resolve();
            }, undefined, function (error) {
                console.error(error);
                reject(error);
            });
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

export class AnimatedModel{
    constructor(modelPath, position, scale, scene, defaultAnimation = 0) {
        this.mixer = null;
        this.model = null;
        this.defaultAnimation = defaultAnimation;
        this.currentAnimation = defaultAnimation;
        this.loadModel(modelPath, position, scale, scene, defaultAnimation);
    }

    loadModel(modelPath, position, scale, scene, animation = 0) {
        loader.load(modelPath, (gltf) => {
            this.animations = gltf.animations;
    
            if (this.animations && this.animations.length) {
                this.mixer = new THREE.AnimationMixer(gltf.scene);
    
                // Listen for the 'finished' event
                this.mixer.addEventListener('finished', (event) => {
                    this.setAnimation(this.defaultAnimation, true);
                });
    
                const clip = this.animations[animation];
                const action = this.mixer.clipAction(clip);
                action.play();
            }
    
            gltf.scene.scale.set(...scale);
            gltf.scene.position.set(...position);
            scene.add(gltf.scene);
            this.model = gltf.scene;1
        });
        this.update = this.update.bind(this);
    }

    setAnimation(animationIndex, loop = true) {
        this.currentAnimation = animationIndex;
        this.mixer.stopAllAction();
        if (this.mixer && this.model) {

            if (this.animations && this.animations.length > animationIndex) {
                const clip = this.animations[animationIndex];
                const action = this.mixer.clipAction(clip);
                if (loop) {
                    action.loop = THREE.LoopRepeat;
                } else {
                    action.loop = THREE.LoopOnce;
                }
                action.play();
            }
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}