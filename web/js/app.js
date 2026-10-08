// web/js/app.js
// Main WebGL2 & WebXR Application Controller, 360° AR/VR Navigation, Telemetry & UI Bindings

import { KerrPhysics } from './physics.js';
import { vertexShaderSource, fragmentShaderSource } from './shader.js';
import { SpaceSoundSynthesizer } from './audio.js';

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

        this.initGL();
        this.bindEvents();
        this.bindUI();
        this.bindWebXR();
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
            u_helmetVisor: gl.getUniformLocation(this.program, 'u_helmetVisor')
        };
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

        window.addEventListener('mousemove', (e) => {
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
                // 360° First Person Look
                this.camera.povYaw += dx * 0.005;
                this.camera.povPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, this.camera.povPitch + dy * 0.005));
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

        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then(supported => {
                if (supported) {
                    vrBtn.style.display = 'inline-flex';
                    vrBtn.addEventListener('click', () => this.startXRSession());
                } else {
                    vrBtn.title = 'WebXR VR supported in Meta Quest / VR Headset Browsers';
                }
            }).catch(() => {});
        } else {
            vrBtn.title = 'WebXR not available in this browser environment.';
        }
    }

    async startXRSession() {
        if (this.xrSession) {
            await this.xrSession.end();
            return;
        }

        try {
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor']
            });
            this.xrSession = session;
            this.isVR = true;

            const gl = this.gl;
            await gl.makeXRCompatible();
            const xrGLLayer = new XRWebGLLayer(session, gl);
            session.updateRenderState({ baseLayer: xrGLLayer });

            this.xrRefSpace = await session.requestReferenceSpace('local');

            session.addEventListener('end', () => {
                this.xrSession = null;
                this.isVR = false;
                this.resize();
            });

            const onXRFrame = (time, frame) => {
                if (!this.xrSession) return;
                const pose = frame.getViewerPose(this.xrRefSpace);
                if (pose) {
                    const glLayer = this.xrSession.renderState.baseLayer;
                    gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);

                    for (const view of pose.views) {
                        const viewport = glLayer.getViewport(view);
                        gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                        
                        const eyeOffset = (view.eye === 'left') ? [-0.032, 0.0, 0.0] : [0.032, 0.0, 0.0];
                        this.renderFrame(time, viewport.width, viewport.height, eyeOffset, true, view.transform.matrix);
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
            case 'infall-dive':
                this.startInfall();
                return;
            case 'movie-ref':
            case 'gargantua-imax':
                // A quiet cinematic framing: a dark shadow, a thin bright plane,
                // and enough surrounding sky for the scale to register.
                this.camera.distance = 18.0;
                this.camera.theta = (84.5 * Math.PI) / 180.0; // 5.5° above equatorial plane
                this.camera.phi = 0.0;
                this.camera.target = [0.0, 0.0, 0.0];
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 54.0;
                this.camera.mode = 'orbit';
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 0.92;
                this.physics.diskThicknessGM = 0.055;
                this.physics.diskMaxTempK = 6800;
                this.physics.photonRingIntensity = 2.2;
                this.physics.photonRingSharpness = 30.0;
                this.physics.exposure = 0.90;
                this.helmetVisor = false;
                this.autoOrbit = false;
                this.isCinematicReference = true;
                break;
            case 'close-encounter':
                // Default experiential view. The motion is deliberately slow:
                // the changing star field and disk reveal the proximity before
                // the viewer consciously notices an animation.
                this.camera.distance = 19.0;
                this.camera.theta = (86.8 * Math.PI) / 180.0;
                this.camera.phi = 0.22;
                this.camera.target = [0.0, 0.0, 0.0];
                this.camera.up = [0.0, 1.0, 0.0];
                this.camera.fov = 62.0;
                this.camera.mode = 'orbit';
                this.physics.spin = 0.998;
                this.physics.diskBrightness = 1.02;
                this.physics.diskThicknessGM = 0.065;
                this.physics.diskMaxTempK = 6500;
                this.physics.photonRingIntensity = 1.45;
                this.physics.photonRingSharpness = 27.0;
                this.physics.exposure = 0.94;
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
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

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

    renderFrame(time, width, height, eyeOffset, isVR = false, xrMatrix = null) {
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
            // Base forward vector pointing towards black hole center
            const camDist = Math.hypot(camX, camY, camZ) || 1.0;
            const f0x = -camX / camDist;
            const f0y = -camY / camDist;
            const f0z = -camZ / camDist;

            // Right vector
            let r0x = f0y * this.camera.up[2] - f0z * this.camera.up[1];
            let r0y = f0z * this.camera.up[0] - f0x * this.camera.up[2];
            let r0z = f0x * this.camera.up[1] - f0y * this.camera.up[0];
            const rLen = Math.hypot(r0x, r0y, r0z) || 1.0;
            r0x /= rLen; r0y /= rLen; r0z /= rLen;

            // Orthogonal Up vector
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

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        // Upload Uniforms
        gl.uniform2f(this.uniforms.u_resolution, width, height);
        gl.uniform1f(this.uniforms.u_time, (time - this.startTime) * 0.001 * this.physics.simulationRate);
        gl.uniform3f(this.uniforms.u_camPos, camX, camY, camZ);
        gl.uniform3f(this.uniforms.u_camTarget, targetX, targetY, targetZ);
        gl.uniform3f(this.uniforms.u_camUp, this.camera.up[0], this.camera.up[1], this.camera.up[2]);
        gl.uniform1f(this.uniforms.u_fov, this.camera.fov);
        gl.uniform3fv(this.uniforms.u_eyeOffset, eyeOffset);
        gl.uniform1f(this.uniforms.u_isVR, isVR ? 1.0 : 0.0);
        gl.uniformMatrix3fv(this.uniforms.u_vrOrientation, false, this.gyroMatrix);

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
        gl.uniform1i(this.uniforms.u_maxSteps, this.physics.raymarchSteps);
        gl.uniform1f(this.uniforms.u_stepScale, 1.0);
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
