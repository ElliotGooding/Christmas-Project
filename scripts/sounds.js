import * as THREE from 'three';

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();

export class Sound{
    constructor(soundPath){
        this.soundPath = soundPath;
        this.sound = null;
        // this.playSound();
    }

    playSound(){
        const sound = new THREE.PositionalAudio( listener );
        audioLoader.load( this.soundPath, function( buffer ) {
            sound.setBuffer( buffer );
            sound.setRefDistance( 20 );
            sound.play();
        });
        this.sound = sound;
    }
}

export class Ambience {
    constructor(soundPaths) {
        this.soundPaths = soundPaths;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.currentSoundIndex = 0;
        this.fadeDuration = 3; // Adjust as needed
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
    }

    fadeIn() {
        console.log("fade in")
        if (this.currentSoundIndex < this.soundPaths.length) {
            const audioElement = new Audio(this.soundPaths[this.currentSoundIndex]);
            const audioSource = this.audioContext.createMediaElementSource(audioElement);

            // Connect the audio source to the gain node
            audioSource.connect(this.gainNode);

            // Start playing the audio
            audioElement.play();

            // Gradually increase the gain for fade-in effect
            const currentTime = this.audioContext.currentTime;
            this.gainNode.gain.setValueAtTime(0, currentTime);
            this.gainNode.gain.linearRampToValueAtTime(0.5, currentTime + this.fadeDuration);

            // Schedule the next sound in the path to play after the fade-in
            audioElement.addEventListener('ended', () => {
                this.currentSoundIndex++;
                this.fadeIn();
            });
        }
    }

    fadeOut() {
        // Gradually decrease the gain for fade-out effect
        const currentTime = this.audioContext.currentTime;
        this.gainNode.gain.setValueAtTime(1, currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, currentTime + this.fadeDuration);

        // Stop playing the current sound after fade-out
        setTimeout(() => {
            this.gainNode.disconnect();
        }, this.fadeDuration * 1000);
    }
}