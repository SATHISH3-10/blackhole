import { KerrPhysics } from './physics.js';
import { vertexShaderSource, fragmentShaderSource } from './shader.js';
import { SpaceSoundSynthesizer } from './audio.js';

// Canonical 25 WebXR Hand Tracking Joints
export const XR_HAND_JOINTS = [
    'wrist',
    'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-phalanx-tip',
    'index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-phalanx-tip',
    'middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-phalanx-tip',
    'ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-phalanx-tip',
    'pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-phalanx-tip'
];

// Procedural 25-Joint Skeletal Kinematics for Desktop & Mobile Interaction
export function buildProceduralAxemuHand(isLeft, time, mouseX, mouseY, isPinch, targetArray) {
    const side = isLeft ? -1.0 : 1.0;
    const wave = Math.sin(time * 0.002);
    
    // Wrist base position in local camera space: framed naturally in lower view
    let wX, wY, wZ;
    if (isLeft) {
        wX = -0.16;
        wY = -0.12 + 0.005 * wave;
        wZ = 0.32 + 0.004 * wave;
    } else {
        wX = 0.16 + mouseX * 0.035;
        wY = -0.12 + mouseY * 0.035;
        wZ = 0.32;
    }

    // Joint 0: Wrist
    targetArray[0] = wX;
    targetArray[1] = wY;
    targetArray[2] = wZ;

    // Pinch curl modifier
    const pCurl = isPinch ? 1.0 : 0.0;

    // Thumb Chain (Joints 1..4)
    targetArray[1 * 3 + 0] = wX + side * 0.022;
    targetArray[1 * 3 + 1] = wY + 0.008;
    targetArray[1 * 3 + 2] = wZ + 0.016;

    targetArray[2 * 3 + 0] = wX + side * (0.036 - pCurl * 0.008);
    targetArray[2 * 3 + 1] = wY + 0.018 + pCurl * 0.005;
    targetArray[2 * 3 + 2] = wZ + 0.034 + pCurl * 0.010;

    targetArray[3 * 3 + 0] = wX + side * (0.038 - pCurl * 0.014);
    targetArray[3 * 3 + 1] = wY + 0.024 + pCurl * 0.002;
    targetArray[3 * 3 + 2] = wZ + 0.048 + pCurl * 0.018;

    targetArray[4 * 3 + 0] = wX + side * (0.033 - pCurl * 0.018);
    targetArray[4 * 3 + 1] = wY + 0.028 - pCurl * 0.008;
    targetArray[4 * 3 + 2] = wZ + 0.058 + pCurl * 0.022;

    // Index Finger (Joints 5..9)
    targetArray[5 * 3 + 0] = wX + side * 0.018;
    targetArray[5 * 3 + 1] = wY + 0.014;
    targetArray[5 * 3 + 2] = wZ + 0.042;

    targetArray[6 * 3 + 0] = wX + side * (0.020 + pCurl * 0.002);
    targetArray[6 * 3 + 1] = wY + 0.022 - pCurl * 0.004;
    targetArray[6 * 3 + 2] = wZ + 0.064 - pCurl * 0.004;

    targetArray[7 * 3 + 0] = wX + side * (0.019 + pCurl * 0.004);
    targetArray[7 * 3 + 1] = wY + 0.024 - pCurl * 0.012;
    targetArray[7 * 3 + 2] = wZ + 0.080 - pCurl * 0.008;

    targetArray[8 * 3 + 0] = wX + side * (0.017 + pCurl * 0.002);
    targetArray[8 * 3 + 1] = wY + 0.019 - pCurl * 0.018;
    targetArray[8 * 3 + 2] = wZ + 0.093 - pCurl * 0.015;

    targetArray[9 * 3 + 0] = wX + side * (0.015 - pCurl * 0.000);
    targetArray[9 * 3 + 1] = wY + 0.014 - pCurl * 0.020;
    targetArray[9 * 3 + 2] = wZ + 0.103 - pCurl * 0.023;

    // Middle Finger (Joints 10..14)
    targetArray[10 * 3 + 0] = wX + side * 0.006;
    targetArray[10 * 3 + 1] = wY + 0.016;
    targetArray[10 * 3 + 2] = wZ + 0.044;

    targetArray[11 * 3 + 0] = wX + side * 0.007;
    targetArray[11 * 3 + 1] = wY + 0.024;
    targetArray[11 * 3 + 2] = wZ + 0.068;

    targetArray[12 * 3 + 0] = wX + side * 0.006;
    targetArray[12 * 3 + 1] = wY + 0.026;
    targetArray[12 * 3 + 2] = wZ + 0.086;

    targetArray[13 * 3 + 0] = wX + side * 0.005;
    targetArray[13 * 3 + 1] = wY + 0.020;
    targetArray[13 * 3 + 2] = wZ + 0.100;

    targetArray[14 * 3 + 0] = wX + side * 0.004;
    targetArray[14 * 3 + 1] = wY + 0.014;
    targetArray[14 * 3 + 2] = wZ + 0.111;

    // Ring Finger (Joints 15..19)
    targetArray[15 * 3 + 0] = wX - side * 0.006;
    targetArray[15 * 3 + 1] = wY + 0.014;
    targetArray[15 * 3 + 2] = wZ + 0.041;

    targetArray[16 * 3 + 0] = wX - side * 0.006;
    targetArray[16 * 3 + 1] = wY + 0.021;
    targetArray[16 * 3 + 2] = wZ + 0.063;

    targetArray[17 * 3 + 0] = wX - side * 0.006;
    targetArray[17 * 3 + 1] = wY + 0.022;
    targetArray[17 * 3 + 2] = wZ + 0.080;

    targetArray[18 * 3 + 0] = wX - side * 0.006;
    targetArray[18 * 3 + 1] = wY + 0.016;
    targetArray[18 * 3 + 2] = wZ + 0.092;

    targetArray[19 * 3 + 0] = wX - side * 0.006;
    targetArray[19 * 3 + 1] = wY + 0.010;
    targetArray[19 * 3 + 2] = wZ + 0.101;

    // Pinky Finger (Joints 20..24)
    targetArray[20 * 3 + 0] = wX - side * 0.018;
    targetArray[20 * 3 + 1] = wY + 0.010;
    targetArray[20 * 3 + 2] = wZ + 0.036;

    targetArray[21 * 3 + 0] = wX - side * 0.019;
    targetArray[21 * 3 + 1] = wY + 0.015;
    targetArray[21 * 3 + 2] = wZ + 0.054;

    targetArray[22 * 3 + 0] = wX - side * 0.018;
    targetArray[22 * 3 + 1] = wY + 0.015;
    targetArray[22 * 3 + 2] = wZ + 0.068;

    targetArray[23 * 3 + 0] = wX - side * 0.017;
    targetArray[23 * 3 + 1] = wY + 0.010;
    targetArray[23 * 3 + 2] = wZ + 0.078;

    targetArray[24 * 3 + 0] = wX - side * 0.016;
    targetArray[24 * 3 + 1] = wY + 0.005;
    targetArray[24 * 3 + 2] = wZ + 0.086;
}

class GargantuaApp {
    constructor() {
        this.physics = new KerrPhysics();
        this.audio = new SpaceSoundSynthesizer();
        this.canvas = document.getElementById('gl-canvas');
        this.gl = this.canvas.getContext('webgl2', { 
            antialias: false, 
            powerPreference: 'high-performance',
            xrCompatible: true 
        });

        if (!this.gl) {
            alert('WebGL 2.0 is not supported by your browser or GPU.');
            return;
        }

        // Camera State: a close encounter where the black hole first appears as
        // a distant structure and slowly becomes impossible to ignore.
        this.camera = {
            distance: 4.8,
            theta: (88.6 * Math.PI) / 180.0, // low altitude parallel to cloud ocean
            phi: 1.35,                       // places black hole on upper-left and canopy on upper-right
            target: [0.0, 0.0, 0.0],
            up: [0.0, 1.0, 0.0],
            fov: 72.0,                       // wide IMAX vista
            povYaw: 0.0,
            povPitch: 0.0,
            mode: 'orbit'
        };

        // Interaction State
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.autoOrbit = true;
        this.encounterDrift = 0.0;
        this.isCloseEncounter = false;
        this.isCinematicReference = false;
        this.cinemaMode = false;
        this.startTime = performance.now();
        this.lastFrameTime = performance.now();
        this.earthYearsElapsed = 0.0;
        this.observerSecondsElapsed = 0.0;

        // WebXR & Gyroscope State
        this.xrSession = null;
        this.xrRefSpace = null;
        this.isVR = false;
        this.gyroEnabled = false;
        this.gyroMatrix = new Float32Array([1,0,0, 0,1,0, 0,0,1]);
        this.helmetVisor = true;

        // Desktop Mouse & Webcam Hand Tracking State
        this.mouseNormX = 0.0;
        this.mouseNormY = 0.0;
        this.webcamActive = false;
        this.webcamStream = null;
        this.webcamVideo = null;
        this.webcamCanvas = null;
        this.webcamCtx = null;

        // WebXR Hand Tracking & Body Scanning State
        this.hands = {
            left: { active: false, wrist: [0, 0, 0], idx: [0, 0, 0], thb: [0, 0, 0], rot: [1,0,0, 0,1,0, 0,0,1] },
            right: { active: false, wrist: [0, 0, 0], idx: [0, 0, 0], thb: [0, 0, 0], rot: [1,0,0, 0,1,0, 0,0,1] }
        };

        // Cinematic Infall Plunge State (Falling Into A Giant Black Hole VR 360°)
        this.isInfall = false;
        this.infallTime = 0.0;
        this.infallDuration = 34.0;
        this.infallStartPhi = 1.35;

        // Overlays
        this.overlays = {
            horizon: false,
            ergosphere: false,
            photonRegion: false,
            isco: false
        };

        // Meta Quest 3 & Mobile Hardware Detection
        this.isOculus = /OculusBrowser|Quest/i.test(navigator.userAgent);
        this.isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        this.ultraPerformanceMode = this.isOculus || this.isMobile;

        if (this.ultraPerformanceMode) {
            this.physics.raymarchSteps = 80; // Rock-solid 72/90 FPS on Meta Quest 3 with full halo!
        } else {
            this.physics.raymarchSteps = 140; // Full round-trip geodesic tracing for upper & lower lensing arcs
        }

        this.initGL();
        this.bindEvents();
        this.bindUI();
        this.bindWebXR();
        this.bindWebcamHands();
        this.bindGyro();
        this.resize();
        this.applyPreset('movie-ref');

        requestAnimationFrame((t) => this.render(t));
    }

    initGL() {
        const gl = this.gl;

        // Compile Shaders
        const vs = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Shader program linking error:', gl.getProgramInfoLog(this.program));
            return;
        }

        // Fullscreen Quad Geometry
        const quadPos = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0
        ]);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadPos, gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Uniform Locations Cache
        this.uniforms = {
            u_resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            u_time: gl.getUniformLocation(this.program, 'u_time'),
            u_camPos: gl.getUniformLocation(this.program, 'u_camPos'),
            u_camTarget: gl.getUniformLocation(this.program, 'u_camTarget'),
            u_camUp: gl.getUniformLocation(this.program, 'u_camUp'),
            u_fov: gl.getUniformLocation(this.program, 'u_fov'),
            u_eyeOffset: gl.getUniformLocation(this.program, 'u_eyeOffset'),
            u_isVR: gl.getUniformLocation(this.program, 'u_isVR'),
            u_vrOrientation: gl.getUniformLocation(this.program, 'u_vrOrientation'),

            u_spin: gl.getUniformLocation(this.program, 'u_spin'),
            u_orbitSign: gl.getUniformLocation(this.program, 'u_orbitSign'),
            u_rIn: gl.getUniformLocation(this.program, 'u_rIn'),
            u_rOut: gl.getUniformLocation(this.program, 'u_rOut'),
            u_diskThickness: gl.getUniformLocation(this.program, 'u_diskThickness'),
            u_diskBrightness: gl.getUniformLocation(this.program, 'u_diskBrightness'),
            u_tMaxK: gl.getUniformLocation(this.program, 'u_tMaxK'),
            u_diskOpacity: gl.getUniformLocation(this.program, 'u_diskOpacity'),
            u_lensing: gl.getUniformLocation(this.program, 'u_lensing'),
            u_kerrGeodesics: gl.getUniformLocation(this.program, 'u_kerrGeodesics'),
            u_dopplerOn: gl.getUniformLocation(this.program, 'u_dopplerOn'),
            u_redshiftOn: gl.getUniformLocation(this.program, 'u_redshiftOn'),
            u_photonGlow: gl.getUniformLocation(this.program, 'u_photonGlow'),
            u_photonIntensity: gl.getUniformLocation(this.program, 'u_photonIntensity'),
            u_photonSharpness: gl.getUniformLocation(this.program, 'u_photonSharpness'),
            u_exposure: gl.getUniformLocation(this.program, 'u_exposure'),
            u_maxSteps: gl.getUniformLocation(this.program, 'u_maxSteps'),
            u_stepScale: gl.getUniformLocation(this.program, 'u_stepScale'),
            u_captureR: gl.getUniformLocation(this.program, 'u_captureR'),
            u_cinematicDisk: gl.getUniformLocation(this.program, 'u_cinematicDisk'),

            u_showHorizon: gl.getUniformLocation(this.program, 'u_showHorizon'),
            u_showErgosphere: gl.getUniformLocation(this.program, 'u_showErgosphere'),
            u_showISCO: gl.getUniformLocation(this.program, 'u_showISCO'),
            u_helmetVisor: gl.getUniformLocation(this.program, 'u_helmetVisor'),

            // Universal 360° Desktop & WebXR Stereoscopic Ray System
            u_viewport: gl.getUniformLocation(this.program, 'u_viewport'),
            u_rayOrigin: gl.getUniformLocation(this.program, 'u_rayOrigin'),
            u_rayBasis: gl.getUniformLocation(this.program, 'u_rayBasis'),
            u_tanHalfFov: gl.getUniformLocation(this.program, 'u_tanHalfFov'),
            u_fovOffset: gl.getUniformLocation(this.program, 'u_fovOffset'),

            // Axiom AxEMU 25-Joint Skinned Hand Tracking & Gestures
            u_jointsL: gl.getUniformLocation(this.program, 'u_jointsL'),
            u_jointsR: gl.getUniformLocation(this.program, 'u_jointsR'),
            u_gestureState: gl.getUniformLocation(this.program, 'u_gestureState'),
            u_handL: gl.getUniformLocation(this.program, 'u_handL'),
            u_handR: gl.getUniformLocation(this.program, 'u_handR'),
            u_handL_idx: gl.getUniformLocation(this.program, 'u_handL_idx'),
            u_handR_idx: gl.getUniformLocation(this.program, 'u_handR_idx'),
            u_handL_thumb: gl.getUniformLocation(this.program, 'u_handL_thumb'),
            u_handR_thumb: gl.getUniformLocation(this.program, 'u_handR_thumb'),
            u_handState: gl.getUniformLocation(this.program, 'u_handState'),
            u_heartRateBPM: gl.getUniformLocation(this.program, 'u_heartRateBPM'),
            u_timeDilation: gl.getUniformLocation(this.program, 'u_timeDilation'),
            u_horizonDist: gl.getUniformLocation(this.program, 'u_horizonDist')
        };

        // 25-Joint Skinned Hand Buffers (25 * 3 = 75 floats each)
        this.jointDataL = new Float32Array(75);
        this.jointDataR = new Float32Array(75);
        this.gestureState = new Float32Array([0, 0, 0, 0]);
        this.isPinchingLeft = false;
        this.isPinchingRight = false;
    }

    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const err = gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', err);
            this.showError('Shader Compilation Error', err);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    showError(title, msg) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;left:20px;z-index:9999;background:rgba(200,0,0,0.85);color:#fff;padding:20px;border-radius:8px;font-family:monospace;max-width:80%;max-height:80%;overflow:auto;';
        div.innerHTML = `<h3>${title}</h3><pre>${msg}</pre>`;
        document.body.appendChild(div);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        // Mouse Drag to Orbit / Pan 360°
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        // Mouse Move for 360° Drag & Desktop Hand Interaction
        window.addEventListener('mousemove', (e) => {
            this.mouseNormX = (e.clientX / window.innerWidth) * 2.0 - 1.0;
            this.mouseNormY = -(e.clientY / window.innerHeight) * 2.0 + 1.0;

            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            if (this.camera.mode === 'orbit') {
                this.camera.phi += dx * 0.005;
                this.camera.theta = Math.max(0.02, Math.min(Math.PI - 0.02, this.camera.theta - dy * 0.005));
                this.physics.observerInclinationDeg = (this.camera.theta * 180.0) / Math.PI;
            } else {
                // 360° First Person Look: drag down to look down at your body/suit, drag up to look up
                this.camera.povYaw += dx * 0.005;
                this.camera.povPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.camera.povPitch - dy * 0.005));
            }
            this.updateTelemetry();
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Mouse Wheel to Zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.02;
            const minAllowed = this.physics.eventHorizonGM + 0.1;
            this.camera.distance = Math.max(minAllowed, Math.min(120.0, this.camera.distance + zoomDelta));
            this.physics.observerDistanceGM = this.camera.distance;
            this.updateTelemetry();
            const distSlider = document.getElementById('slider-dist');
            if (distSlider) distSlider.value = this.camera.distance.toFixed(1);
        }, { passive: false });

        // Touch Support
        let lastTouchDist = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                lastTouchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                const dx = e.touches[0].clientX - this.lastMouseX;
                const dy = e.touches[0].clientY - this.lastMouseY;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;

                if (this.camera.mode === 'orbit') {
                    this.camera.phi += dx * 0.006;
                    this.camera.theta = Math.max(0.02, Math.min(Math.PI - 0.02, this.camera.theta - dy * 0.006));
                    this.physics.observerInclinationDeg = (this.camera.theta * 180.0) / Math.PI;
                } else {
                    this.camera.povYaw += dx * 0.006;
                    this.camera.povPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.camera.povPitch + dy * 0.006));
                }
                this.updateTelemetry();
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const delta = (lastTouchDist - dist) * 0.05;
                lastTouchDist = dist;
                const minAllowed = this.physics.eventHorizonGM + 0.1;
                this.camera.distance = Math.max(minAllowed, Math.min(120.0, this.camera.distance + delta));
                this.physics.observerDistanceGM = this.camera.distance;
                this.updateTelemetry();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleCinemaMode();
            } else if (e.key === 'v' || e.key === 'V') {
                this.toggleVisor();
            } else if (e.key === 'f' || e.key === 'F') {
                this.toggleInfall();
            } else if (e.key === 'b' || e.key === 'B') {
                this.applyPreset(this.camera.mode === 'pov' && this.camera.povPitch < -0.3 ? 'movie-ref' : 'suit-inspect');
            } else if (e.key === ' ') {
                this.autoOrbit = !this.autoOrbit;
                const autoBtn = document.getElementById('btn-auto-orbit');
                if (autoBtn) autoBtn.classList.toggle('active', this.autoOrbit);
            } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.camera.phi -= 0.04;
                this.updateTelemetry();
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.camera.phi += 0.04;
                this.updateTelemetry();
            } else if (e.key === 'ArrowUp' || e.key === 'w') {
                this.camera.theta = Math.max(0.02, this.camera.theta - 0.03);
                this.updateTelemetry();
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                this.camera.theta = Math.min(Math.PI - 0.02, this.camera.theta + 0.03);
                this.updateTelemetry();
            } else if (e.key === '+' || e.key === '=' || e.key === 'PageUp') {
                const minAllowed = this.physics.eventHorizonGM + 0.1;
                this.camera.distance = Math.max(minAllowed, this.camera.distance - 1.5);
                this.physics.observerDistanceGM = this.camera.distance;
                this.updateTelemetry();
                const distSlider = document.getElementById('slider-dist');
                if (distSlider) distSlider.value = this.camera.distance.toFixed(1);
            } else if (e.key === '-' || e.key === '_' || e.key === 'PageDown') {
                this.camera.distance = Math.min(120.0, this.camera.distance + 1.5);
                this.physics.observerDistanceGM = this.camera.distance;
                this.updateTelemetry();
                const distSlider = document.getElementById('slider-dist');
                if (distSlider) distSlider.value = this.camera.distance.toFixed(1);
            }
        });
    }

    bindUI() {
        // Sliders
        const bindSlider = (id, callback, valFormat = v => v) => {
            const slider = document.getElementById(id);
            const valDisplay = document.getElementById(id + '-val');
            if (!slider) return;
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                callback(val);
                if (valDisplay) valDisplay.textContent = valFormat(val);
                this.updateTelemetry();
            });
        };

        bindSlider('slider-spin', v => { this.physics.spin = v; }, v => v.toFixed(3));
        bindSlider('slider-dist', v => {
            this.camera.distance = Math.max(this.physics.eventHorizonGM + 0.1, v);
            this.physics.observerDistanceGM = this.camera.distance;
        }, v => v.toFixed(1) + ' rg');
        bindSlider('slider-brightness', v => { this.physics.diskBrightness = v; }, v => v.toFixed(1));
        bindSlider('slider-thickness', v => { this.physics.diskThicknessGM = v; }, v => v.toFixed(2) + ' rg');
        bindSlider('slider-temp', v => { this.physics.diskMaxTempK = v; }, v => `${v} K`);
        bindSlider('slider-quality', v => { this.physics.raymarchSteps = Math.round(v); }, v => `${v} Steps`);

        // Checkbox Toggles
        const bindToggle = (id, callback) => {
            const cb = document.getElementById(id);
            if (!cb) return;
            cb.addEventListener('change', (e) => {
                callback(e.target.checked);
                this.updateTelemetry();
            });
        };

        bindToggle('toggle-kerr', v => { this.physics.kerrGeodesics = v; });
        bindToggle('toggle-doppler', v => { this.physics.dopplerEnabled = v; });
        bindToggle('toggle-redshift', v => { this.physics.redshiftEnabled = v; });
        bindToggle('toggle-photonring', v => { this.physics.photonRingGlow = v; });
        bindToggle('toggle-helmet-visor', v => { this.helmetVisor = v; });

        // Overlay Toggles
        bindToggle('toggle-ergo-wire', v => { this.overlays.ergosphere = v; });
        bindToggle('toggle-horizon-wire', v => { this.overlays.horizon = v; });
        bindToggle('toggle-isco-wire', v => { this.overlays.isco = v; });

        // Camera Modes
        const btnOrbit = document.getElementById('btn-mode-orbit');
        const btnPOV = document.getElementById('btn-mode-pov');
        if (btnOrbit && btnPOV) {
            btnOrbit.addEventListener('click', () => {
                this.camera.mode = 'orbit';
                btnOrbit.classList.add('active');
                btnPOV.classList.remove('active');
            });
            btnPOV.addEventListener('click', () => {
                this.camera.mode = 'pov';
                btnPOV.classList.add('active');
                btnOrbit.classList.remove('active');
                this.camera.povYaw = 0.0;
                this.camera.povPitch = 0.0;
            });
        }

        // Cinema Mode Toggle
        const cinemaBtn = document.getElementById('btn-cinema-toggle');
        if (cinemaBtn) {
            cinemaBtn.addEventListener('click', () => this.toggleCinemaMode());
        }

        // Performance Mode Toggle (Ultra Fast for Meta Quest 3)
        const perfBtn = document.getElementById('btn-perf-toggle');
        if (perfBtn) {
            if (this.ultraPerformanceMode) perfBtn.classList.add('active');
            perfBtn.addEventListener('click', () => {
                this.ultraPerformanceMode = !this.ultraPerformanceMode;
                perfBtn.classList.toggle('active', this.ultraPerformanceMode);
                this.physics.raymarchSteps = this.ultraPerformanceMode ? 32 : 56;
                this.resize();
            });
        }

        // Infall Dive Toggle
        const infallBtn = document.getElementById('btn-infall-dive');
        if (infallBtn) {
            infallBtn.addEventListener('click', () => this.toggleInfall());
        }

        // Quick Visor Toggle
        const quickVisorBtn = document.getElementById('btn-quick-visor');
        if (quickVisorBtn) {
            quickVisorBtn.addEventListener('click', () => this.toggleVisor());
        }

        // Preset Camera Trajectories
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.preset-btn').dataset.preset;
                this.applyPreset(target);
            });
        });

        // Audio Toggle
        const audioBtn = document.getElementById('btn-audio');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => {
                const playing = this.audio.toggle();
                audioBtn.textContent = playing ? '🔊 Audio: ON' : '🔈 Audio: OFF';
                audioBtn.classList.toggle('active', playing);
            });
        }

        // Auto Orbit Toggle
        const autoBtn = document.getElementById('btn-auto-orbit');
        if (autoBtn) {
            autoBtn.addEventListener('click', () => {
                this.autoOrbit = !this.autoOrbit;
                autoBtn.classList.toggle('active', this.autoOrbit);
                autoBtn.textContent = this.autoOrbit ? '🔄 Orbit: Auto' : '🔄 Orbit: Manual';
            });
        }

        // Educational Inspector Modal
        const infoBtn = document.getElementById('btn-science-info');
        const modal = document.getElementById('science-modal');
        const closeBtn = document.getElementById('modal-close');
        if (infoBtn && modal) {
            infoBtn.addEventListener('click', () => modal.classList.add('open'));
        }
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.remove('open'));
        }
    }

    toggleVisor() {
        this.helmetVisor = !this.helmetVisor;
        const visorCb = document.getElementById('toggle-helmet-visor');
        if (visorCb) visorCb.checked = this.helmetVisor;
        const quickVisorBtn = document.getElementById('btn-quick-visor');
        if (quickVisorBtn) quickVisorBtn.classList.toggle('active', this.helmetVisor);
    }

    startInfall() {
        if (this.isInfall) return; // Plunge runs one time only (no double trigger)
        this.isInfall = true;
        this.isCloseEncounter = false;
        this.isCinematicReference = false;
        this.infallTime = 0.0;
        this.infallDuration = 20.0;
        this.infallStartPhi = this.camera.phi;
        this.autoOrbit = false;
        this.camera.fov = 74.0;
        const infallBtn = document.getElementById('btn-infall-dive');
        if (infallBtn) {
            infallBtn.classList.add('active');
            infallBtn.textContent = '⏳ Infall in Progress...';
        }
        if (!this.audio.isPlaying) this.audio.toggle();
    }

    stopInfall() {
        this.isInfall = false;
        this.infallTime = 0.0;
        const infallBtn = document.getElementById('btn-infall-dive');
        if (infallBtn) {
            infallBtn.classList.remove('active');
            infallBtn.textContent = '🚀 Horizon Plunge';
        }
        this.applyPreset('movie-ref');
    }

    toggleInfall() {
        if (this.isInfall) this.stopInfall();
        else this.startInfall();
    }

    toggleCinemaMode() {
        this.cinemaMode = !this.cinemaMode;
        const hud = document.getElementById('main-hud');
        const cinemaBtn = document.getElementById('btn-cinema-toggle');
        if (hud) hud.classList.toggle('cinema-hidden', this.cinemaMode);
        if (cinemaBtn) {
            cinemaBtn.textContent = this.cinemaMode ? '🖥️ Show Controls' : '👁️ Cinema View';
            cinemaBtn.classList.toggle('active', this.cinemaMode);
        }
    }

    // WebXR Immersive VR Integration
    bindWebXR() {
        const vrBtn = document.getElementById('btn-webxr-vr');
        if (!vrBtn) return;

        vrBtn.addEventListener('click', () => this.startXRSession());

        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then(supported => {
                if (supported) {
                    vrBtn.style.display = 'inline-flex';
                    vrBtn.classList.add('active');
                    vrBtn.title = 'Click to Enter 360° VR in Meta Quest';
                }
            }).catch(() => {});
        }
    }

    async startXRSession() {
        if (this.xrSession) {
            await this.xrSession.end();
            return;
        }

        if (!navigator.xr) {
            alert('WebXR is only available in VR headset browsers (such as Meta Quest Browser) over HTTPS.');
            return;
        }

        try {
            // Enable Meta Quest Optical Hand Tracking & Bounded Floor
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            });
            this.xrSession = session;
            this.isVR = true;

            const gl = this.gl;
            await gl.makeXRCompatible();
            // Scale WebXR framebuffer factor to 0.70 on Meta Quest to prevent GPU memory/bandwidth stall
            const xrGLLayer = new XRWebGLLayer(session, gl, { framebufferScaleFactor: 0.70 });
            session.updateRenderState({ baseLayer: xrGLLayer });

            this.xrRefSpace = await session.requestReferenceSpace('local');

            session.addEventListener('end', () => {
                this.xrSession = null;
                this.isVR = false;
                this.hands.left.active = false;
                this.hands.right.active = false;
                this.resize();
            });

            const onXRFrame = (time, frame) => {
                if (!this.xrSession) return;
                const pose = frame.getViewerPose(this.xrRefSpace);
                if (pose) {
                    const glLayer = this.xrSession.renderState.baseLayer;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

                    // Scan Physical Hands & Controllers via WebXR Input Sources
                    this.hands.left.active = false;
                    this.hands.right.active = false;

                    for (const inputSource of session.inputSources) {
                        const handedness = inputSource.handedness;
                        if (!handedness || !this.hands[handedness]) continue;

                        if (inputSource.hand) {
                            // Meta Quest Optical Hand Tracking (Real-time body hand scan)
                            const wristJoint = inputSource.hand.get('wrist');
                            const idxJoint = inputSource.hand.get('index-finger-tip');
                            const thbJoint = inputSource.hand.get('thumb-tip');

                            if (wristJoint) {
                                const p = frame.getJointPose(wristJoint, this.xrRefSpace);
                                if (p) {
                                    this.hands[handedness].active = true;
                                    this.hands[handedness].wrist = [p.transform.position.x, p.transform.position.y, p.transform.position.z];
                                }
                            }
                            if (idxJoint) {
                                const ip = frame.getJointPose(idxJoint, this.xrRefSpace);
                                if (ip) {
                                    this.hands[handedness].idx = [ip.transform.position.x, ip.transform.position.y, ip.transform.position.z];
                                }
                            }
                            if (thbJoint) {
                                const tp = frame.getJointPose(thbJoint, this.xrRefSpace);
                                if (tp) {
                                    this.hands[handedness].thb = [tp.transform.position.x, tp.transform.position.y, tp.transform.position.z];
                                }
                            }
                        } else if (inputSource.gripSpace) {
                            // Meta Quest Controller 6DoF Pose
                            const p = frame.getPose(inputSource.gripSpace, this.xrRefSpace);
                            if (p) {
                                const pos = p.transform.position;
                                const m = p.transform.matrix;
                                this.hands[handedness].active = true;
                                this.hands[handedness].wrist = [pos.x, pos.y, pos.z];
                                this.hands[handedness].idx = [pos.x - m[8] * 0.10 + m[4] * 0.03, pos.y - m[9] * 0.10 + m[5] * 0.03, pos.z - m[10] * 0.10 + m[6] * 0.03];
                                this.hands[handedness].thb = [pos.x - m[8] * 0.06 + m[0] * 0.03, pos.y - m[9] * 0.06 + m[1] * 0.03, pos.z - m[10] * 0.06 + m[2] * 0.03];
                            }
                        }
                    }

                    for (const view of pose.views) {
                        const viewport = glLayer.getViewport(view);
                        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                        
                        this.renderFrame(time, viewport.width, viewport.height, null, true, view, viewport);
                    }
                }
                session.requestAnimationFrame(onXRFrame);
            };

            session.requestAnimationFrame(onXRFrame);
        } catch (err) {
            console.error('WebXR session failed to start:', err);
            alert('Unable to start WebXR session: ' + err.message);
        }
    }

    // Laptop Webcam Hand Scanner Integration
    bindWebcamHands() {
        const btn = document.getElementById('btn-webcam-hands');
        if (!btn) return;
        btn.addEventListener('click', () => this.toggleWebcamHands(btn));
    }

    async toggleWebcamHands(btn) {
        if (this.webcamActive) {
            if (this.webcamStream) {
                this.webcamStream.getTracks().forEach(t => t.stop());
                this.webcamStream = null;
            }
            this.webcamActive = false;
            btn.classList.remove('active');
            btn.textContent = '📷 Webcam Hand Scan';
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            });
            this.webcamStream = stream;
            this.webcamActive = true;
            btn.classList.add('active');
            btn.textContent = '📷 Webcam: Scanning Hands';

            if (!this.webcamVideo) {
                this.webcamVideo = document.createElement('video');
                this.webcamVideo.autoplay = true;
                this.webcamVideo.playsInline = true;
                this.webcamVideo.muted = true;
                this.webcamCanvas = document.createElement('canvas');
                this.webcamCanvas.width = 40;
                this.webcamCanvas.height = 30;
                this.webcamCtx = this.webcamCanvas.getContext('2d', { willReadFrequently: true });
            }
            this.webcamVideo.srcObject = stream;
        } catch (err) {
            console.error('Webcam hand scan error:', err);
            alert('Webcam access was denied or is unavailable: ' + err.message);
        }
    }

    processWebcamFrame() {
        if (!this.webcamActive || !this.webcamVideo || this.webcamVideo.readyState < 2) return;
        const ctx = this.webcamCtx;
        ctx.drawImage(this.webcamVideo, 0, 0, 40, 30);
        const imgData = ctx.getImageData(0, 0, 40, 30).data;

        let totalSkin = 0;
        let skinX = 0;
        let skinY = 0;

        for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i], g = imgData[i+1], b = imgData[i+2];
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15) {
                const px = (i / 4) % 40;
                const py = Math.floor((i / 4) / 40);
                skinX += px;
                skinY += py;
                totalSkin++;
            }
        }

        if (totalSkin > 15) {
            const normX = (1.0 - (skinX / totalSkin) / 40.0) * 2.0 - 1.0;
            const normY = (1.0 - (skinY / totalSkin) / 30.0) * 2.0 - 1.0;
            this.hands.right.active = true;
            this.hands.right.wrist = [0.22 + normX * 0.16, -0.26 + normY * 0.14, 0.38];
            this.hands.right.idx = [0.22 + normX * 0.16, -0.22 + normY * 0.14, 0.45];
            this.hands.right.thb = [0.18 + normX * 0.16, -0.25 + normY * 0.14, 0.42];
        }
    }

    // 360° Mobile Gyroscope Integration
    bindGyro() {
        const gyroBtn = document.getElementById('btn-gyro-ar');
        if (!gyroBtn) return;

        gyroBtn.addEventListener('click', async () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permissionState = await DeviceOrientationEvent.requestPermission();
                    if (permissionState === 'granted') {
                        this.enableGyro(gyroBtn);
                    } else {
                        alert('Device orientation permission was denied.');
                    }
                } catch (e) {
                    console.error('Gyro permission error:', e);
                }
            } else if (window.DeviceOrientationEvent) {
                this.enableGyro(gyroBtn);
            } else {
                alert('Device orientation sensors are not available on this device.');
            }
        });
    }

    enableGyro(btn) {
        this.gyroEnabled = !this.gyroEnabled;
        btn.classList.toggle('active', this.gyroEnabled);
        btn.textContent = this.gyroEnabled ? '📱 360° Gyro: ON' : '📱 360° Gyro AR';

        if (this.gyroEnabled) {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
        } else {
            window.removeEventListener('deviceorientation', this.handleOrientation.bind(this));
        }
    }

    handleOrientation(event) {
        if (!this.gyroEnabled) return;
        const alpha = (event.alpha || 0) * (Math.PI / 180.0);
        const beta = (event.beta || 0) * (Math.PI / 180.0);
        const gamma = (event.gamma || 0) * (Math.PI / 180.0);

        const cA = Math.cos(alpha), sA = Math.sin(alpha);
        const cB = Math.cos(beta), sB = Math.sin(beta);
        const cG = Math.cos(gamma), sG = Math.sin(gamma);

        this.gyroMatrix = new Float32Array([
            cA * cG - sA * sB * sG, -cB * sA, cA * sG + cG * sA * sB,
            cG * sA + cA * sB * sG,  cA * cB, sA * sG - cA * cB * sG,
            -cB * sG,                sB,      cB * cG
        ]);
    }

    applyPreset(preset) {
        this.isCloseEncounter = false;
        this.isCinematicReference = false;
        switch (preset) {
            case 'suit-inspect':
                // First-Person EVA Space Suit Inspection View
                this.camera.mode = 'pov';
                this.camera.povYaw = 0.0;
                this.camera.povPitch = -0.52; // Look down 30° directly at space suit chest & wrist HUD
                this.camera.fov = 68.0;
                this.helmetVisor = true;
                this.autoOrbit = false;
                const btnOrbit = document.getElementById('btn-mode-orbit');
                const btnPOV = document.getElementById('btn-mode-pov');
                if (btnOrbit && btnPOV) {
                    btnPOV.classList.add('active');
                    btnOrbit.classList.remove('active');
                }
                break;
            case 'infall-dive':
                this.startInfall();
                return;
            case 'movie-ref':
            case 'gargantua-imax':
                // A majestic cinematic framing: curved gravitational lensing halo arcs over and under,
                // spherical black hole shadow in the center, and glowing honey-amber accretion disk.
                this.camera.distance = 14.5;
                this.camera.theta = (76.8 * Math.PI) / 180.0; // 13.2° above equatorial plane - Canonical Interstellar / Kip Thorne view!
                this.camera.phi = 0.05;
                this.camera.target = [0.0, 0.0, 0.0];
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 62.0;
                this.camera.mode = 'orbit';
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 1.95;
                this.physics.diskThicknessGM = 0.18;
                this.physics.diskMaxTempK = 6500;
                this.physics.photonRingIntensity = 2.4;
                this.physics.photonRingSharpness = 28.0;
                this.physics.exposure = 1.05;
                this.helmetVisor = false;
                this.autoOrbit = true;
                this.isCinematicReference = true;
                break;
            case 'close-encounter':
                // Close encounter view with deep volumetric Keplerian accretion disk and lensing
                this.camera.distance = 13.5;
                this.camera.theta = (76.5 * Math.PI) / 180.0;
                this.camera.phi = 0.22;
                this.camera.target = [0.0, 0.0, 0.0];
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 64.0;
                this.camera.mode = 'orbit';
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.0;
                this.physics.diskThicknessGM = 0.20;
                this.physics.diskMaxTempK = 6500;
                this.physics.photonRingIntensity = 2.2;
                this.physics.photonRingSharpness = 27.0;
                this.physics.exposure = 1.08;
                this.helmetVisor = false;
                this.autoOrbit = true;
                this.encounterDrift = 0.0;
                this.isCloseEncounter = true;
                break;
            case 'cloud-skim':
                this.camera.distance = 4.8;
                this.camera.theta = (88.6 * Math.PI) / 180.0;
                this.camera.phi = 1.35;
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 72.0;
                this.camera.mode = 'orbit';
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.4;
                this.physics.diskThicknessGM = 0.24;
                this.physics.diskMaxTempK = 6500;
                this.autoOrbit = true;
                break;
            case 'disk-skim':
                this.camera.distance = 4.2;
                this.camera.theta = (88.8 * Math.PI) / 180.0;
                this.camera.phi = 1.45;
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 70.0;
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.6;
                this.physics.diskThicknessGM = 0.26;
                this.physics.diskMaxTempK = 7000;
                this.autoOrbit = true;
                break;
            case 'dual-photon-arch':
                this.camera.distance = 11.5;
                this.camera.theta = (89.8 * Math.PI) / 180.0;
                this.camera.phi = 0.0;
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 56.0;
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.0;
                this.physics.diskThicknessGM = 0.16;
                this.physics.photonRingIntensity = 2.4;
                this.physics.photonRingSharpness = 30.0;
                this.autoOrbit = false;
                break;
            case 'cloud-sea-horizon':
                this.camera.distance = 14.0;
                this.camera.theta = (89.0 * Math.PI) / 180.0;
                this.camera.phi = 0.85;
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 60.0;
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.2;
                this.physics.diskThicknessGM = 0.24;
                this.autoOrbit = true;
                break;
            case 'cloud-dive':
                this.camera.distance = 7.0;
                this.camera.theta = (76.0 * Math.PI) / 180.0;
                this.camera.phi = 2.1;
                this.camera.up = [-0.15, 0.98, 0.0];
                this.camera.fov = 64.0;
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 2.4;
                this.physics.diskThicknessGM = 0.26;
                this.autoOrbit = true;
                break;
            case 'millers':
                this.camera.distance = this.physics.iscoGM + 0.5;
                this.camera.theta = (89.5 * Math.PI) / 180.0;
                this.camera.up = [0.0, 1.0, 0.0];
                this.physics.spin = 0.998;
                break;
        }

        this.physics.observerDistanceGM = this.camera.distance;
        this.physics.observerInclinationDeg = (this.camera.theta * 180.0) / Math.PI;

        const updateControl = (id, val, textVal) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
            const span = document.getElementById(id + '-val');
            if (span) span.textContent = textVal;
        };

        updateControl('slider-dist', this.camera.distance.toFixed(1), this.camera.distance.toFixed(1) + ' rg');
        updateControl('slider-spin', this.physics.spin.toFixed(3), this.physics.spin.toFixed(3));
        updateControl('slider-brightness', this.physics.diskBrightness.toFixed(1), this.physics.diskBrightness.toFixed(1));
        updateControl('slider-thickness', this.physics.diskThicknessGM.toFixed(2), this.physics.diskThicknessGM.toFixed(2) + ' rg');
        updateControl('slider-temp', this.physics.diskMaxTempK, this.physics.diskMaxTempK + ' K');
        updateControl('slider-quality', this.physics.raymarchSteps, this.physics.raymarchSteps + ' Steps');

        const visorCb = document.getElementById('toggle-helmet-visor');
        if (visorCb) visorCb.checked = this.helmetVisor;

        const btnOrbit = document.getElementById('btn-mode-orbit');
        const btnPOV = document.getElementById('btn-mode-pov');
        if (btnOrbit && btnPOV) {
            btnOrbit.classList.toggle('active', this.camera.mode === 'orbit');
            btnPOV.classList.toggle('active', this.camera.mode === 'pov');
        }

        this.updateTelemetry();
    }

    updateTelemetry() {
        const p = this.physics;

        const setTxt = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setTxt('telemetry-horizon', `${p.eventHorizonGM.toFixed(3)} rg (${(p.eventHorizonGM * p.gravitationalRadiusKm).toLocaleString(undefined, { maximumFractionDigits: 0 })} km)`);
        setTxt('telemetry-isco', `${p.iscoGM.toFixed(3)} rg`);
        setTxt('telemetry-photon-pro', `${p.equatorialPhotonOrbitGM(true).toFixed(3)} rg`);
        setTxt('telemetry-photon-retro', `${p.equatorialPhotonOrbitGM(false).toFixed(3)} rg`);
        setTxt('telemetry-dilation', p.formatTimeDilation());
        setTxt('telemetry-dist', `${this.camera.distance.toFixed(2)} rg`);
        if (this.audio && typeof this.audio.updateClockRate === 'function') {
            this.audio.updateClockRate(p.timeDilationMultiplier);
        }
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        // On Quest 3 / Mobile, 0.60 DPR cuts fragment load by 2.7x while preserving clean visuals
        const dpr = this.ultraPerformanceMode ? 0.60 : Math.min(window.devicePixelRatio || 1, 1.0);

        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(time) {
        if (!this.isVR) {
            const dt = (time - this.lastFrameTime) * 0.001;
            this.lastFrameTime = time;

            // Infall Dive Plunge Controller (SpaceEngine / Space Cinema style)
            if (this.isInfall) {
                this.infallTime += dt;
                const u = Math.min(1.0, this.infallTime / this.infallDuration);
                
                // Relativistic free-fall trajectory: smoothly dives from r=28.0 down to r=1.05 rg
                const r = 28.0 * Math.pow(1.0 - u, 2.3) + 1.05;
                this.camera.distance = r;
                this.physics.observerDistanceGM = r;

                // Frame-dragging swirl & equatorial alignment
                this.camera.theta = ((78.0 + 10.8 * Math.sin(u * 1.5707)) * Math.PI) / 180.0;
                this.camera.phi = this.infallStartPhi + 2.8 * Math.pow(u, 1.35);
                this.physics.observerInclinationDeg = (this.camera.theta * 180.0) / Math.PI;

                const vRel = Math.min(0.992, Math.sqrt(2.0 / Math.max(r, 1.05)));
                this.audio.updateInfallAudio(r, vRel, true);

                // Live Infall Telemetry sync
                const sliderDist = document.getElementById('slider-dist');
                if (sliderDist) sliderDist.value = r.toFixed(1);
                const sliderDistVal = document.getElementById('slider-dist-val');
                if (sliderDistVal) sliderDistVal.textContent = r.toFixed(1) + ' rg';

                // Once plunge reaches the horizon (u >= 1.0), complete smoothly and settle without repeating!
                if (u >= 1.0 && this.infallTime >= this.infallDuration + 1.5) {
                    this.isInfall = false;
                    this.infallTime = 0.0;
                    this.camera.distance = 1.18;
                    this.physics.observerDistanceGM = 1.18;
                    this.autoOrbit = true; // Resume continuous orbital rotation
                    const infallBtn = document.getElementById('btn-infall-dive');
                    if (infallBtn) {
                        infallBtn.classList.remove('active');
                        infallBtn.textContent = '🚀 Horizon Plunge';
                    }
                }
            } else {
                // Continuous uninterrupted orbital flight along the black hole (runs continuously no matter what)
                if (this.autoOrbit) {
                    this.camera.phi += dt * 0.035;
                }
                this.audio.updateInfallAudio(this.camera.distance, 0.0, false);
            }

            // Real-time Relativistic Time Dilation Accumulator
            this.observerSecondsElapsed += dt;
            const dilationMult = this.physics.timeDilationMultiplier;
            if (isFinite(dilationMult)) {
                this.earthYearsElapsed += (dt * dilationMult) / (365.25 * 86400.0);
            }

            const clockObserver = document.getElementById('clock-observer');
            const clockEarth = document.getElementById('clock-earth');
            if (clockObserver) {
                const mins = Math.floor(this.observerSecondsElapsed / 60);
                const secs = Math.floor(this.observerSecondsElapsed % 60);
                clockObserver.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} Local`;
            }
            if (clockEarth) {
                if (this.earthYearsElapsed >= 1.0) {
                    clockEarth.textContent = `+${this.earthYearsElapsed.toFixed(2)} Years`;
                } else {
                    const days = this.earthYearsElapsed * 365.25;
                    clockEarth.textContent = `+${days.toFixed(1)} Days`;
                }
            }

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            this.renderFrame(time, this.canvas.width, this.canvas.height, [0, 0, 0], this.gyroEnabled);
        }

        requestAnimationFrame((t) => this.render(t));
    }

    renderFrame(time, width, height, eyeOffset, isVR = false, xrView = null, xrViewport = null) {
        const gl = this.gl;
        const r = this.camera.distance;
        const th = this.camera.theta;
        const ph = this.camera.phi;

        let camX = r * Math.sin(th) * Math.sin(ph);
        let camY = r * Math.cos(th);
        let camZ = r * Math.sin(th) * Math.cos(ph);

        let targetX = 0.0;
        let targetY = 0.0;
        let targetZ = 0.0;

        if (this.camera.mode === 'pov') {
            const camDist = Math.hypot(camX, camY, camZ) || 1.0;
            const f0x = -camX / camDist;
            const f0y = -camY / camDist;
            const f0z = -camZ / camDist;

            let r0x = f0y * this.camera.up[2] - f0z * this.camera.up[1];
            let r0y = f0z * this.camera.up[0] - f0x * this.camera.up[2];
            let r0z = f0x * this.camera.up[1] - f0y * this.camera.up[0];
            const rLen = Math.hypot(r0x, r0y, r0z) || 1.0;
            r0x /= rLen; r0y /= rLen; r0z /= rLen;

            const u0x = r0y * f0z - r0z * f0y;
            const u0y = r0z * f0x - r0x * f0z;
            const u0z = r0x * f0y - r0y * f0x;

            const lookYaw = this.camera.povYaw;
            const lookPitch = this.camera.povPitch;
            const cosP = Math.cos(lookPitch);
            const sinP = Math.sin(lookPitch);
            const cosY = Math.cos(lookYaw);
            const sinY = Math.sin(lookYaw);

            const lookDirX = f0x * cosP * cosY + r0x * cosP * sinY + u0x * sinP;
            const lookDirY = f0y * cosP * cosY + r0y * cosP * sinY + u0y * sinP;
            const lookDirZ = f0z * cosP * cosY + r0z * cosP * sinY + u0z * sinP;

            targetX = camX + lookDirX;
            targetY = camY + lookDirY;
            targetZ = camZ + lookDirZ;
        }

        let rayOrigin = [camX, camY, camZ];
        let rayBasis = new Float32Array(9);
        let tanHalfFov = [Math.tan((this.camera.fov * Math.PI / 180.0) * 0.5) * (width / height), Math.tan((this.camera.fov * Math.PI / 180.0) * 0.5)];
        let fovOffset = [0.0, 0.0];
        let maxSteps = this.ultraPerformanceMode ? 32 : this.physics.raymarchSteps;

        // Local Astronaut Space Suit Hand Tracking Coordinates
        let localHandL = [0, 0, 0];
        let localHandR = [0, 0, 0];
        let localHandL_idx = [0, 0, 0];
        let localHandR_idx = [0, 0, 0];
        let localHandL_thb = [0, 0, 0];
        let localHandR_thb = [0, 0, 0];

        if (isVR && xrView) {
            // WebXR View Matrix & Projection Matrix for Meta Quest
            const m = xrView.transform.matrix;
            const p = xrView.projectionMatrix;

            // Base orbital coordinate frame facing black hole center (0,0,0)
            const camDist = Math.hypot(camX, camY, camZ) || 1.0;
            const f0x = -camX / camDist;
            const f0y = -camY / camDist;
            const f0z = -camZ / camDist;

            let r0x = f0y * this.camera.up[2] - f0z * this.camera.up[1];
            let r0y = f0z * this.camera.up[0] - f0x * this.camera.up[2];
            let r0z = f0x * this.camera.up[1] - f0y * this.camera.up[0];
            const rLen = Math.hypot(r0x, r0y, r0z) || 1.0;
            r0x /= rLen; r0y /= rLen; r0z /= rLen;

            const u0x = r0y * f0z - r0z * f0y;
            const u0y = r0z * f0x - r0x * f0z;
            const u0z = r0x * f0y - r0y * f0x;

            // Headset pose in WebXR tracking space:
            const hRx = m[0], hRy = m[1], hRz = m[2];
            const hUx = m[4], hUy = m[5], hUz = m[6];
            const hFx = -m[8], hFy = -m[9], hFz = -m[10];
            const hPx = m[12], hPy = m[13], hPz = m[14];

            // Transform headset rotation into world orbit space
            const worldRx = r0x * hRx + u0x * hRy - f0x * hRz;
            const worldRy = r0y * hRx + u0y * hRy - f0y * hRz;
            const worldRz = r0z * hRx + u0z * hRy - f0z * hRz;

            const worldUx = r0x * hUx + u0x * hUy - f0x * hUz;
            const worldUy = r0y * hUx + u0y * hUy - f0y * hUz;
            const worldUz = r0z * hUx + u0z * hUy - f0z * hUz;

            const worldFx = r0x * hFx + u0x * hFy - f0x * hFz;
            const worldFy = r0y * hFx + u0y * hFy - f0y * hFz;
            const worldFz = r0z * hFx + u0z * hFy - f0z * hFz;

            // Transformed Eye Origin with physical headset IPD separation:
            const eyeX = camX + (r0x * hPx + u0x * hPy - f0x * hPz);
            const eyeY = camY + (r0y * hPx + u0y * hPy - f0y * hPz);
            const eyeZ = camZ + (r0z * hPx + u0z * hPy - f0z * hPz);

            rayOrigin = [eyeX, eyeY, eyeZ];
            rayBasis = new Float32Array([
                worldRx, worldRy, worldRz,
                worldUx, worldUy, worldUz,
                worldFx, worldFy, worldFz
            ]);

            // Exact projection tangents directly from Oculus Quest lenses
            tanHalfFov = [1.0 / p[0], 1.0 / p[5]];
            fovOffset = [-p[8] / p[0], -p[9] / p[5]];
            maxSteps = 64; // Dual-eye WebXR VR mode on Meta Quest with complete lensing halo (72/90 FPS)

            // Map tracked physical hands into local headset camera space
            const toHeadsetLocal = (pt) => {
                const dx = pt[0] - hPx;
                const dy = pt[1] - hPy;
                const dz = pt[2] - hPz;
                return [
                    dx * hRx + dy * hRy + dz * hRz,
                    dx * hUx + dy * hUy + dz * hUz,
                    dx * hFx + dy * hFy + dz * hFz
                ];
            };

            // Process 25-Joint WebXR Hand Tracking if available
            let webxrHandFound = false;
            if (xrFrame && this.xrSession && this.xrRefSpace) {
                for (const inputSource of this.xrSession.inputSources) {
                    if (inputSource.hand) {
                        webxrHandFound = true;
                        const isLeft = inputSource.handedness === 'left';
                        const targetArray = isLeft ? this.jointDataL : this.jointDataR;

                        for (let j = 0; j < XR_HAND_JOINTS.length; j++) {
                            const jointName = XR_HAND_JOINTS[j];
                            const joint = inputSource.hand.get(jointName);
                            if (joint) {
                                const pose = xrFrame.getJointPose(joint, this.xrRefSpace);
                                if (pose) {
                                    const pos = pose.transform.position;
                                    const loc = toHeadsetLocal([pos.x, pos.y, pos.z]);
                                    targetArray[j * 3 + 0] = loc[0];
                                    targetArray[j * 3 + 1] = loc[1];
                                    targetArray[j * 3 + 2] = loc[2];
                                }
                            }
                        }

                        // Calculate Euclidean pinch distance: Thumb Tip (4) to Index Tip (9)
                        const tX = targetArray[4 * 3 + 0], tY = targetArray[4 * 3 + 1], tZ = targetArray[4 * 3 + 2];
                        const iX = targetArray[9 * 3 + 0], iY = targetArray[9 * 3 + 1], iZ = targetArray[9 * 3 + 2];
                        const pinchDist = Math.hypot(tX - iX, tY - iY, tZ - iZ);
                        const isPinching = pinchDist < 0.022;

                        if (isLeft) this.isPinchingLeft = isPinching;
                        else this.isPinchingRight = isPinching;
                    }
                }
            }

            if (!webxrHandFound) {
                // Procedural fallback kinematics in VR when optical tracking is initializing
                buildProceduralAxemuHand(true, time, 0, 0, false, this.jointDataL);
                buildProceduralAxemuHand(false, time, 0, 0, false, this.jointDataR);
            }
        } else {
            // Desktop / Laptop: Process Webcam hands if active
            if (this.webcamActive) {
                this.processWebcamFrame();
            }

            // Procedural 25-Joint Skinned Hands for Desktop Interaction & Inspection
            const isPinching = this.isDragging;
            buildProceduralAxemuHand(true, time, 0, 0, false, this.jointDataL);
            buildProceduralAxemuHand(false, time, this.mouseNormX, this.mouseNormY, isPinching, this.jointDataR);

            this.hands.left.active = true;
            this.hands.right.active = true;

            // Desktop / Mobile Gyro Ray Generation
            let forward = [targetX - camX, targetY - camY, targetZ - camZ];
            const fLen = Math.hypot(forward[0], forward[1], forward[2]) || 1.0;
            forward = [forward[0] / fLen, forward[1] / fLen, forward[2] / fLen];

            let right = [
                forward[1] * this.camera.up[2] - forward[2] * this.camera.up[1],
                forward[2] * this.camera.up[0] - forward[0] * this.camera.up[2],
                forward[0] * this.camera.up[1] - forward[1] * this.camera.up[0]
            ];
            const rLen = Math.hypot(right[0], right[1], right[2]) || 1.0;
            right = [right[0] / rLen, right[1] / rLen, right[2] / rLen];

            let up = [
                right[1] * forward[2] - right[2] * forward[1],
                right[2] * forward[0] - right[0] * forward[2],
                right[0] * forward[1] - right[1] * forward[0]
            ];

            if (this.gyroEnabled) {
                const gm = this.gyroMatrix;
                const applyG = (v) => [
                    gm[0] * v[0] + gm[1] * v[1] + gm[2] * v[2],
                    gm[3] * v[0] + gm[4] * v[1] + gm[5] * v[2],
                    gm[6] * v[0] + gm[7] * v[1] + gm[8] * v[2]
                ];
                right = applyG(right);
                up = applyG(up);
                forward = applyG(forward);
            }

            rayBasis = new Float32Array([
                right[0], right[1], right[2],
                up[0], up[1], up[2],
                forward[0], forward[1], forward[2]
            ]);
            tanHalfFov = [Math.tan((this.camera.fov * Math.PI / 180.0) * 0.5) * (width / height), Math.tan((this.camera.fov * Math.PI / 180.0) * 0.5)];
            fovOffset = [0.0, 0.0];
        }

        // Two-Hand Span Distance Calculation (For Dynamic Gesture Zoom / Scaling)
        const handSpan = Math.hypot(
            this.jointDataL[0] - this.jointDataR[0],
            this.jointDataL[1] - this.jointDataR[1],
            this.jointDataL[2] - this.jointDataR[2]
        );

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // Upload Viewport & Global Uniforms
        const vp = xrViewport || { x: 0, y: 0, width, height };
        gl.uniform2f(this.uniforms.u_resolution, width, height);
        gl.uniform4f(this.uniforms.u_viewport, vp.x, vp.y, vp.width, vp.height);
        gl.uniform1f(this.uniforms.u_time, (time - this.startTime) * 0.001 * this.physics.simulationRate);
        gl.uniform3f(this.uniforms.u_camPos, camX, camY, camZ);
        gl.uniform3f(this.uniforms.u_camTarget, targetX, targetY, targetZ);
        gl.uniform3f(this.uniforms.u_camUp, this.camera.up[0], this.camera.up[1], this.camera.up[2]);
        gl.uniform1f(this.uniforms.u_fov, this.camera.fov);
        gl.uniform3fv(this.uniforms.u_eyeOffset, [0.0, 0.0, 0.0]);
        gl.uniform1f(this.uniforms.u_isVR, isVR ? 1.0 : 0.0);
        gl.uniformMatrix3fv(this.uniforms.u_vrOrientation, false, this.gyroMatrix);

        // WebXR & Desktop Ray Generation Uniforms
        gl.uniform3fv(this.uniforms.u_rayOrigin, rayOrigin);
        gl.uniformMatrix3fv(this.uniforms.u_rayBasis, false, rayBasis);
        gl.uniform2f(this.uniforms.u_tanHalfFov, tanHalfFov[0], tanHalfFov[1]);
        gl.uniform2f(this.uniforms.u_fovOffset, fovOffset[0], fovOffset[1]);

        // Axiom AxEMU 25-Joint Skinned Hands & WebXR Gesture Uniforms
        gl.uniform3fv(this.uniforms.u_jointsL, this.jointDataL);
        gl.uniform3fv(this.uniforms.u_jointsR, this.jointDataR);
        gl.uniform4f(this.uniforms.u_gestureState, this.isPinchingLeft ? 1.0 : 0.0, this.isPinchingRight ? 1.0 : 0.0, handSpan, 1.0);

        const currentBPM = (this.audio && this.audio.currentHeartRateBPM) ? this.audio.currentHeartRateBPM : 75.0;
        gl.uniform1f(this.uniforms.u_heartRateBPM, currentBPM);
        gl.uniform1f(this.uniforms.u_timeDilation, this.physics.timeDilationMultiplier || 1.0);
        gl.uniform1f(this.uniforms.u_horizonDist, this.camera.distance / Math.max(0.1, this.physics.eventHorizonGM));

        // Physics Parameters
        gl.uniform1f(this.uniforms.u_spin, this.physics.spin);
        gl.uniform1f(this.uniforms.u_orbitSign, this.physics.diskPrograde ? 1.0 : -1.0);
        gl.uniform1f(this.uniforms.u_rIn, this.physics.innerRadiusResolvedGM);
        gl.uniform1f(this.uniforms.u_rOut, this.physics.outerRadiusResolvedGM);
        gl.uniform1f(this.uniforms.u_diskThickness, this.physics.diskThicknessGM);
        gl.uniform1f(this.uniforms.u_diskBrightness, this.physics.diskBrightness);
        gl.uniform1f(this.uniforms.u_tMaxK, this.physics.diskMaxTempK);
        gl.uniform1f(this.uniforms.u_diskOpacity, this.physics.diskOpacity);
        gl.uniform1f(this.uniforms.u_lensing, this.physics.lensingStrength);
        gl.uniform1f(this.uniforms.u_kerrGeodesics, this.physics.kerrGeodesics ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_dopplerOn, this.physics.dopplerEnabled ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_redshiftOn, this.physics.redshiftEnabled ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_photonGlow, this.physics.photonRingGlow ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_photonIntensity, this.physics.photonRingIntensity);
        gl.uniform1f(this.uniforms.u_photonSharpness, this.physics.photonRingSharpness);
        gl.uniform1f(this.uniforms.u_exposure, this.physics.exposure);
        const stepScale = (this.ultraPerformanceMode || isVR) ? 1.75 : 1.0;
        gl.uniform1i(this.uniforms.u_maxSteps, maxSteps);
        gl.uniform1f(this.uniforms.u_stepScale, stepScale);
        gl.uniform1f(this.uniforms.u_captureR, this.physics.eventHorizonGM);
        gl.uniform1f(this.uniforms.u_cinematicDisk, this.isCinematicReference ? 1.0 : 0.0);

        gl.uniform1f(this.uniforms.u_showHorizon, this.overlays.horizon ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_showErgosphere, this.overlays.ergosphere ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_showISCO, this.overlays.isco ? 1.0 : 0.0);
        gl.uniform1f(this.uniforms.u_helmetVisor, this.helmetVisor ? 1.0 : 0.0);

        // Draw Fullscreen Quad
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new GargantuaApp();
});
