class AudioManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume context if suspended (browser auto-play policy)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    _playTone(freq, type, duration, vol = 0.1) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(vol, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    playCorrect() {
        // High pitched happy sound
        if (!this.soundEnabled) return;
        this.init();

        // Play an arpeggio (C major-ish)
        setTimeout(() => this._playTone(523.25, 'sine', 0.1, 0.2), 0);
        setTimeout(() => this._playTone(659.25, 'sine', 0.1, 0.2), 100);
        setTimeout(() => this._playTone(783.99, 'sine', 0.2, 0.2), 200);
    }

    playWrong() {
        // Low pitched buzzer
        if (!this.soundEnabled) return;
        this.init();

        setTimeout(() => this._playTone(150, 'sawtooth', 0.2, 0.2), 0);
        setTimeout(() => this._playTone(100, 'sawtooth', 0.3, 0.2), 150);
    }

    playClick() {
        // Short pop
        this._playTone(800, 'sine', 0.05, 0.05);
    }
}

export const audioManager = new AudioManager();
