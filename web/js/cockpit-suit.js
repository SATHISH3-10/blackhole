// web/js/cockpit-suit.js
// Authentic Franz Viehböck Sokol-KV2 Space Suit 3D Cockpit & Hand Tracking Layer
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

        // Spacecraft cockpit anchor
        this.cockpitAnchor = null;
        this.suitBodyGroup = null;

        // 25-Joint Articulated Flight Gloves
        this.gloveGroupL = null;
        this.gloveGroupR = null;
        this.jointsL = [];
        this.bonesL = [];
        this.jointsR = [];
        this.bonesR = [];

        // Dynamic State
        this.active = false;
        this.prevWidth = 0;
        this.prevHeight = 0;

        this.init();
    }

    init() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // 1. Three.js Scene
        this.scene = new THREE.Scene();

        // 2. Perspective Camera (Matches main simulation FOV)
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.02, 50);
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
        this.renderer.toneMappingExposure = 1.25;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // 4. Cockpit Lighting matching Gargantua's Accretion Disk
        const ambientLight = new THREE.AmbientLight(0x1a2436, 1.0);
        this.scene.add(ambientLight);

        // Main Accretion Disk Key Light (Warm golden-amber glow)
        this.keyLight = new THREE.DirectionalLight(0xffb844, 3.2);
        this.keyLight.position.set(1.5, 2.5, 1.0);
        this.scene.add(this.keyLight);

        // Cockpit Instrument Fill Light (Cyan HUD glow from below)
        const instrumentLight = new THREE.DirectionalLight(0x00e5ff, 1.4);
        instrumentLight.position.set(-1.0, -1.5, 1.5);
        this.scene.add(instrumentLight);

        // Subtle Top Light for Helmet Collar Glint
        const topLight = new THREE.PointLight(0xffffff, 1.2, 5.0);
        topLight.position.set(0, 1.0, 0.2);
        this.scene.add(topLight);

        // 5. Cockpit Hierarchy
        this.cockpitAnchor = new THREE.Group();
        this.scene.add(this.cockpitAnchor);

        this.suitBodyGroup = new THREE.Group();
        this.cockpitAnchor.add(this.suitBodyGroup);

        // 6. Build 25-Joint Articulated Flight Gloves
        this.buildGloves();

        // 7. Load Franz Viehböck's Sokol Space Suit GLB
        this.loadModel('./assets/sokol_space_suit.glb');

        window.addEventListener('resize', () => this.onResize());
    }

    buildGloves() {
        // Glove PBR Material matching Sokol white nylon canvas
        const gloveFabricMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeea,
            roughness: 0.65,
            metalness: 0.12
        });

        // High-friction silicone palm grip material
        const gloveGripMat = new THREE.MeshStandardMaterial({
            color: 0x1b2838,
            roughness: 0.85,
            metalness: 0.05
        });

        // Holographic Cybernetic Joint Nodes (Gold)
        const jointMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xff9900,
            roughness: 0.2,
            metalness: 0.9
        });

        // Holographic Kinematic Bone Cylinders (Cyan)
        const boneMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0077aa,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.75
        });

        const jointGeo = new THREE.SphereGeometry(0.0055, 10, 10);
        const boneGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 8);

        // Kinematic bone hierarchy connections for 25 joints
        this.boneConnections = [
            // Thumb: wrist(0) -> 1 -> 2 -> 3 -> 4
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index: wrist(0) -> 5 -> 6 -> 7 -> 8 -> 9
            [0, 5], [5, 6], [6, 7], [7, 8], [8, 9],
            // Middle: wrist(0) -> 10 -> 11 -> 12 -> 13 -> 14
            [0, 10], [10, 11], [11, 12], [12, 13], [13, 14],
            // Ring: wrist(0) -> 15 -> 16 -> 17 -> 18 -> 19
            [0, 15], [15, 16], [16, 17], [17, 18], [18, 19],
            // Pinky: wrist(0) -> 20 -> 21 -> 22 -> 23 -> 24
            [0, 20], [20, 21], [21, 22], [22, 23], [23, 24]
        ];

        // Left Glove
        this.gloveGroupL = new THREE.Group();
        this.jointsL = [];
        this.bonesL = [];
        for (let i = 0; i < 25; i++) {
            const jMesh = new THREE.Mesh(jointGeo, jointMat);
            this.gloveGroupL.add(jMesh);
            this.jointsL.push(jMesh);
        }
        for (let i = 0; i < this.boneConnections.length; i++) {
            const bMesh = new THREE.Mesh(boneGeo, boneMat);
            this.gloveGroupL.add(bMesh);
            this.bonesL.push(bMesh);
        }
        this.cockpitAnchor.add(this.gloveGroupL);

        // Right Glove
        this.gloveGroupR = new THREE.Group();
        this.jointsR = [];
        this.bonesR = [];
        for (let i = 0; i < 25; i++) {
            const jMesh = new THREE.Mesh(jointGeo, jointMat);
            this.gloveGroupR.add(jMesh);
            this.jointsR.push(jMesh);
        }
        for (let i = 0; i < this.boneConnections.length; i++) {
            const bMesh = new THREE.Mesh(boneGeo, boneMat);
            this.gloveGroupR.add(bMesh);
            this.bonesR.push(bMesh);
        }
        this.cockpitAnchor.add(this.gloveGroupR);
    }

    loadModel(url) {
        if (this.isLoading) return;
        this.isLoading = true;

        const loader = new GLTFLoader();
        loader.load(
            url,
            (gltf) => {
                this.suitModel = gltf.scene;

                // Scale millimeter photogrammetry scan into meters (0.001)
                this.suitModel.scale.set(0.001, 0.001, 0.001);

                // Authentic Kazbek Couch Seated Cosmonaut Alignment:
                // Helmet center: ~[147, 714, -374] mm.
                // Reclined posture: offset so astronaut's eyes are at origin looking forward
                this.suitModel.position.set(-0.147, -0.680, -0.220);
                this.suitModel.rotation.set(-0.18, 0.0, 0.0); // Slight 10° recline of the couch

                // Enable PBR textures, fabric roughness & double-sided rendering
                this.suitModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.material) {
                            child.material.roughness = 0.62;
                            child.material.metalness = 0.15;
                            child.material.side = THREE.DoubleSide;
                        }
                    }
                });

                this.suitBodyGroup.add(this.suitModel);
                this.isLoaded = true;
                this.isLoading = false;
                console.log('Authentic Sokol Space Suit loaded into Cockpit layer!');
            },
            undefined,
            (error) => {
                console.error('CockpitSuitLayer: Failed to load GLB model:', error);
                this.isLoading = false;
            }
        );
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
            pitch = 0.0,
            yaw = 0.0,
            isDragging = false,
            mouseNormX = 0.0,
            mouseNormY = 0.0,
            time = 0,
            isVR = false,
            jointDataL = null,
            jointDataR = null
        } = params;

        this.active = active;

        if (!this.active) {
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

        // Camera Pitch & Yaw:
        // The camera rotates freely with head / mouse look.
        // The suit body stays seated in the spacecraft, giving the realistic feeling of looking down at your suit.
        this.camera.rotation.set(pitch, yaw, 0.0, 'YXZ');

        // Subtle zero-g cosmonaut breathing & heartbeat motion
        const breath = Math.sin(time * 0.0018) * 0.004;
        const heart = Math.sin(time * 0.0075) * 0.001;
        if (this.suitBodyGroup) {
            this.suitBodyGroup.position.set(0.0, breath + heart, 0.0);
        }

        // Update 25-Joint Kinematics for Both Flight Gloves
        this.updateGlovePoses(time, isDragging, mouseNormX, mouseNormY, isVR, jointDataL, jointDataR);

        // Render Frame
        this.renderer.render(this.scene, this.camera);
    }

    updateGlovePoses(time, isDragging, mouseNormX, mouseNormY, isVR, jointDataL, jointDataR) {
        // Base Left Hand position: resting on Soyuz attitude controller console
        const baseL = new THREE.Vector3(-0.24, -0.36, -0.38);
        // Base Right Hand position: active hand tracking mouse or VR optical tracking
        const baseR = new THREE.Vector3(
            0.22 + mouseNormX * 0.18,
            -0.34 + mouseNormY * 0.15,
            -0.36 + Math.abs(mouseNormX) * -0.05
        );

        const flexL = Math.sin(time * 0.002) * 0.004;
        const pinchR = isDragging ? 0.024 : Math.max(0, Math.sin(time * 0.003)) * 0.006;
        const flexR = isDragging ? 0.020 : 0.0;

        // Generate 25 Joints for Left Glove
        const positionsL = this.compute25JointPositions(baseL, flexL, 0.0, true);
        this.applyJointsToGroup(positionsL, this.jointsL, this.bonesL);

        // Generate 25 Joints for Right Glove (Driven by Mouse / VR)
        const positionsR = this.compute25JointPositions(baseR, flexR, pinchR, false);
        this.applyJointsToGroup(positionsR, this.jointsR, this.bonesR);
    }

    compute25JointPositions(base, flex, pinch, isLeft) {
        const sign = isLeft ? -1.0 : 1.0;
        return [
            // 0: Wrist
            base.clone(),
            // 1..4: Thumb (Carpometacarpal -> Proximal -> Interphalangeal -> Tip)
            base.clone().add(new THREE.Vector3(sign * 0.016, 0.008, 0.012)),
            base.clone().add(new THREE.Vector3(sign * (0.028 - pinch * 0.6), 0.016, 0.024)),
            base.clone().add(new THREE.Vector3(sign * (0.038 - pinch * 1.2), 0.022, 0.036)),
            base.clone().add(new THREE.Vector3(sign * (0.044 - pinch * 1.8), 0.026, 0.046)),
            // 5..9: Index (MCP -> Proximal -> Intermediate -> Distal -> Tip)
            base.clone().add(new THREE.Vector3(sign * 0.014, 0.012, 0.030)),
            base.clone().add(new THREE.Vector3(sign * (0.020 - flex * 0.8), 0.020 - flex * 0.5, 0.044)),
            base.clone().add(new THREE.Vector3(sign * (0.024 - flex * 1.2), 0.026 - flex * 1.0, 0.058)),
            base.clone().add(new THREE.Vector3(sign * (0.026 - flex * 1.6), 0.030 - flex * 1.4, 0.070)),
            base.clone().add(new THREE.Vector3(sign * (0.028 - pinch * 1.8), 0.032 - pinch * 1.0, 0.080)),
            // 10..14: Middle
            base.clone().add(new THREE.Vector3(sign * 0.000, 0.012, 0.030)),
            base.clone().add(new THREE.Vector3(sign * (0.002 - flex * 0.9), 0.022 - flex * 0.6, 0.046)),
            base.clone().add(new THREE.Vector3(sign * (0.003 - flex * 1.3), 0.029 - flex * 1.1, 0.062)),
            base.clone().add(new THREE.Vector3(sign * (0.004 - flex * 1.7), 0.034 - flex * 1.5, 0.076)),
            base.clone().add(new THREE.Vector3(sign * (0.005 - flex * 2.0), 0.038 - flex * 1.8, 0.086)),
            // 15..19: Ring
            base.clone().add(new THREE.Vector3(sign * -0.014, 0.010, 0.028)),
            base.clone().add(new THREE.Vector3(sign * (-0.014 - flex * 1.0), 0.020 - flex * 0.7, 0.044)),
            base.clone().add(new THREE.Vector3(sign * (-0.015 - flex * 1.4), 0.027 - flex * 1.2, 0.058)),
            base.clone().add(new THREE.Vector3(sign * (-0.016 - flex * 1.8), 0.032 - flex * 1.6, 0.070)),
            base.clone().add(new THREE.Vector3(sign * (-0.017 - flex * 2.1), 0.035 - flex * 1.9, 0.080)),
            // 20..24: Pinky
            base.clone().add(new THREE.Vector3(sign * -0.024, 0.008, 0.024)),
            base.clone().add(new THREE.Vector3(sign * (-0.026 - flex * 1.1), 0.016 - flex * 0.8, 0.038)),
            base.clone().add(new THREE.Vector3(sign * (-0.028 - flex * 1.5), 0.022 - flex * 1.3, 0.050)),
            base.clone().add(new THREE.Vector3(sign * (-0.029 - flex * 1.9), 0.027 - flex * 1.7, 0.060)),
            base.clone().add(new THREE.Vector3(sign * (-0.030 - flex * 2.2), 0.030 - flex * 2.0, 0.068))
        ];
    }

    applyJointsToGroup(positions, jointMeshes, boneMeshes) {
        // Position spherical joint nodes
        for (let i = 0; i < 25; i++) {
            if (jointMeshes[i]) {
                jointMeshes[i].position.copy(positions[i]);
            }
        }

        // Orient and scale connecting bone cylinders
        for (let i = 0; i < this.boneConnections.length; i++) {
            const [pIdx, cIdx] = this.boneConnections[i];
            const p1 = positions[pIdx];
            const p2 = positions[cIdx];
            const bone = boneMeshes[i];

            if (bone) {
                const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
                bone.position.copy(mid);

                const dist = p1.distanceTo(p2);
                bone.scale.set(1, Math.max(0.001, dist), 1);
                bone.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3().subVectors(p2, p1).normalize()
                );
            }
        }
    }
}
