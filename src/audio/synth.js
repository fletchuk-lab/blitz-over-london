// Basic Web Audio API Synthesizer for retro sound effects
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

export function playShootSound() {
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

export function playExplosionSound() {
    initAudio();
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start();
}

let engineNoiseSource = null;
let engineGainNode = null;

export function playEngineHum() {
    initAudio();
    if (!audioCtx) return;
    if (engineNoiseSource) return; // Already playing
    
    const osc = audioCtx.createOscillator();
    engineGainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    // Simulate slight wobble in pitch
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 2; // 2Hz wobble
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    
    engineGainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    
    osc.connect(engineGainNode);
    engineGainNode.connect(audioCtx.destination);
    
    osc.start();
    engineNoiseSource = osc;
}

export function stopEngineHum() {
    if (engineNoiseSource && engineGainNode) {
        engineGainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        setTimeout(() => {
            if (engineNoiseSource) {
                engineNoiseSource.stop();
                engineNoiseSource.disconnect();
                engineNoiseSource = null;
            }
        }, 500);
    }
}
