import * as THREE from 'three';
import { Camera } from './camera.js';
import { World } from './world.js';

export class MissionScreen{
    constructor(){
        $('.continue-button').one('click', this.loadGame); //Initialise continue button
    }

    //Load game
    loadGame(){
        const cam = new Camera();
        const world = new World(cam);
    }
}