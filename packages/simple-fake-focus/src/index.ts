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

// Emitter timing constants
const BURST_INTERVAL_MIN_MS: number = 15000;
const BURST_INTERVAL_MAX_MS: number = 45000;
const STEP_INTERVAL_MIN_MS: number = 150;
const STEP_INTERVAL_MAX_MS: number = 400;

const BURST_ACTIONS_MIN: number = 3;
const BURST_ACTIONS_MAX: number = 8;

const KEY_DURATION_MIN_MS: number = 50;
const KEY_DURATION_MAX_MS: number = 150;

class ActivitySpoofer {
  private isActive: boolean = false;
  private hasUserInteracted: boolean = false;
  private debounceId: number | null = null;
  private audioContext: AudioContext | null = null;
  private operationQueue: Promise<void> = Promise.resolve();

  // Activity emitter states
  private activityTimeoutId: number | null = null;
  private actionsRemainingInBurst: number = 0;
  private lastRealX: number = window.innerWidth / 2;
  private lastRealY: number = window.innerHeight / 2;
  private virtualX: number = window.innerWidth / 2;
  private virtualY: number = window.innerHeight / 2;
  private burstTargetX: number = window.innerWidth / 2;
  private burstTargetY: number = window.innerHeight / 2;

  private readonly originalDescriptors: Map<string, OriginalDescriptorInfo> = new Map();

  public constructor() {
    // Track real mouse position when the user actually interacts with the page
    const trackRealMouse = (e: MouseEvent | PointerEvent): void => {
      this.lastRealX = e.clientX;
      this.lastRealY = e.clientY;
    };
    window.addEventListener('mousemove', trackRealMouse, { capture: true, passive: true });
    window.addEventListener('pointermove', trackRealMouse, { capture: true, passive: true });

    const handleUserInteraction = (): void => {
      if (this.hasUserInteracted) return;
      this.hasUserInteracted = true;

      window.removeEventListener('mousedown', handleUserInteraction, { capture: true });
      window.removeEventListener('keydown', handleUserInteraction, { capture: true });
      window.removeEventListener('touchstart', handleUserInteraction, { capture: true });
      window.removeEventListener('pointerdown', handleUserInteraction, { capture: true });

      if (this.isActive) {
        this.activate();
      } else {
        this.manageSilentAudio(true).catch(() => {});
      }
    };

    window.addEventListener('mousedown', handleUserInteraction, { capture: true });
    window.addEventListener('keydown', handleUserInteraction, { capture: true });
    window.addEventListener('touchstart', handleUserInteraction, { capture: true });
    window.addEventListener('pointerdown', handleUserInteraction, { capture: true });

    const onStateChange = (event?: Event): void => {
      const isHidden = this.isOriginalPageHidden();
      const isFocused = this.isOriginalPageFocused();

      const shouldBeActive = isHidden || !isFocused;

      if (shouldBeActive) {
        this.manageSpoofs(true);
        this.activate();
      } else {
        this.manageSpoofs(false);
        this.deactivate();
      }

      if (event && (event.target === window || event.target === document)) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    onStateChange();

    window.addEventListener('blur', onStateChange, { capture: true });
    window.addEventListener('focus', onStateChange, { capture: true });
    document.addEventListener('visibilitychange', onStateChange, { capture: true });
    document.addEventListener('webkitvisibilitychange', onStateChange, { capture: true });
  }

  private activate(): void {
    if (this.debounceId !== null) window.clearTimeout(this.debounceId);
    this.debounceId = window.setTimeout(() => {
      this.operationQueue = this.operationQueue
        .catch(() => {})
        .then(async () => {
          if (this.isActive) return;

          this.isActive = true;

          try {
            await this.manageSilentAudio(true);
            if (this.isActive && this.activityTimeoutId === null) {
              this.virtualX = this.lastRealX;
              this.virtualY = this.lastRealY;
              this.scheduleNextActivity();
            }
          } catch {
            await this.manageSilentAudio(false);
          }
        });
    }, STATE_CHANGE_MS);
  }

  private deactivate(): void {
    if (this.debounceId !== null) window.clearTimeout(this.debounceId);
    this.debounceId = window.setTimeout(() => {
      this.operationQueue = this.operationQueue
        .catch(() => {})
        .then(async () => {
          if (!this.isActive) return;

          this.isActive = false;

          if (this.activityTimeoutId !== null) {
            window.clearTimeout(this.activityTimeoutId);
            this.activityTimeoutId = null;
          }

          await this.manageSilentAudio(false);
        });
    }, STATE_CHANGE_MS);
  }

  private manageSpoofs(shouldApply: boolean): void {
    if (shouldApply) {
      for (let i = 0; i < SPOOF_CONFIG.length; i++) {
        const config = SPOOF_CONFIG[i];
        const { target, key, spoof } = config;

        try {
          const targetName = target.constructor ? target.constructor.name : 'Unknown';
          const descriptorKey = `${targetName}.${key}`;
          if (this.originalDescriptors.has(descriptorKey)) {
            continue;
          }

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

    if (!this.hasUserInteracted) {
      return;
    }

    if (this.audioContext?.state === 'running') {
      return;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch {}
      }
      return;
    }

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

  private scheduleNextActivity(): void {
    if (this.activityTimeoutId !== null) {
      window.clearTimeout(this.activityTimeoutId);
      this.activityTimeoutId = null;
    }

    if (!this.isActive) return;

    let delay = 0;

    if (this.actionsRemainingInBurst > 0) {
      delay = Math.floor(Math.random() * (STEP_INTERVAL_MAX_MS - STEP_INTERVAL_MIN_MS + 1)) + STEP_INTERVAL_MIN_MS;
    } else {
      delay = Math.floor(Math.random() * (BURST_INTERVAL_MAX_MS - BURST_INTERVAL_MIN_MS + 1)) + BURST_INTERVAL_MIN_MS;
      this.actionsRemainingInBurst = Math.floor(Math.random() * (BURST_ACTIONS_MAX - BURST_ACTIONS_MIN + 1)) + BURST_ACTIONS_MIN;
      this.burstTargetX = Math.floor(Math.random() * window.innerWidth);
      this.burstTargetY = Math.floor(Math.random() * window.innerHeight);
    }

    this.activityTimeoutId = window.setTimeout(() => {
      this.performSimulatedActivity();
      this.scheduleNextActivity();
    }, delay);
  }

  private performSimulatedActivity(): void {
    try {
      if (this.actionsRemainingInBurst > 0) {
        const rand = Math.random();
        if (rand < 0.85) {
          this.simulateMouseMove();
        } else if (rand < 0.95) {
          this.simulateScroll();
        } else {
          this.simulateKeyPress();
        }
        this.actionsRemainingInBurst--;
      } else {
        if (Math.random() < 0.3) {
          this.simulateScroll();
        } else {
          this.simulateMouseMove();
        }
      }
    } catch {}
  }

  private simulateMouseMove(): void {
    const stepX = (this.burstTargetX - this.virtualX) * 0.15 + (Math.random() - 0.5) * 10;
    const stepY = (this.burstTargetY - this.virtualY) * 0.15 + (Math.random() - 0.5) * 10;

    this.virtualX = Math.max(0, Math.min(window.innerWidth, this.virtualX + stepX));
    this.virtualY = Math.max(0, Math.min(window.innerHeight, this.virtualY + stepY));

    const x = Math.round(this.virtualX);
    const y = Math.round(this.virtualY);
    const mx = Math.round(stepX);
    const my = Math.round(stepY);

    const targetEl = document.elementFromPoint(x, y) || document.documentElement;

    const pointerEvent = new PointerEvent('pointermove', {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      movementX: mx,
      movementY: my,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
    });
    targetEl.dispatchEvent(pointerEvent);

    const mouseEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX: x + window.screenX,
      screenY: y + window.screenY,
      movementX: mx,
      movementY: my,
    });
    targetEl.dispatchEvent(mouseEvent);
  }

  private simulateScroll(): void {
    const deltaY = Math.round((Math.random() - 0.5) * 60);
    const x = Math.round(this.virtualX);
    const y = Math.round(this.virtualY);
    const targetEl = document.elementFromPoint(x, y) || document.documentElement;

    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      deltaY: deltaY,
      deltaMode: 0,
    });
    targetEl.dispatchEvent(wheelEvent);

    window.dispatchEvent(new Event('scroll', { bubbles: false, cancelable: false }));
    document.dispatchEvent(new Event('scroll', { bubbles: false, cancelable: false }));
  }

  private simulateKeyPress(): void {
    const keys = [
      { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
      { key: 'Control', code: 'ControlLeft', keyCode: 17 },
      { key: 'Alt', code: 'AltLeft', keyCode: 18 },
    ];
    const choice = keys[Math.floor(Math.random() * keys.length)];

    const activeEl = document.activeElement || document.body || document.documentElement;

    const keydownEvent = new KeyboardEvent('keydown', {
      key: choice.key,
      code: choice.code,
      keyCode: choice.keyCode,
      which: choice.keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
    });
    activeEl.dispatchEvent(keydownEvent);

    window.setTimeout(
      () => {
        const keyupEvent = new KeyboardEvent('keyup', {
          key: choice.key,
          code: choice.code,
          keyCode: choice.keyCode,
          which: choice.keyCode,
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
        });
        activeEl.dispatchEvent(keyupEvent);
      },
      Math.floor(Math.random() * (KEY_DURATION_MAX_MS - KEY_DURATION_MIN_MS + 1)) + KEY_DURATION_MIN_MS,
    );
  }

  private isOriginalPageHidden(): boolean {
    const original = this.originalDescriptors.get('Document.hidden');
    if (original?.descriptor && 'get' in original.descriptor && typeof original.descriptor.get === 'function') {
      try {
        return original.descriptor.get.call(document) as boolean;
      } catch {}
    }
    return document.hidden;
  }

  private isOriginalPageFocused(): boolean {
    const original = this.originalDescriptors.get('Document.hasFocus');
    if (original?.descriptor && 'value' in original.descriptor && typeof original.descriptor.value === 'function') {
      try {
        return original.descriptor.value.call(document) as boolean;
      } catch {}
    }
    return document.hasFocus();
  }
}

runOnImmediate(() => new ActivitySpoofer());

declare global {
  interface Window {
    readonly webkitAudioContext: typeof AudioContext;
  }
}
