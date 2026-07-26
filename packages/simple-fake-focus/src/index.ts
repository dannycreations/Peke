import { runOnImmediate } from '@/helpers/autorun';

const NATIVE_FN_BRAND = Symbol('native_fn_brand');

function markAsNative<T extends Function>(fn: T, name: string, length = 0, accessorType: false | 'get' | 'set' = false): T {
  const prefix = accessorType === 'get' ? 'get ' : accessorType === 'set' ? 'set ' : '';
  const nativeString = `function ${prefix}${name}() { [native code] }`;

  try {
    Object.defineProperties(fn, {
      name: { value: name, configurable: true, writable: false, enumerable: false },
      length: { value: length, configurable: true, writable: false, enumerable: false },
    });
  } catch {}

  Reflect.set(fn, NATIVE_FN_BRAND, nativeString);
  return fn;
}

runOnImmediate(() => {
  const origToString = Function.prototype.toString;

  const customToString = markAsNative(
    function toString(this: Function, ...args: unknown[]): string {
      if (typeof this === 'function' && Reflect.has(this, NATIVE_FN_BRAND)) {
        return Reflect.get(this, NATIVE_FN_BRAND) as string;
      }
      return Reflect.apply(origToString, this, args);
    },
    'toString',
    0,
  );

  try {
    Object.defineProperty(Function.prototype, 'toString', {
      value: customToString,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  } catch {}
});

class AudioBackgroundClock {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private intervalId: number | null = null;
  private tasks = new Map<number, { targetTime: number; callback: () => void }>();
  private nextTaskId = 1;
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;

    try {
      if (typeof AudioContext === 'undefined') return;

      this.audioCtx = new AudioContext();

      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.gainNode.gain.setValueAtTime(0.00001, this.audioCtx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      this.intervalId = window.setInterval(() => this.processTicks(), 16);
      this.isRunning = true;
    } catch {
      this.stop();
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.tasks.clear();

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch {}
      this.oscillator = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  public setTimeout(callback: () => void, delayMs: number): number {
    const id = this.nextTaskId++;
    const targetTime = performance.now() + delayMs;
    this.tasks.set(id, { targetTime, callback });
    return id;
  }

  public clearTimeout(id: number | null): void {
    if (id !== null) {
      this.tasks.delete(id);
    }
  }

  private processTicks(): void {
    if (this.tasks.size === 0) return;
    const now = performance.now();

    for (const [id, task] of Array.from(this.tasks.entries())) {
      if (now >= task.targetTime) {
        this.tasks.delete(id);
        try {
          task.callback();
        } catch {}
      }
    }
  }
}

interface UserInteraction {
  readonly movementX: number;
  readonly movementY: number;
  readonly delayMs: number;
}

class ActivitySpoofer {
  private isSpoofActive = false;
  private hasUserInteracted = false;
  private audioTimer = new AudioBackgroundClock();
  private timerTaskId: number | null = null;

  private interactionQueue: UserInteraction[] = [];
  private readonly maxQueueLength = 200;
  private lastRecordTimestamp = 0;
  private replayIndex = 0;

  private currentX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
  private currentY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;

  public constructor() {
    this.initUserInteractionTracking();
    this.applyStealthOverrides();
    this.initLifecycleListeners();
  }

  private initUserInteractionTracking(): void {
    const trackUserMouse = (e: PointerEvent): void => {
      if (!e.isTrusted) return;

      const now = performance.now();
      if (this.lastRecordTimestamp > 0) {
        const delayMs = Math.min(Math.max(now - this.lastRecordTimestamp, 10), 200);

        if (e.movementX !== 0 || e.movementY !== 0) {
          if (this.interactionQueue.length >= this.maxQueueLength) {
            this.interactionQueue.shift();
          }
          this.interactionQueue.push({
            movementX: e.movementX,
            movementY: e.movementY,
            delayMs,
          });
        }
      }
      this.lastRecordTimestamp = now;

      if (e.clientX > 0 || e.clientY > 0) {
        this.currentX = e.clientX;
        this.currentY = e.clientY;
      }
    };

    window.addEventListener('pointermove', trackUserMouse, { capture: true, passive: true });

    const handleUserGesture = (): void => {
      if (this.hasUserInteracted) return;
      this.hasUserInteracted = true;

      window.removeEventListener('mousedown', handleUserGesture, { capture: true });
      window.removeEventListener('keydown', handleUserGesture, { capture: true });
      window.removeEventListener('touchstart', handleUserGesture, { capture: true });
      window.removeEventListener('pointerdown', handleUserGesture, { capture: true });

      this.audioTimer.start();
      this.evaluateState();
    };

    window.addEventListener('mousedown', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleUserGesture, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleUserGesture, { capture: true, passive: true });
  }

  private applyStealthOverrides(): void {
    const self = this;

    const origHidden = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')?.get;
    const origVisibilityState = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState')?.get;
    const origHasFocus = Document.prototype.hasFocus;

    const getterHidden = markAsNative(
      function hidden(this: Document): boolean {
        if (!(this instanceof Document)) throw new TypeError('Illegal invocation');
        if (self.isSpoofActive) return false;
        return origHidden ? Reflect.apply(origHidden, this, []) : false;
      },
      'hidden',
      0,
      'get',
    );

    const getterVisibilityState = markAsNative(
      function visibilityState(this: Document): DocumentVisibilityState {
        if (!(this instanceof Document)) throw new TypeError('Illegal invocation');
        if (self.isSpoofActive) return 'visible';
        return origVisibilityState ? Reflect.apply(origVisibilityState, this, []) : 'visible';
      },
      'visibilityState',
      0,
      'get',
    );

    const fnHasFocus = markAsNative(
      function hasFocus(this: Document): boolean {
        if (!(this instanceof Document)) throw new TypeError('Illegal invocation');
        if (self.isSpoofActive) return true;
        return Reflect.apply(origHasFocus, this, []);
      },
      'hasFocus',
      0,
    );

    const fnFocus = markAsNative(
      function focus(this: Window): void {
        if (self.isSpoofActive) return;
        Window.prototype.focus.call(this);
      },
      'focus',
      0,
    );

    try {
      Object.defineProperty(Document.prototype, 'hidden', {
        get: getterHidden,
        configurable: true,
        enumerable: true,
      });

      Object.defineProperty(Document.prototype, 'visibilityState', {
        get: getterVisibilityState,
        configurable: true,
        enumerable: true,
      });

      Object.defineProperty(Document.prototype, 'hasFocus', {
        value: fnHasFocus,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      Object.defineProperty(Window.prototype, 'focus', {
        value: fnFocus,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } catch {}
  }

  private initLifecycleListeners(): void {
    const onStateChange = (): void => this.evaluateState();

    window.addEventListener('blur', onStateChange, { capture: true, passive: true });
    window.addEventListener('focus', onStateChange, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onStateChange, { capture: true, passive: true });

    this.evaluateState();
  }

  private evaluateState(): void {
    const isHidden = document.visibilityState === 'hidden';
    const isUnfocused = !document.hasFocus();

    const shouldSpoof = isHidden || isUnfocused;

    if (shouldSpoof && !this.isSpoofActive) {
      this.activate();
    } else if (!shouldSpoof && this.isSpoofActive) {
      this.deactivate();
    }
  }

  private activate(): void {
    this.isSpoofActive = true;
    if (this.hasUserInteracted) {
      this.audioTimer.start();
    }
    this.scheduleNextStep();
  }

  private deactivate(): void {
    this.isSpoofActive = false;
    this.audioTimer.clearTimeout(this.timerTaskId);
    this.timerTaskId = null;
    this.replayIndex = 0;
  }

  private scheduleNextStep(): void {
    if (!this.isSpoofActive) return;

    let step: UserInteraction;

    if (this.interactionQueue.length < 5) {
      step = this.generateSyntheticStep();
    } else {
      step = this.interactionQueue[this.replayIndex];
      this.replayIndex = (this.replayIndex + 1) % this.interactionQueue.length;
    }

    this.timerTaskId = this.audioTimer.setTimeout(() => {
      this.performStep(step);
      this.scheduleNextStep();
    }, step.delayMs);
  }

  private generateSyntheticStep(): UserInteraction {
    const angle = Math.random() * 0.4 - 0.2 + Date.now() / 1000;
    const distance = Math.random() * 1.5 + 0.5;
    return {
      movementX: Math.cos(angle) * distance,
      movementY: Math.sin(angle) * distance,
      delayMs: Math.floor(Math.random() * 20 + 20),
    };
  }

  private performStep(step: UserInteraction): void {
    const width = window.innerWidth || 1024;
    const height = window.innerHeight || 768;

    let deltaX = step.movementX;
    let deltaY = step.movementY;

    if (this.currentX + deltaX < 40 || this.currentX + deltaX > width - 40) {
      deltaX = -deltaX * 0.5;
    }
    if (this.currentY + deltaY < 40 || this.currentY + deltaY > height - 40) {
      deltaY = -deltaY * 0.5;
    }

    this.currentX = Math.max(40, Math.min(width - 40, this.currentX + deltaX));
    this.currentY = Math.max(40, Math.min(height - 40, this.currentY + deltaY));

    this.dispatchPointerEvents(Math.round(this.currentX), Math.round(this.currentY), deltaX, deltaY);
  }

  private dispatchPointerEvents(x: number, y: number, movementX: number, movementY: number): void {
    let targetEl: Element | null = null;

    try {
      targetEl = document.elementFromPoint(x, y);
    } catch {}

    if (!targetEl) {
      targetEl = document.documentElement || document.body;
    }

    if (!targetEl) return;

    const screenX = Math.round(x + window.screenX);
    const screenY = Math.round(y + window.screenY);

    const eventInit: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX: x,
      clientY: y,
      screenX,
      screenY,
      movementX: Math.round(movementX),
      movementY: Math.round(movementY),
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 0,
      button: -1,
    };

    try {
      const pointerEvt = new PointerEvent('pointermove', eventInit);
      const mouseEvt = new MouseEvent('mousemove', eventInit);

      targetEl.dispatchEvent(pointerEvt);
      targetEl.dispatchEvent(mouseEvt);
    } catch {}
  }
}

runOnImmediate(() => new ActivitySpoofer());
