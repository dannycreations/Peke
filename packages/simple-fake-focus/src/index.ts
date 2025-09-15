import { runOnImmediate } from '@/helpers/autorun';

interface SpoofConfig {
  readonly target: object;
  readonly key: string;
  readonly spoof: PropertyDescriptor;
}

interface OriginalDescriptorInfo {
  readonly target: object;
  readonly key: string;
  readonly descriptor: PropertyDescriptor | undefined;
}

const SPOOF_CONFIG: readonly SpoofConfig[] = [
  {
    target: Document.prototype,
    key: 'hidden',
    spoof: {
      get: () => false,
      configurable: true,
    },
  },
  {
    target: Document.prototype,
    key: 'webkitHidden',
    spoof: {
      get: () => false,
      configurable: true,
    },
  },
  {
    target: Document.prototype,
    key: 'visibilityState',
    spoof: {
      get: () => 'visible',
      configurable: true,
    },
  },
  {
    target: Document.prototype,
    key: 'webkitVisibilityState',
    spoof: {
      get: () => 'visible',
      configurable: true,
    },
  },
  {
    target: document,
    key: 'hasFocus',
    spoof: {
      value: () => true,
      configurable: true,
      writable: true,
    },
  },
  {
    target: window,
    key: 'focus',
    spoof: {
      value: () => {},
      configurable: true,
      writable: true,
    },
  },
];

const STATE_CHANGE_MS: number = 100;
const ACTIVITY_EMIT_MS: number = 60000;

class ActivitySpoofer {
  private isActive: boolean = false;
  private intervalId: number | null = null;
  private debounceId: number | null = null;
  private audioContext: AudioContext | null = null;

  private readonly originalDescriptors: Map<string, OriginalDescriptorInfo> = new Map();

  public constructor() {
    const onStateChange = (): void => {
      try {
        if (this.isOriginalPageHidden() || !this.isOriginalPageFocused()) {
          this.activateDebounced();
        } else {
          this.deactivateDebounced();
        }
      } catch {}
    };

    onStateChange();

    window.addEventListener('blur', onStateChange, true);
    window.addEventListener('focus', onStateChange, true);
    document.addEventListener('visibilitychange', onStateChange, true);
    document.addEventListener('webkitvisibilitychange', onStateChange, true);
  }

  private async activate(): Promise<void> {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    this.manageSpoofs(true);
    await this.manageSilentAudio(true);
    this.intervalId = window.setInterval(() => this.emitActivity(), ACTIVITY_EMIT_MS);
  }

  private async deactivate(): Promise<void> {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.manageSilentAudio(false);
    this.manageSpoofs(false);
  }

  private activateDebounced(): void {
    if (this.debounceId !== null) {
      window.clearTimeout(this.debounceId);
    }
    this.debounceId = window.setTimeout(() => this.activate(), STATE_CHANGE_MS);
  }

  private deactivateDebounced(): void {
    if (this.debounceId !== null) {
      window.clearTimeout(this.debounceId);
    }
    this.debounceId = window.setTimeout(() => this.deactivate(), STATE_CHANGE_MS);
  }

  private manageSpoofs(shouldApply: boolean): void {
    if (shouldApply) {
      for (const config of SPOOF_CONFIG) {
        const { target, key, spoof } = config;
        try {
          const descriptor = Object.getOwnPropertyDescriptor(target, key);
          this.originalDescriptors.set(key, { target, key, descriptor });
          Object.defineProperty(target, key, spoof);
        } catch {}
      }
      return;
    }

    for (const original of this.originalDescriptors.values()) {
      const { target, key, descriptor } = original;
      try {
        if (descriptor) {
          Object.defineProperty(target, key, descriptor);
        } else {
          delete (target as Record<string, unknown>)[key];
        }
      } catch {}
    }
    this.originalDescriptors.clear();
  }

  private async manageSilentAudio(shouldStart: boolean): Promise<void> {
    if (!shouldStart) {
      if (this.audioContext) {
        try {
          if (this.audioContext.state !== 'closed') {
            await this.audioContext.close();
          }
        } catch {}
        this.audioContext = null;
      }
      return;
    }

    if (this.audioContext && this.audioContext.state === 'running') {
      return;
    }

    await this.manageSilentAudio(false);

    try {
      const AudioContextAPI = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextAPI) {
        return;
      }

      this.audioContext = new AudioContextAPI();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (this.audioContext.state !== 'running') {
        throw new Error('AudioContext failed to start or resume.');
      }

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.00001;

      const oscillator = this.audioContext.createOscillator();
      oscillator.frequency.value = 20;
      oscillator.connect(gainNode).connect(this.audioContext.destination);
      oscillator.start();
    } catch {
      await this.manageSilentAudio(false);
    }
  }

  private emitActivity(): void {
    try {
      const keyboardEvent = new KeyboardEvent('keyup', {
        key: 'F32',
        code: 'F32',
        which: 143,
        keyCode: 143,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyboardEvent);
    } catch {}
  }

  private isOriginalPageHidden(): boolean {
    if (!this.isActive) {
      return document.hidden;
    }

    const original = this.originalDescriptors.get('hidden');
    if (!original?.descriptor?.get) {
      return false;
    }

    try {
      return original.descriptor.get.call(document) as boolean;
    } catch {
      return false;
    }
  }

  private isOriginalPageFocused(): boolean {
    if (!this.isActive) {
      return document.hasFocus();
    }

    const original = this.originalDescriptors.get('hasFocus');
    if (typeof original?.descriptor?.value !== 'function') {
      return true;
    }

    try {
      return original.descriptor.value.call(document) as boolean;
    } catch {
      return true;
    }
  }
}

runOnImmediate(() => new ActivitySpoofer());

declare global {
  interface Window {
    readonly webkitAudioContext: typeof AudioContext;
  }
}
