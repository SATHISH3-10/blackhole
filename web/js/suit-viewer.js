// web/js/suit-viewer.js
// Interactive 3D Photogrammetry Inspector for Franz Viehböck's Sokol Space Suit
// Powered by Three.js & WebGL2

import * as THREE from './lib/three.module.js';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { OrbitControls } from './lib/OrbitControls.js';

export class SokolSuitViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`SokolSuitViewer: Container #${containerId} not found`);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.suitModel = null;
        this.animFrameId = null;
        this.isInitialized = false;
        this.isLoading = false;

        // Visual / Render Modes
        this.renderMode = 'pbr'; // 'pbr', 'hologram', 'xray'
        this.showWireframe = false;
        this.showHandRig = false;
        this.autoRotate = true;

        // Camera Transition Interpolation
        this.targetCamPos = null;
        this.targetLookAt = null;
        this.currentLookAt = new THREE.Vector3(0, 0, 0);

        // Hand Skeleton Rig Group
        this.handRigGroup = null;
        this.handJointMeshes = [];
        this.handBoneMeshes = [];

        // Materials Cache
        this.originalMaterials = new Map();
        this.hologramMaterial = null;
        this.xrayMaterial = null;
        this.wireframeMaterial = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 640;
        const height = this.container.clientHeight || 480;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = null; // Transparent background for sci-fi HUD glassmorphism

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50);
        this.camera.position.set(0, 0.35, 2.2);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        // 4. Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = this.autoRotate;
        this.controls.autoRotateSpeed = 1.4;
        this.controls.minDistance = 0.3;
        this.controls.maxDistance = 6.0;
        this.controls.target.set(0, 0, 0);

        // 5. Lighting Setup (Accretion Disk + Space Cockpit illumination)
        const ambientLight = new THREE.AmbientLight(0xddeeff, 0.85);
        this.scene.add(ambientLight);

        // Main Key Light (Soft White)
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(2, 3, 2.5);
        this.scene.add(keyLight);

        // Fill Light (Subtle Cyan Space Reflection)
        const fillLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
        fillLight.position.set(-2.5, 1, 1.5);
        this.scene.add(fillLight);

        // Rim Light (Warm Golden Glow from Gargantua's Accretion Disk)
        const rimLight = new THREE.DirectionalLight(0xffaa22, 2.5);
        rimLight.position.set(0, -1.5, -3);
        this.scene.add(rimLight);

        // Subtle Top Light for Helmet Visor Glint
        const topLight = new THREE.PointLight(0xffffff, 1.5, 4);
        topLight.position.set(0, 1.8, 0.5);
        this.scene.add(topLight);

        // 6. Hologram & X-Ray Materials
        this.createSpecialMaterials();

        // 7. Hand Tracking 25-Joint Skeletal Overlay
        this.createHandRig();

        // 8. Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());

        this.isInitialized = true;
        this.animate = this.animate.bind(this);
        this.animate();

        // Load 3D Franz Viehböck Sokol Space Suit Model
        this.loadModel('./assets/franz_viehbocks_sokol_space_suit.glb');
    }

    createSpecialMaterials() {
        // Sci-Fi Glowing Hologram Material
        this.hologramMaterial = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x005577,
            roughness: 0.2,
            metalness: 0.8,
            wireframe: false,
            transparent: true,
            opacity: 0.82
        });

        // X-Ray / Biometric Scanner Material
        this.xrayMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00ff9d,
            emissive: 0x003322,
            roughness: 0.1,
            transmission: 0.7,
            thickness: 0.5,
            transparent: true,
            opacity: 0.65
        });

        // Wireframe Overlay Material
        this.wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
    }

    createHandRig() {
        this.handRigGroup = new THREE.Group();
        this.handRigGroup.visible = false;

        // Joint Material (Glowing Gold/Cyan spheres)
        const jointMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffaa00,
            roughness: 0.2,
            metalness: 0.9
        });

        // Bone Material (Cyan connecting links)
        const boneMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0088cc,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });

        const jointGeo = new THREE.SphereGeometry(0.006, 12, 12);
        const boneGeo = new THREE.CylinderGeometry(0.0025, 0.0025, 1, 8);

        // 25 Standard Joints for Right Glove (wrist, thumb 1-4, index 5-9, middle 10-14, ring 15-19, pinky 20-24)
        for (let i = 0; i < 25; i++) {
            const jointMesh = new THREE.Mesh(jointGeo, jointMat);
            this.handRigGroup.add(jointMesh);
            this.handJointMeshes.push(jointMesh);
        }

        // Bones connecting kinematic parent-child chains
        const connections = [
            // Thumb
            [0, 1], [1, 2], [2, 3], [3, 4],
            // Index
            [0, 5], [5, 6], [6, 7], [7, 8], [8, 9],
            // Middle
            [0, 10], [10, 11], [11, 12], [12, 13], [13, 14],
            // Ring
            [0, 15], [15, 16], [16, 17], [17, 18], [18, 19],
            // Pinky
            [0, 20], [20, 21], [21, 22], [22, 23], [23, 24]
        ];

        this.boneConnections = connections;
        for (let i = 0; i < connections.length; i++) {
            const boneMesh = new THREE.Mesh(boneGeo, boneMat);
            this.handRigGroup.add(boneMesh);
            this.handBoneMeshes.push(boneMesh);
        }

        this.scene.add(this.handRigGroup);
    }

    updateHandRigKinematics(time) {
        if (!this.showHandRig || !this.handRigGroup.visible) return;

        // Anchor rig at the right glove location in the Sokol model (~[0.26, -0.16, 0.18])
        const base = new THREE.Vector3(0.24, -0.15, 0.22);
        const flex = Math.sin(time * 0.003) * 0.008;
        const pinch = Math.max(0, Math.sin(time * 0.002)) * 0.012;

        const jointPositions = [
            // 0: Wrist
            base.clone(),
            // 1..4: Thumb
            base.clone().add(new THREE.Vector3(0.015, 0.008, 0.012)),
            base.clone().add(new THREE.Vector3(0.026 - pinch, 0.018, 0.024)),
            base.clone().add(new THREE.Vector3(0.034 - pinch * 1.5, 0.025, 0.036)),
            base.clone().add(new THREE.Vector3(0.038 - pinch * 2.0, 0.030, 0.046)),
            // 5..9: Index
            base.clone().add(new THREE.Vector3(0.012, 0.012, 0.028)),
            base.clone().add(new THREE.Vector3(0.018 - flex, 0.022, 0.042)),
            base.clone().add(new THREE.Vector3(0.022 - flex * 1.3, 0.030, 0.055)),
            base.clone().add(new THREE.Vector3(0.024 - flex * 1.6, 0.036, 0.066)),
            base.clone().add(new THREE.Vector3(0.025 - pinch * 2.0, 0.040, 0.076)),
            // 10..14: Middle
            base.clone().add(new THREE.Vector3(0.000, 0.012, 0.028)),
            base.clone().add(new THREE.Vector3(0.002 - flex * 1.1, 0.024, 0.045)),
            base.clone().add(new THREE.Vector3(0.003 - flex * 1.4, 0.033, 0.060)),
            base.clone().add(new THREE.Vector3(0.004 - flex * 1.7, 0.040, 0.072)),
            base.clone().add(new THREE.Vector3(0.005 - flex * 2.0, 0.045, 0.082)),
            // 15..19: Ring
            base.clone().add(new THREE.Vector3(-0.012, 0.010, 0.026)),
            base.clone().add(new THREE.Vector3(-0.012 - flex * 1.2, 0.021, 0.042)),
            base.clone().add(new THREE.Vector3(-0.013 - flex * 1.5, 0.029, 0.055)),
            base.clone().add(new THREE.Vector3(-0.014 - flex * 1.8, 0.035, 0.066)),
            base.clone().add(new THREE.Vector3(-0.015 - flex * 2.1, 0.039, 0.075)),
            // 20..24: Pinky
            base.clone().add(new THREE.Vector3(-0.022, 0.008, 0.022)),
            base.clone().add(new THREE.Vector3(-0.024 - flex * 1.3, 0.017, 0.036)),
            base.clone().add(new THREE.Vector3(-0.026 - flex * 1.6, 0.024, 0.047)),
            base.clone().add(new THREE.Vector3(-0.027 - flex * 1.9, 0.029, 0.056)),
            base.clone().add(new THREE.Vector3(-0.028 - flex * 2.2, 0.033, 0.064))
        ];

        // Update joint positions
        for (let i = 0; i < 25; i++) {
            this.handJointMeshes[i].position.copy(jointPositions[i]);
        }

        // Update connecting bone cylinders
        for (let i = 0; i < this.boneConnections.length; i++) {
            const [pIdx, cIdx] = this.boneConnections[i];
            const p1 = jointPositions[pIdx];
            const p2 = jointPositions[cIdx];

            const bone = this.handBoneMeshes[i];
            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            bone.position.copy(mid);

            const dist = p1.distanceTo(p2);
            bone.scale.set(1, dist, 1);
            bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(p2, p1).normalize());
        }
    }

    loadModel(url) {
        if (this.isLoading) return;
        this.isLoading = true;

        const loadingElem = document.getElementById('suit-loading-indicator');
        if (loadingElem) loadingElem.style.display = 'flex';

        const loader = new GLTFLoader();
        loader.load(
            url,
            (gltf) => {
                this.suitModel = gltf.scene;
                this.restoreLegacyDiffuseTexture(gltf);

                // Center and normalize bounding box
                const box = new THREE.Box3().setFromObject(this.suitModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());

                // Reposition model to be perfectly centered at origin
                this.suitModel.position.x = -center.x;
                this.suitModel.position.y = -center.y + 0.15;
                this.suitModel.position.z = -center.z;

                // Cache original PBR materials and enable shadows
                this.suitModel.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            // Tune standard material properties for authentic fabric & metal appearance
                            node.material.roughness = 0.65;
                            node.material.metalness = 0.15;
                            node.material.side = THREE.DoubleSide;
                            // Apply a visible Sokol palette even when the
                            // legacy specular-glossiness extension is ignored.
                            if (node.material.color) {
                                const name = `${node.name} ${node.material.name || ''}`.toLowerCase();
                                if (/visor|glass|lens/.test(name)) node.material.color.set(0x314755);
                                else if (/blue|stripe|band|patch/.test(name)) node.material.color.set(0x24527a);
                                else if (/rubber|boot|glove|seal/.test(name)) node.material.color.set(0x353b42);
                                else node.material.color.set(0x6f899a); // cool EVA fabric
                            }
                            // Store the corrected PBR material so selecting
                            // the PBR chip does not restore the washed-out GLB.
                            this.originalMaterials.set(node, node.material.clone());
                        }
                    }
                });

                this.scene.add(this.suitModel);
                this.isLoading = false;

                if (loadingElem) loadingElem.style.display = 'none';
                console.log('Sokol Space Suit 3D Model Loaded Successfully!', size);
            },
            (xhr) => {
                const percent = Math.round((xhr.loaded / (xhr.total || 11249492)) * 100);
                const progressText = document.getElementById('suit-load-progress');
                if (progressText) progressText.innerText = `${percent}%`;
            },
            (error) => {
                console.error('Error loading Sokol GLB model:', error);
                this.isLoading = false;
                if (loadingElem) {
                    loadingElem.innerHTML = `<span style="color:#ff4444;">Failed to load 3D model: ${error.message}</span>`;
                }
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
                node.material.color.set(0xffffff);
                node.material.needsUpdate = true;
                if (legacy.glossinessFactor !== undefined) {
                    node.material.roughness = 1.0 - legacy.glossinessFactor;
                }
                this.originalMaterials.set(node, node.material.clone());
            });
        }).catch(error => console.warn('Could not restore embedded Sokol texture:', error));
    }

    setRenderMode(mode) {
        this.renderMode = mode;
        if (!this.suitModel) return;

        this.suitModel.traverse((node) => {
            if (node.isMesh) {
                if (mode === 'pbr') {
                    const orig = this.originalMaterials.get(node);
                    if (orig) node.material = orig;
                    node.material.wireframe = this.showWireframe;
                } else if (mode === 'hologram') {
                    node.material = this.hologramMaterial;
                    node.material.wireframe = this.showWireframe;
                } else if (mode === 'xray') {
                    node.material = this.xrayMaterial;
                    node.material.wireframe = this.showWireframe;
                }
            }
        });
    }

    toggleWireframe(val) {
        this.showWireframe = (val !== undefined) ? val : !this.showWireframe;
        if (!this.suitModel) return;

        this.suitModel.traverse((node) => {
            if (node.isMesh && node.material) {
                node.material.wireframe = this.showWireframe;
            }
        });
        return this.showWireframe;
    }

    toggleHandRig(val) {
        this.showHandRig = (val !== undefined) ? val : !this.showHandRig;
        if (this.handRigGroup) {
            this.handRigGroup.visible = this.showHandRig;
        }
        return this.showHandRig;
    }

    toggleAutoRotate(val) {
        this.autoRotate = (val !== undefined) ? val : !this.autoRotate;
        if (this.controls) {
            this.controls.autoRotate = this.autoRotate;
        }
        return this.autoRotate;
    }

    focusHotspot(hotspotKey) {
        this.autoRotate = false;
        if (this.controls) this.controls.autoRotate = false;

        const presets = {
            'overview': {
                cam: new THREE.Vector3(0, 0.35, 2.2),
                target: new THREE.Vector3(0, 0, 0)
            },
            'patch': {
                // AustroMir-91 Austrian Mission Patch on Right Arm / Chest
                cam: new THREE.Vector3(0.55, 0.28, 0.65),
                target: new THREE.Vector3(0.25, 0.18, 0.12)
            },
            'helmet': {
                // Sokol-KV2 Soft Pressure Helmet, Visor & Neck Coupler
                cam: new THREE.Vector3(0.0, 0.62, 0.85),
                target: new THREE.Vector3(0.0, 0.44, 0.08)
            },
            'regulator': {
                // Pressure Relief Valve & Thoracic Lacing
                cam: new THREE.Vector3(0.0, 0.12, 0.72),
                target: new THREE.Vector3(0.0, 0.06, 0.16)
            },
            'gloves': {
                // Articulated Sokol Flight Gloves with High-Friction Grip Pads
                cam: new THREE.Vector3(0.42, -0.05, 0.52),
                target: new THREE.Vector3(0.24, -0.14, 0.22)
            },
            'posture': {
                // Reclined Kazbek G-Force Couch Launch/Reentry Profile
                cam: new THREE.Vector3(1.85, 0.12, 0.25),
                target: new THREE.Vector3(0.0, -0.08, 0.0)
            }
        };

        const preset = presets[hotspotKey] || presets['overview'];
        this.targetCamPos = preset.cam.clone();
        this.targetLookAt = preset.target.clone();

        // If focusing gloves, auto-enable hand tracking rig for demonstration
        if (hotspotKey === 'gloves') {
            this.toggleHandRig(true);
            const handBtn = document.getElementById('suit-btn-hand-rig');
            if (handBtn) handBtn.classList.add('active');
        }
    }

    animate() {
        this.animFrameId = requestAnimationFrame(this.animate);
        const time = performance.now();

        // Smooth camera transition to hotspot target
        if (this.targetCamPos && this.targetLookAt) {
            this.camera.position.lerp(this.targetCamPos, 0.065);
            this.currentLookAt.lerp(this.targetLookAt, 0.065);
            this.controls.target.copy(this.currentLookAt);

            if (this.camera.position.distanceTo(this.targetCamPos) < 0.01) {
                this.targetCamPos = null;
                this.targetLookAt = null;
            }
        }

        this.controls.update();
        this.updateHandRigKinematics(time);
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    destroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.remove();
        }
        this.isInitialized = false;
    }
}
