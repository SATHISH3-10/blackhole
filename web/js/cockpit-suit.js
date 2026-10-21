// web/js/cockpit-suit.js
// Authentic Franz Viehböck Sokol-KV2 Space Suit 3D Cockpit & EVA Layer
// Uses exact Sketchfab GLB: franz_viehbocks_sokol_space_suit.glb
// Powered by Three.js & WebGL2

import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';

export class CockpitSuitLayer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`CockpitSuitLayer: Canvas #${canvasId} not found.`);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.suitModel = null;
        this.isLoaded = false;
        this.isLoading = false;

        // Spacecraft cockpit anchor & body groups
        this.cockpitAnchor = null;
        this.suitBodyGroup = null;

        // Dynamic State
        this.active = false;
        this.viewMode = 'first-person'; // 'first-person' or 'external-eva'
        this.showHandRig = false; // False by default so the authentic suit gloves are visible without distracting bare yellow spheres
        this.prevWidth = 0;
        this.prevHeight = 0;
        this.xrScene = null;
        this.xrCamera = null;
        this.xrRenderer = null;
        this.xrBodyGroup = null;

        this.init();
    }

    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Three.js Scene
        this.scene = new THREE.Scene();

        // 2. Perspective Camera (Matches main simulation FOV)
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.05, 50);
        this.camera.position.set(0, 0, 0);

        // 3. Transparent WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // 4. Cockpit Lighting matching Gargantua's Accretion Disk
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(ambientLight);

        // Main Accretion Disk Key Light (Warm golden-amber glow)
        this.keyLight = new THREE.DirectionalLight(0xffcc66, 2.0);
        this.keyLight.position.set(2.0, 3.0, 1.5);
        this.scene.add(this.keyLight);

        // Cockpit Instrument Fill Light (Cyan HUD glow from below)
        const instrumentLight = new THREE.DirectionalLight(0x00e5ff, 0.9);
        instrumentLight.position.set(-1.5, -1.5, 1.5);
        this.scene.add(instrumentLight);

        // Front Rim Light for authentic fabric texture highlights
        const frontLight = new THREE.DirectionalLight(0xffeedd, 1.0);
        frontLight.position.set(0, 1.0, 2.0);
        this.scene.add(frontLight);

        // 5. Cockpit Hierarchy
        this.cockpitAnchor = new THREE.Group();
        this.scene.add(this.cockpitAnchor);

        this.suitBodyGroup = new THREE.Group();
        this.cockpitAnchor.add(this.suitBodyGroup);

        // 6. Load Franz Viehböck's Sokol Space Suit GLB
        this.loadModel('./assets/franz_viehbocks_sokol_space_suit.glb');

        window.addEventListener('resize', () => this.onResize());
    }

    loadModel(url) {
        if (this.isLoading) return;
        this.isLoading = true;

        const loader = new GLTFLoader();
        loader.load(
            url,
            (gltf) => {
                this.onModelLoaded(gltf);
            },
            undefined,
            (error) => {
                console.warn('Fallback loading ./assets/sokol_space_suit.glb:', error);
                // Fallback to alias if needed
                loader.load(
                    './assets/sokol_space_suit.glb',
                    (gltfFallback) => {
                        this.onModelLoaded(gltfFallback);
                    },
                    undefined,
                    (err2) => {
                        console.error('Failed to load Sokol suit GLB:', err2);
                        this.isLoading = false;
                    }
                );
            }
        );
    }

    restoreLegacyDiffuseTexture(gltf) {
        const materials = gltf.parser?.json?.materials || [];
        const legacy = materials[0]?.extensions?.KHR_materials_pbrSpecularGlossiness;
        const textureIndex = legacy?.diffuseTexture?.index;
        if (textureIndex === undefined) return;

        gltf.parser.getDependency('texture', textureIndex).then(texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            this.suitModel.traverse(node => {
                if (!node.isMesh || !node.material) return;
                node.material.map = texture;
                node.material.color.set(0xffffff); // preserve scan colors
                node.material.needsUpdate = true;
                if (legacy.glossinessFactor !== undefined) {
                    node.material.roughness = 1.0 - legacy.glossinessFactor;
                }
            });
        }).catch(error => console.warn('Could not restore embedded Sokol texture:', error));
    }

    onModelLoaded(gltf) {
        this.suitModel = gltf.scene;
        this.restoreLegacyDiffuseTexture(gltf);

        // Calculate accurate bounding box
        const box = new THREE.Box3().setFromObject(this.suitModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log('Franz Viehböck Sokol GLB Loaded:', size, 'Center:', center);

        // Center the mesh geometry within its parent container
        this.suitModel.position.x = -center.x;
        this.suitModel.position.y = -center.y;
        this.suitModel.position.z = -center.z;

        // Human life-size scale (~1.35m height for seated cosmonaut in Kazbek couch)
        const targetHeight = 1.35;
        const scale = targetHeight / (size.y || 1.86);
        this.suitBodyGroup.scale.set(scale, scale, scale);

        // Enable PBR textures, fabric roughness & double-sided rendering
        this.suitModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const partName = (child.name + ' ' + (child.material?.name || '')).toLowerCase();
                // The first-person camera is inside the helmet. Do not render
                // the opaque shell around the camera; keep only a subtle visor.
                if (/helmet/.test(partName) && !/visor|glass|lens/.test(partName)) {
                    child.visible = false;
                }
                if (child.material) {
                    child.material.roughness = 0.55;
                    child.material.metalness = 0.15;
                    child.material.side = THREE.DoubleSide;
                    // Tint both textured and untextured meshes. GLB textures
                    // remain active, but the base color restores recognizable
                    // Sokol-KV2 fabric/blue/charcoal accents in the preview.
                    if (child.material.color) {
                        const n = (child.name + ' ' + (child.material.name || '')).toLowerCase();
                        if (/visor|glass|lens/.test(n)) child.material.color.set(0x314755);
                        else if (/blue|stripe|band|patch/.test(n)) child.material.color.set(0x24527a);
                        else if (/rubber|boot|glove|seal/.test(n)) child.material.color.set(0x353b42);
                        else child.material.color.set(0x6f899a); // cool EVA fabric
                    }
                    if (/visor|glass|lens/.test(partName)) {
                        child.material.transparent = true;
                        child.material.opacity = 0.14;
                        child.material.depthWrite = false;
                        child.material.side = THREE.FrontSide;
                    }
                }
            }
        });

        this.suitBodyGroup.add(this.suitModel);
        this.isLoaded = true;
        this.isLoading = false;
        console.log('Franz Viehböck Sokol Space Suit is ready in Cockpit & EVA view!');
    }

    // Render the original GLB in the application's immersive XR framebuffer.
    // The main raymarcher still renders the 25-joint articulated gloves.
    renderXR(gl, canvas, xrView, xrViewport, active, time = 0) {
        if (!active || !this.isLoaded) return;

        if (!this.xrRenderer) {
            this.xrScene = new THREE.Scene();
            this.xrCamera = new THREE.PerspectiveCamera();
            this.xrRenderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false, powerPreference: 'high-performance' });
            this.xrRenderer.autoClear = false;
            this.xrRenderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.xrRenderer.toneMappingExposure = 1.0;
            this.xrRenderer.outputColorSpace = THREE.SRGBColorSpace;

            const ambient = new THREE.AmbientLight(0xffffff, 0.85);
            const key = new THREE.DirectionalLight(0xffcc66, 1.8);
            key.position.set(2, 3, 1.5);
            const fill = new THREE.DirectionalLight(0x00e5ff, 0.7);
            fill.position.set(-1.5, -1, 1.5);
            this.xrScene.add(ambient, key, fill);

            this.xrBodyGroup = new THREE.Group();
            this.xrBodyGroup.add(this.suitModel.clone(true));
            this.xrBodyGroup.scale.copy(this.suitBodyGroup.scale);
            this.xrScene.add(this.xrBodyGroup);
        }

        const breath = Math.sin(time * 0.0018) * 0.006;
        // Anchor the suit below and slightly behind the live headset pose.
        // This prevents the GLB from appearing as a giant floating helmet.
        const headMatrix = new THREE.Matrix4().fromArray(xrView.transform.matrix);
        const headPosition = new THREE.Vector3().setFromMatrixPosition(headMatrix);
        const headRotation = new THREE.Quaternion().setFromRotationMatrix(headMatrix);
        const bodyOffset = new THREE.Vector3(0, -0.72 + breath, -0.22).applyQuaternion(headRotation);
        this.xrBodyGroup.position.copy(headPosition).add(bodyOffset);
        this.xrBodyGroup.quaternion.copy(headRotation);
        this.xrBodyGroup.rotateY(Math.PI);
        this.xrCamera.projectionMatrix.fromArray(xrView.projectionMatrix);
        this.xrCamera.projectionMatrixInverse.copy(this.xrCamera.projectionMatrix).invert();
        // Use the headset's real pose directly. Head rotation and positional
        // movement now drive the view without an artificial camera offset.
        this.xrCamera.matrixWorld.fromArray(xrView.transform.matrix);
        this.xrCamera.matrix.copy(this.xrCamera.matrixWorld);
        this.xrCamera.matrixWorldInverse.copy(this.xrCamera.matrixWorld).invert();
        this.xrCamera.matrixAutoUpdate = false;

        // Preserve the raymarched colour buffer and clear only its depth.
        this.xrRenderer.state.reset();
        this.xrRenderer.setViewport(xrViewport.x, xrViewport.y, xrViewport.width, xrViewport.height);
        this.xrRenderer.setScissor(xrViewport.x, xrViewport.y, xrViewport.width, xrViewport.height);
        this.xrRenderer.setScissorTest(true);
        this.xrRenderer.clearDepth();
        this.xrRenderer.render(this.xrScene, this.xrCamera);
        this.xrRenderer.setScissorTest(false);
        this.xrRenderer.state.reset();
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (width === this.prevWidth && height === this.prevHeight) return;

        this.prevWidth = width;
        this.prevHeight = height;

        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        }
    }

    update(params) {
        const {
            active,
            fov,
            cameraMode = 'pov',
            pitch = 0.0,
            yaw = 0.0,
            isDragging = false,
            mouseNormX = 0.0,
            mouseNormY = 0.0,
            time = 0,
            isVR = false
        } = params;

        this.active = active;

        if (!this.active || !this.isLoaded) {
            if (this.canvas.style.display !== 'none') {
                this.canvas.style.display = 'none';
            }
            return;
        }

        if (this.canvas.style.display !== 'block') {
            this.canvas.style.display = 'block';
        }

        // Synchronize camera FOV
        if (fov && this.camera.fov !== fov) {
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();
        }

        // Determine view mode:
        // In Orbit Cam mode with Cockpit enabled -> show Franz Viehböck in EVA floating in front of Gargantua!
        // In POV mode -> show First-Person cockpit view (looking down at your own suit chest, patches, and arms)!
        const isFirstPerson = cameraMode === 'pov' || isVR;

        const breath = Math.sin(time * 0.0018) * 0.006;
        const floatWave = Math.sin(time * 0.0012) * 0.015;

        if (isFirstPerson) {
            // First-person cockpit embodiment:
            // Camera rotates with head/mouse look.
            // Suit body is anchored in the spacecraft seat.
            this.camera.position.set(0.0, 0.22, 0.0);
            this.camera.rotation.set(pitch, yaw, 0.0, 'YXZ');

            // Suit body position & rotation:
            // Turned 180° around Y (Math.PI) so front of suit points along -Z (the direction camera looks)
            // Positioned slightly forward and below eye level:
            this.suitBodyGroup.position.set(0.0, -0.42 + breath, -0.48);
            this.suitBodyGroup.rotation.set(-0.25, Math.PI, 0.0); // 15° recline of the Kazbek couch
        } else {
            // External EVA Cosmonaut View (floating against Gargantua in Orbit Cam):
            // Camera looks forward at (0, 0, 0)
            this.camera.position.set(0.0, 0.0, 0.0);
            this.camera.rotation.set(0, 0, 0);

            // Franz Viehböck floating gracefully in front of the camera:
            this.suitBodyGroup.position.set(0.35 + mouseNormX * 0.08, -0.22 + floatWave, -1.8);
            // 3/4 angle facing camera with gentle zero-g tumbling rotation
            const tumble = Math.sin(time * 0.0008) * 0.12;
            this.suitBodyGroup.rotation.set(0.15 + tumble * 0.5, 0.35 + tumble, tumble * 0.3);
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }
}
