// Web Audio API Synthesizer for Retro-style Ludo Game Sound Effects
class LudoAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (common browser security rule)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(state) {
    this.enabled = state;
    if (this.enabled) {
      this.init();
    }
  }

  playRoll() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Simulate dice rolling sound - pitch sweep + noise crackle
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playStep() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.08);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCapture() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Create an explosion / crash effect
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(280, now);
    osc1.frequency.linearRampToValueAtTime(60, now + 0.45);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(140, now);
    osc2.frequency.linearRampToValueAtTime(30, now + 0.45);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  playHome() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Play a shiny, ascending bell tone
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  playBuzzer() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playWin() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // Triumph fanfare chord / arpeggio
    const chord = [
      [261.63, 329.63, 392.00], // C major
      [329.63, 415.30, 493.88], // E major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99, 1046.50] // C major octaves
    ];
    
    chord.forEach((freqs, chordIdx) => {
      freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + chordIdx * 0.15);
        
        gain.gain.setValueAtTime(0.08, now + chordIdx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.005, now + chordIdx * 0.15 + 0.5);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + chordIdx * 0.15);
        osc.stop(now + chordIdx * 0.15 + 0.5);
      });
    });
  }
}

window.ludoAudio = new LudoAudio();
