import * as THREE from 'three';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './jsm/postprocessing/OutputPass.js';

export class GlowRenderer{
    constructor(renderer, scene, camera, threshold, strength, radius, exposure){
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        const BLOOM_SCENE = 1;
        this.bloomLayer = new THREE.Layers();
        this.bloomLayer.set( BLOOM_SCENE );
        
        this.renderer.toneMappingExposure = Math.pow( exposure, 4.0 );
        
        const renderScene = new RenderPass( this.scene, this.camera );
        
        this.darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
        this.materials = {};
        
        const VERTEXSHADER = `
        varying vec2 vUv;
        
        void main() {
        
            vUv = uv;
        
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        
        }`
        
        const FRAGMENTSHADER = `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        
        varying vec2 vUv;
        
        void main() {
        
            gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
        
        }`

        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = threshold;
        bloomPass.strength = strength;
        bloomPass.radius = radius;
        
        this.bloomComposer = new EffectComposer( this.renderer );
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass( renderScene );
        this.bloomComposer.addPass( bloomPass );
        
        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: VERTEXSHADER,
                fragmentShader: FRAGMENTSHADER,
                defines: {}
            } ), 'baseTexture'
        );
        mixPass.needsSwap = true;
        
        const outputPass = new OutputPass();
        
        this.finalComposer = new EffectComposer( this.renderer );
        this.finalComposer.addPass( renderScene );
        this.finalComposer.addPass( mixPass );
        this.finalComposer.addPass( outputPass );
        this.darkenNonBloomed = this.darkenNonBloomed.bind(this);
        this.restoreMaterial = this.restoreMaterial.bind(this);
    }
        
        
        
    render() {
        this.scene.traverse( this.darkenNonBloomed );
        this.bloomComposer.render();
        this.scene.traverse( this.restoreMaterial );
        this.finalComposer.render();
    
    }
        
        
    darkenNonBloomed( obj ) {
        if ( obj.isMesh && this.bloomLayer.test( obj.layers ) === false ) {
            this.materials[ obj.uuid ] = obj.material;
            obj.material = this.darkMaterial;
        }
    
    }

    restoreMaterial( obj ) {
        if ( this.materials[ obj.uuid ] ) {
            obj.material = this.materials[ obj.uuid ];
            delete this.materials[ obj.uuid ];
        }
    }
}