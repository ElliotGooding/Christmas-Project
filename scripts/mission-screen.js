import * as THREE from 'three';
import { Camera } from './camera.js';
import { World } from './world.js';

export class MissionScreen{
    constructor(){
        $('.continue-button').click(this.loadGame);
    }

    loadGame(){
        const cam = new Camera();
        const world = new World(cam);
        $('#mainGameCanvas').css('display', 'block');
        $('#mainGameCanvas').css('visibility', 'visible');
        $('.continue-button').css('display', 'none');
    }
}