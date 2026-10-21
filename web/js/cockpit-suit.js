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
        this.xrHandChains = null;
        this.xrMixer = null;
        this.animationClip = null;
        this.xrControlPanel = null;
        this.xrButtons = [];
        this.xrLastPress = 0;
        this.onXRAction = null;
        this.baseSuitScale = new THREE.Vector3(1, 1, 1);

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
        this.loadModel('./assets/animated_floating_astronaut_in_space_suit_loop.glb');

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
                console.warn('Fallback loading legacy Sokol suit:', error);
                // Fallback to alias if needed
                loader.load(
                    './assets/franz_viehbocks_sokol_space_suit.glb',
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
        materials.forEach((definition, materialIndex) => {
            const legacy = definition?.extensions?.KHR_materials_pbrSpecularGlossiness;
            const textureIndex = legacy?.diffuseTexture?.index;
            if (textureIndex === undefined) return;
            gltf.parser.getDependency('texture', textureIndex).then(texture => {
                texture.colorSpace = THREE.SRGBColorSpace;
                this.suitModel.traverse(node => {
                    if (!node.isMesh || !node.material) return;
                    // GLTFLoader names generated materials material_0, material_1...
                    // Match the texture to its authored material instead of applying
                    // the first suit texture to every mesh.
                    const materialName = node.material.name || '';
                    if (materialName && materialName !== `material_${materialIndex}`) return;
                    node.material.map = texture;
                    node.material.color.set(0xffffff); // preserve authored scan colors
                    node.material.needsUpdate = true;
                    if (legacy.glossinessFactor !== undefined) {
                        node.material.roughness = 1.0 - legacy.glossinessFactor;
                    }
                });
            }).catch(error => console.warn(`Could not restore embedded suit texture ${materialIndex}:`, error));
        });
    }

    onModelLoaded(gltf) {
        this.suitModel = gltf.scene;
        this.restoreLegacyDiffuseTexture(gltf);
        if (gltf.animations && gltf.animations.length) {
            this.animationClip = gltf.animations[0];
            this.mixer = new THREE.AnimationMixer(this.suitModel);
            this.mixer.clipAction(this.animationClip).play();
        }

        // Calculate accurate bounding box
        const box = new THREE.Box3().setFromObject(this.suitModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        console.log('Animated astronaut GLB loaded:', size, 'Center:', center);

        // Center the mesh geometry within its parent container
        this.suitModel.position.x = -center.x;
        this.suitModel.position.y = -center.y;
        this.suitModel.position.z = -center.z;

        // Human life-size scale (~1.35m height for seated cosmonaut in Kazbek couch)
        const targetHeight = 1.72;
        const scale = targetHeight / (size.y || 1.86);
        this.suitBodyGroup.scale.set(scale, scale, scale);
        this.baseSuitScale.copy(this.suitBodyGroup.scale);

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
        console.log('Animated astronaut suit is ready for cockpit and WebXR.');
    }

    // Render the original GLB in the application's immersive XR framebuffer.
    // The main raymarcher still renders the 25-joint articulated gloves.
    renderXR(gl, canvas, xrView, xrViewport, active, time = 0, jointDataL = null, jointDataR = null) {
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
            this.buildXRControlPanel();

            this.xrBodyGroup = new THREE.Group();
            this.xrBodyGroup.add(this.suitModel.clone(true));
            this.xrBodyGroup.scale.copy(this.suitBodyGroup.scale);
            // The Sketchfab animation is authored as a close external showcase.
            // Reduce it for first-person use and leave clearance around the live
            // headset so the camera is not embedded in the helmet shell.
            this.xrBodyGroup.scale.multiplyScalar(0.42);
            this.xrScene.add(this.xrBodyGroup);
            if (this.animationClip) {
                this.xrMixer = new THREE.AnimationMixer(this.xrBodyGroup);
                this.xrMixer.clipAction(this.animationClip).play();
            }
            this.xrBodyGroup.updateMatrixWorld(true);
            this.xrHandChains = this.buildXRHandChains();
        }

        const breath = Math.sin(time * 0.0018) * 0.006;
        if (this.xrMixer) this.xrMixer.update(1 / 90);
        // Anchor the suit below and slightly behind the live headset pose.
        // This prevents the GLB from appearing as a giant floating helmet.
        const headMatrix = new THREE.Matrix4().fromArray(xrView.transform.matrix);
        const headPosition = new THREE.Vector3().setFromMatrixPosition(headMatrix);
        const headRotation = new THREE.Quaternion().setFromRotationMatrix(headMatrix);
        // WebXR owns the real eye pose; offset the avatar instead of moving the
        // headset camera.  A positive local Z puts the curled boots behind the
        // eyes, leaving the forward horizon/black hole unobstructed.  The lower
        // Y offset keeps the lap and boots visible only when the user looks down.
        const bodyOffset = new THREE.Vector3(0.0, -1.04 + breath, 0.16).applyQuaternion(headRotation);
        this.xrBodyGroup.position.copy(headPosition).add(bodyOffset);
        this.xrBodyGroup.quaternion.copy(headRotation);
        // The Sketchfab loop uses the opposite vertical convention to the
        // WebXR viewer. Flip the avatar once so its helmet is above the chest
        // and its legs/arms fall into the user's downward field of view.
        this.xrBodyGroup.rotateX(Math.PI);
        this.xrBodyGroup.rotateY(Math.PI);
        this.xrBodyGroup.updateMatrixWorld(true);
        this.updateXRControlPanel(headMatrix, jointDataL, jointDataR, time);
        if (this.xrHandChains && jointDataL && jointDataR) {
            this.retargetXRHand(this.xrHandChains.left, jointDataL, headMatrix);
            this.retargetXRHand(this.xrHandChains.right, jointDataR, headMatrix);
        }
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

    buildXRControlPanel() {
        this.xrControlPanel = new THREE.Group();
        const labels = [
            ['CINEMA', 'cinema'], ['SUIT', 'suit'], ['PLUNGE', 'plunge'], ['EXIT', 'exit']
        ];
        const makeLabel = (label) => {
            const c = document.createElement('canvas'); c.width = 256; c.height = 96;
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'rgba(5,12,24,.94)'; ctx.fillRect(2, 2, 252, 92);
            ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 252, 92);
            ctx.fillStyle = '#e9fbff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, 128, 48);
            return new THREE.CanvasTexture(c);
        };
        labels.forEach(([label, action], i) => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.20, .075), new THREE.MeshBasicMaterial({ map: makeLabel(label), transparent: true }));
            mesh.position.set((i - 1.5) * .23, 0, 0);
            mesh.userData.action = action;
            this.xrControlPanel.add(mesh); this.xrButtons.push(mesh);
        });
        this.xrControlPanel.visible = true;
        this.xrScene.add(this.xrControlPanel);
    }

    updateXRControlPanel(headMatrix, jointDataL, jointDataR, time) {
        if (!this.xrControlPanel) return;
        this.xrControlPanel.position.setFromMatrixPosition(headMatrix);
        this.xrControlPanel.quaternion.setFromRotationMatrix(headMatrix);
        this.xrControlPanel.position.add(new THREE.Vector3(0, .08, -.62).applyQuaternion(this.xrControlPanel.quaternion));
        this.xrControlPanel.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(this.xrControlPanel.matrixWorld).invert();
        const tips = [];
        for (const data of [jointDataL, jointDataR]) if (data) {
            const p = new THREE.Vector3(data[9 * 3], data[9 * 3 + 1], data[9 * 3 + 2]).applyMatrix4(headMatrix);
            tips.push(p.applyMatrix4(inv));
        }
        if (time - this.xrLastPress < 500) return;
        for (const tip of tips) for (const button of this.xrButtons) {
            if (tip.distanceTo(button.position) < .085) {
                this.xrLastPress = time;
                this.onXRAction?.(button.userData.action);
                return;
            }
        }
    }

    buildXRHandChains() {
        const findBone = (prefix) => {
            let found = null;
            this.xrBodyGroup.traverse(node => {
                if (!found && node.isBone && node.name.startsWith(prefix)) found = node;
            });
            return found;
        };
        const fingers = [
            ['thumb', 1, 2, 3, 4],
            ['index', 5, 6, 7, 8, 9],
            ['middle', 10, 11, 12, 13, 14],
            ['ring', 15, 16, 17, 18, 19],
            ['pinky', 20, 21, 22, 23, 24]
        ];
        const build = side => fingers.map(([name, ...jointIndices]) => {
            const bones = jointIndices.slice(0, -1).map((_, i) => findBone(`${side}_${name}_${i + 1}`)).filter(Boolean);
            return bones.length ? { bones, jointIndices } : null;
        }).filter(Boolean);
        const chains = { left: build('L'), right: build('R') };

        // Capture the asset's rest-pose world directions and rotations.
        for (const side of [chains.left, chains.right]) {
            for (const chain of side) {
                for (let i = 0; i < chain.bones.length; i++) {
                    const bone = chain.bones[i];
                    const child = chain.bones[i + 1] || bone.children.find(c => c.isBone);
                    if (!child) continue;
                    const a = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
                    const b = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
                    chain.rest = chain.rest || [];
                    chain.rest[i] = {
                        direction: b.sub(a).normalize(),
                        worldQuaternion: bone.getWorldQuaternion(new THREE.Quaternion())
                    };
                }
            }
        }
        return chains;
    }

    retargetXRHand(chains, jointData, headMatrix) {
        const points = new Map();
        for (const chain of chains) {
            for (const index of chain.jointIndices) {
                if (points.has(index)) continue;
                const worldPoint = new THREE.Vector3(
                    jointData[index * 3],
                    jointData[index * 3 + 1],
                    jointData[index * 3 + 2]
                ).applyMatrix4(headMatrix);
                // Bone rest directions are captured in avatar-local space.
                points.set(index, this.xrBodyGroup.worldToLocal(worldPoint));
            }
        }
        for (const chain of chains) {
            for (let i = 0; i < chain.bones.length; i++) {
                const a = points.get(chain.jointIndices[i]);
                const b = points.get(chain.jointIndices[i + 1]);
                const rest = chain.rest?.[i];
                if (!a || !b || !rest) continue;
                const targetDir = new THREE.Vector3().subVectors(b, a).normalize();
                const delta = new THREE.Quaternion().setFromUnitVectors(rest.direction, targetDir);
                const targetWorld = delta.multiply(rest.worldQuaternion.clone());
                const parentWorld = chain.bones[i].parent?.getWorldQuaternion(new THREE.Quaternion()).invert();
                chain.bones[i].quaternion.copy(parentWorld ? parentWorld.multiply(targetWorld) : targetWorld);
            }
        }
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
        if (this.mixer) {
            const dt = this.lastSuitTime ? Math.min(0.05, (time - this.lastSuitTime) * 0.001) : 1 / 60;
            this.mixer.update(Math.max(0, dt));
            this.lastSuitTime = time;
        }
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
            // The replacement animation is authored upright and already contains
            // its own floating pose; keep the chest/legs below the eye line.
            this.suitBodyGroup.scale.copy(this.baseSuitScale).multiplyScalar(0.42);
            this.suitBodyGroup.position.set(0.0, -1.04 + breath, 0.16);
            this.suitBodyGroup.rotation.set(Math.PI, Math.PI, 0.0);
        } else {
            // External EVA Cosmonaut View (floating against Gargantua in Orbit Cam):
            // Camera looks forward at (0, 0, 0)
            this.camera.position.set(0.0, 0.0, 0.0);
            this.camera.rotation.set(0, 0, 0);

            // Franz Viehböck floating gracefully in front of the camera:
            this.suitBodyGroup.scale.copy(this.baseSuitScale);
            this.suitBodyGroup.position.set(0.35 + mouseNormX * 0.08, -0.22 + floatWave, -1.8);
            // 3/4 angle facing camera with gentle zero-g tumbling rotation
            const tumble = Math.sin(time * 0.0008) * 0.12;
            this.suitBodyGroup.rotation.set(0.15 + tumble * 0.5, 0.35 + tumble, tumble * 0.3);
        }

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }
}
