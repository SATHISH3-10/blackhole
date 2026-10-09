// web/js/audio.js
// Procedural Web Audio Synthesizer: Cosmic Gravitational Atmosphere, Infall Heartbeat & Graviton Rumble

export class SpaceSoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.masterGain = null;
        this.droneGain = null;
        this.heartbeatGain = null;
        this.plasmaHissGain = null;
        this.lastHeartbeatTime = 0;
        this.heartRateBpm = 68.0;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // 1. Deep Sub-bass Cosmic Drone (42 Hz + 48 Hz gravitational beating)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sine'; osc1.frequency.setValueAtTime(42.0, this.ctx.currentTime);
        osc2.type = 'triangle'; osc2.frequency.setValueAtTime(47.5, this.ctx.currentTime);

        const droneFilter = this.ctx.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(110.0, this.ctx.currentTime);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

        osc1.connect(droneFilter);
        osc2.connect(droneFilter);
        droneFilter.connect(this.droneGain);
        this.droneGain.connect(this.masterGain);

        osc1.start();
        osc2.start();

        // 2. Gravitational Wave Pulse LFO
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        lfo.connect(this.droneGain.gain);
        lfo.start();

        // 3. Accretion Disk Plasma Sheath Hiss (White noise through bandpass)
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const hissFilter = this.ctx.createBiquadFilter();
        hissFilter.type = 'bandpass';
        hissFilter.frequency.setValueAtTime(650.0, this.ctx.currentTime);
        hissFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        this.plasmaHissGain = this.ctx.createGain();
        this.plasmaHissGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

        whiteNoise.connect(hissFilter);
        hissFilter.connect(this.plasmaHissGain);
        this.plasmaHissGain.connect(this.masterGain);
        whiteNoise.start();

        // 4. Space-suit Astronaut Biometric Heartbeat Node
        this.heartbeatGain = this.ctx.createGain();
        this.heartbeatGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.heartbeatGain.connect(this.masterGain);
    }

    triggerHeartbeat() {
        if (!this.ctx || !this.isPlaying || !this.heartbeatGain) return;
        const now = this.ctx.currentTime;

        // Lub-Dub pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(75.0, now);
        osc.frequency.exponentialRampToValueAtTime(38.0, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.heartbeatGain);
        osc.start(now);
        osc.stop(now + 0.15);

        // Dub
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(68.0, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(32.0, now + 0.32);

        gain2.gain.setValueAtTime(0.22, now + 0.18);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

        osc2.connect(gain2);
        gain2.connect(this.heartbeatGain);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.35);
    }

    toggle() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.isPlaying = !this.isPlaying;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.isPlaying ? 0.4 : 0.0, this.ctx.currentTime, 0.1);
        }
        return this.isPlaying;
    }

    updateInfallAudio(distanceGM, velocityC, isInfall) {
        if (!this.ctx || !this.isPlaying) return;
        const now = this.ctx.currentTime;

        // Heart rate accelerates with proximity to horizon and infall speed
        if (isInfall) {
            const proximity = Math.max(0.0, Math.min(1.0, (15.0 - distanceGM) / 13.0));
            this.heartRateBpm = 70.0 + proximity * 85.0; // 70 bpm -> 155 bpm at horizon
            
            const interval = 60.0 / this.heartRateBpm;
            if (now - this.lastHeartbeatTime >= interval) {
                this.triggerHeartbeat();
                this.lastHeartbeatTime = now;
            }

            // Plasma hiss and deep rumble intensify
            if (this.plasmaHissGain) {
                this.plasmaHissGain.gain.setTargetAtTime(0.04 + 0.22 * proximity, now, 0.2);
            }
            if (this.droneGain) {
                this.droneGain.gain.setTargetAtTime(0.5 + 0.4 * proximity, now, 0.2);
            }
        } else {
            this.heartRateBpm = 68.0;
            const interval = 60.0 / this.heartRateBpm;
            if (now - this.lastHeartbeatTime >= interval) {
                this.triggerHeartbeat();
                this.lastHeartbeatTime = now;
            }
        }
    }

    get currentHeartRateBPM() {
        return this.heartRateBpm || 68.0;
    }

    updateClockRate(dilationMultiplier) {
        if (!this.ctx || !this.isPlaying) return;
        if (this.droneGain) {
            const intensity = Math.min(1.0, (dilationMultiplier || 1.0) / 1000.0);
            this.droneGain.gain.setTargetAtTime(0.4 + 0.3 * intensity, this.ctx.currentTime, 0.2);
        }
    }
}

