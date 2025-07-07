export class SoundNotification {
  private static audioContext: AudioContext | null = null;
  
  static playNotificationSound(type: 'buy' | 'sell' | 'alert' = 'alert') {
    if (localStorage.getItem('enableSound') !== 'true') return;
    
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 音の種類によって周波数を変える
      switch (type) {
        case 'buy':
          // 上昇音（ドミソ）
          this.playSequence(oscillator, gainNode, [523.25, 659.25, 783.99], 150);
          break;
        case 'sell':
          // 下降音（ソミド）
          this.playSequence(oscillator, gainNode, [783.99, 659.25, 523.25], 150);
          break;
        default:
          // アラート音
          this.playSequence(oscillator, gainNode, [880, 880], 200);
      }
    } catch (error) {
      console.error('Sound playback failed:', error);
    }
  }
  
  private static playSequence(oscillator: OscillatorNode, gainNode: GainNode, frequencies: number[], duration: number) {
    const startTime = this.audioContext!.currentTime;
    
    frequencies.forEach((freq, index) => {
      const noteTime = startTime + (index * duration / 1000);
      oscillator.frequency.setValueAtTime(freq, noteTime);
    });
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + (frequencies.length * duration / 1000));
    
    oscillator.start(startTime);
    oscillator.stop(startTime + (frequencies.length * duration / 1000));
  }
  
  // テスト用
  static testSound() {
    this.playNotificationSound('buy');
    setTimeout(() => this.playNotificationSound('sell'), 1000);
    setTimeout(() => this.playNotificationSound('alert'), 2000);
  }
}