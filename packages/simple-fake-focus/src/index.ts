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
    target: Document.prototype,
    key: 'hasFocus',
    spoof: {
      value: () => true,
      configurable: true,
      writable: true,
    },
  },
  {
    target: Document.prototype,
    key: 'onvisibilitychange',
    spoof: {
      get: () => null,
      set: () => {},
      configurable: true,
    },
  },
  {
    target: Document.prototype,
    key: 'onwebkitvisibilitychange',
    spoof: {
      get: () => null,
      set: () => {},
      configurable: true,
    },
  },
  {
    target: window.Window.prototype,
    key: 'focus',
    spoof: {
      value: Object.assign(() => {}, { toString: () => 'function focus() { [native code] }' }),
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
  private operationQueue: Promise<void> = Promise.resolve();

  private readonly originalDescriptors: Map<string, OriginalDescriptorInfo> = new Map();

  public constructor() {
    const onStateChange = (event?: Event): void => {
      try {
        const isHidden = this.isOriginalPageHidden();
        const isFocused = this.isOriginalPageFocused();

        if (isHidden || !isFocused) {
          this.activate();
        } else {
          this.deactivate();
        }

        // If we are currently spoofing, we must prevent the page from receiving the state change event.
        if (event && this.isActive) {
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      } catch {}
    };

    onStateChange();

    window.addEventListener('blur', onStateChange, true);
    window.addEventListener('focus', onStateChange, true);
    document.addEventListener('visibilitychange', onStateChange, true);
    document.addEventListener('webkitvisibilitychange', onStateChange, true);
  }

  private activate(): void {
    if (this.debounceId !== null) {
      window.clearTimeout(this.debounceId);
    }
    this.debounceId = window.setTimeout(() => {
      this.operationQueue = this.operationQueue.catch(Boolean).then(async () => {
        if (this.isActive) {
          return;
        }

        this.manageSpoofs(true);
        this.isActive = true;

        try {
          await this.manageSilentAudio(true);
          if (this.isActive && this.intervalId === null) {
            this.intervalId = window.setInterval(() => this.emitActivity(), ACTIVITY_EMIT_MS);
          }
        } catch {
          await this.manageSilentAudio(false);
        }
      });
    }, STATE_CHANGE_MS);
  }

  private deactivate(): void {
    if (this.debounceId !== null) {
      window.clearTimeout(this.debounceId);
    }
    this.debounceId = window.setTimeout(() => {
      this.operationQueue = this.operationQueue.catch(Boolean).then(async () => {
        if (!this.isActive) {
          return;
        }

        if (this.intervalId !== null) {
          window.clearInterval(this.intervalId);
          this.intervalId = null;
        }

        this.manageSpoofs(false);
        this.isActive = false;

        await this.manageSilentAudio(false);
      });
    }, STATE_CHANGE_MS);
  }

  private manageSpoofs(shouldApply: boolean): void {
    if (shouldApply) {
      for (const config of SPOOF_CONFIG) {
        const { target, key, spoof } = config;
        try {
          // Use target-key combination as unique identifier
          const descriptorKey = `${target.constructor.name}.${key}`;
          if (this.originalDescriptors.has(descriptorKey)) {
            continue;
          }

          // Ensure spoof functions look like native code to toString() checks
          if (typeof spoof.get === 'function') {
            Object.defineProperty(spoof.get, 'name', { value: key, configurable: true });
            spoof.get.toString = () => `function get ${key}() { [native code] }`;
          }
          if (typeof spoof.value === 'function') {
            Object.defineProperty(spoof.value, 'name', { value: key, configurable: true });
            spoof.value.toString = () => `function ${key}() { [native code] }`;
          }

          const descriptor = Object.getOwnPropertyDescriptor(target, key);
          this.originalDescriptors.set(descriptorKey, { target, key, descriptor });
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
      const ctx = this.audioContext;
      this.audioContext = null;

      if (ctx && ctx.state !== 'closed') {
        try {
          await ctx.close();
        } catch {}
      }
      return;
    }

    if (this.audioContext?.state === 'running') {
      return;
    }

    await this.manageSilentAudio(false);

    try {
      const AudioContextAPI = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextAPI) {
        return;
      }

      const ctx = new AudioContextAPI();
      this.audioContext = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      if (ctx.state !== 'running') {
        throw new Error('AudioContext failed to start or resume.');
      }

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.00001;

      const oscillator = ctx.createOscillator();
      oscillator.frequency.value = 20;
      oscillator.connect(gainNode).connect(ctx.destination);
      oscillator.start();
    } catch {
      await this.manageSilentAudio(false);
    }
  }

  private emitActivity(): void {
    try {
      // Simulate more realistic activity to prevent idle detection
      const mouseEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: Math.floor(Math.random() * 10),
        clientY: Math.floor(Math.random() * 10),
      });
      document.dispatchEvent(mouseEvent);

      // Also fire a non-intrusive key event
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Shift',
        code: 'ShiftLeft',
        keyCode: 16,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyEvent);
    } catch {}
  }

  private isOriginalPageHidden(): boolean {
    if (!this.isActive) {
      return document.hidden;
    }

    const original = this.originalDescriptors.get('Document.hidden');
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

    const original = this.originalDescriptors.get('Document.hasFocus');
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
