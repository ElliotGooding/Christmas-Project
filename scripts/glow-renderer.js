import * as THREE from 'three';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './jsm/postprocessing/OutputPass.js';

export class GlowRenderer{
    constructor(renderer, scene, camera, threshold, strength, radius, exposure){
        //Initalise properties
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        //Define bloom layer
        const BLOOM_SCENE = 1; 
        this.bloomLayer = new THREE.Layers();
        this.bloomLayer.set( BLOOM_SCENE );
        
        //sex exposure
        this.renderer.toneMappingExposure = Math.pow( exposure, 4.0 );
        
        //Create render pass with scene and camera
        const renderScene = new RenderPass( this.scene, this.camera );
        
        //Create dark material for non-bloomed objects
        this.darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
        this.materials = {};
        
        //Define shaders
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

        //Create bloom pass
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = threshold;
        bloomPass.strength = strength;
        bloomPass.radius = radius;
        
        //Create bloom composer
        this.bloomComposer = new EffectComposer( this.renderer );
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass( renderScene );
        this.bloomComposer.addPass( bloomPass );
        
        //Create mix pass with shaders
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
        
        //Create output pass
        const outputPass = new OutputPass();
        
        //Create final composer
        this.finalComposer = new EffectComposer( this.renderer );
        this.finalComposer.addPass( renderScene );
        this.finalComposer.addPass( mixPass );
        this.finalComposer.addPass( outputPass );

        //Bind methods
        this.darkenNonBloomed = this.darkenNonBloomed.bind(this);
        this.restoreMaterial = this.restoreMaterial.bind(this);
    }
        
        
        
    render() {
        // Darken non-bloomed objects, render bloom, restore materials, render final image
        this.scene.traverse( this.darkenNonBloomed );
        this.bloomComposer.render();
        this.scene.traverse( this.restoreMaterial );
        this.finalComposer.render();
    
    }
        
        
    darkenNonBloomed( obj ) {
        //If object is a mesh and not in bloom layer, darken it
        if ( obj.isMesh && this.bloomLayer.test( obj.layers ) === false ) {
            this.materials[ obj.uuid ] = obj.material;
            obj.material = this.darkMaterial;
        }
    
    }

    restoreMaterial( obj ) {
        //Restore darkened materials
        if ( this.materials[ obj.uuid ] ) {
            obj.material = this.materials[ obj.uuid ];
            delete this.materials[ obj.uuid ];
        }
    }
}