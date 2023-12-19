import {World as World} from './world.js'
import {Camera as Camera} from './camera.js'
import {Character as Character} from './character.js'


setTimeout(() => {
    const cam = new Camera()
    const wrld = new World(cam)
}, 2000);



//Hides pointer on click
document.addEventListener("click", function(){
    document.body.requestPointerLock();
})