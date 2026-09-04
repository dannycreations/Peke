import { runOnImmediate } from '@peke/lib/helpers/autorun';

const nativeSource = new WeakMap<Function, string>();

function asNative<F extends Function>(fn: F, name: string, prefix: '' | 'get ' = ''): F {
  Object.defineProperty(fn, 'name', { value: name, configurable: true });
  nativeSource.set(fn, `function ${prefix}${name}() { [native code] }`);
  return fn;
}

function installToStringMask(): void {
  const original = Function.prototype.toString;
  const masked = asNative(function toString(this: Function, ...args: unknown[]): string {
    return nativeSource.get(this) ?? Reflect.apply(original, this, args);
  }, 'toString');

  Object.defineProperty(Function.prototype, 'toString', { value: masked, writable: true, configurable: true });
}

function patch<F extends Function>(proto: object, prop: string, kind: 'get' | 'value', wrap: (real: F) => F): F {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  if (!desc || typeof desc[kind] !== 'function') {
    const delegate = function (this: unknown, ...args: unknown[]) {
      const value = (this as Record<string, unknown>)[prop];
      if (typeof value === 'function') {
        return (value as Function).apply(this, args);
      }
      return undefined;
    } as unknown as F;
    return delegate;
  }

  const real = desc[kind] as F;
  const fake = asNative(wrap(real), prop, kind === 'get' ? 'get ' : '');
  Object.defineProperty(proto, prop, { ...desc, [kind]: fake });
  return real;
}

class BackgroundTimer {
  private audio: AudioContext | null = null;
  private interval: number | undefined;
  private pending: { at: number; run: () => void } | null = null;

  public schedule(run: () => void, delayMs: number): void {
    this.pending = { at: performance.now() + delayMs, run };
    this.interval ??= window.setInterval(() => this.tick(), 16);
  }

  public cancel(): void {
    this.pending = null;
  }

  public setBackground(on: boolean): void {
    if (on) this.ensureAudio();
    void (on ? this.audio?.resume() : this.audio?.suspend())?.catch(() => {});
  }

  private ensureAudio(): void {
    if (this.audio || typeof AudioContext === 'undefined' || !navigator.userActivation?.hasBeenActive) return;

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    const osc = ctx.createOscillator();
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    this.audio = ctx;
  }

  private tick(): void {
    if (!this.pending) {
      clearInterval(this.interval);
      this.interval = undefined;
      return;
    }
    if (performance.now() < this.pending.at) return;

    const { run } = this.pending;
    this.pending = null;
    run();
  }
}

interface Movement {
  readonly dx: number;
  readonly dy: number;
  readonly delay: number;
}

const EDGE = 40;
const MAX_SAMPLES = 300;
const MIN_SAMPLES = 20;
const STROKE_GAP_MS = 200;

const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

class BackgroundActivity {
  private active = false;
  private readonly timer = new BackgroundTimer();
  private readonly real: { visibility(): DocumentVisibilityState; focused(): boolean };

  private x = innerWidth / 2;
  private y = innerHeight / 2;
  private screenOffsetX = screenX;
  private screenOffsetY = screenY + (outerHeight - innerHeight);
  private heading = rand(0, Math.PI * 2);

  private readonly samples: Movement[] = [];
  private lastSampleAt = 0;
  private replayAt = 0;
  private burstLeft = 0;

  public constructor() {
    this.real = this.patchDom();
    this.observeUser();
    this.observeLifecycle();
    this.sync();
  }

  private patchDom() {
    const spoofing = (): boolean => this.active;

    const visibility = patch(
      Document.prototype,
      'visibilityState',
      'get',
      (real) =>
        function (this: Document): DocumentVisibilityState {
          const actual = real.call(this);
          return spoofing() ? 'visible' : actual;
        },
    );

    patch(
      Document.prototype,
      'hidden',
      'get',
      (real) =>
        function (this: Document): boolean {
          const actual = real.call(this);
          return spoofing() ? false : actual;
        },
    );

    const hasFocus = patch(
      Document.prototype,
      'hasFocus',
      'value',
      (real) =>
        function (this: Document): boolean {
          const actual = real.call(this);
          return spoofing() ? true : actual;
        },
    );

    patch(
      Window.prototype,
      'focus',
      'value',
      (real) =>
        function (this: Window): void {
          if (!spoofing()) real.call(this);
        },
    );

    return {
      visibility: () => visibility.call(document) as DocumentVisibilityState,
      focused: () => hasFocus.call(document) as boolean,
    };
  }

  private observeUser(): void {
    addEventListener('pointermove', (e) => e.isTrusted && this.record(e), { capture: true, passive: true });
  }

  private observeLifecycle(): void {
    const onChange = (e: Event): void => {
      this.sync();
      if (this.active)
        // Page never sees the background transition
        e.stopImmediatePropagation();
    };

    addEventListener('blur', onChange, true);
    addEventListener('focus', onChange, true);
    document.addEventListener('visibilitychange', onChange, true);
  }

  private record(e: PointerEvent): void {
    const gap = performance.now() - this.lastSampleAt;
    this.lastSampleAt += gap;

    this.x = e.clientX;
    this.y = e.clientY;
    this.screenOffsetX = e.screenX - e.clientX;
    this.screenOffsetY = e.screenY - e.clientY;

    // New stroke, not a step
    if (gap > STROKE_GAP_MS || (e.movementX === 0 && e.movementY === 0)) return;

    this.samples.push({ dx: e.movementX, dy: e.movementY, delay: gap });
    if (this.samples.length > MAX_SAMPLES) this.samples.shift();
  }

  private sync(): void {
    const shouldSpoof = this.real.visibility() === 'hidden' || !this.real.focused();
    if (shouldSpoof === this.active) return;

    this.active = shouldSpoof;
    this.timer.setBackground(shouldSpoof);

    if (shouldSpoof) this.step();
    else this.timer.cancel();
  }

  private step(): void {
    if (!this.active) return;

    if (this.burstLeft <= 0) {
      this.burstLeft = Math.round(rand(4, 40));
      this.replayAt = Math.floor(Math.random() * this.samples.length);
      this.timer.schedule(() => this.step(), rand(400, 4000));
      return;
    }

    this.burstLeft--;
    const move = this.samples.length >= MIN_SAMPLES ? this.replay() : this.wander();
    this.moveBy(move.dx * rand(0.85, 1.15), move.dy * rand(0.85, 1.15));
    this.timer.schedule(() => this.step(), move.delay * rand(0.85, 1.15));
  }

  private replay(): Movement {
    const move = this.samples[this.replayAt];
    this.replayAt = (this.replayAt + 1) % this.samples.length;
    return move;
  }

  private wander(): Movement {
    this.heading += rand(-0.5, 0.5);
    const speed = rand(0.5, 3);
    return { dx: Math.cos(this.heading) * speed, dy: Math.sin(this.heading) * speed, delay: rand(12, 40) };
  }

  private moveBy(dx: number, dy: number): void {
    const maxX = innerWidth - EDGE;
    const maxY = innerHeight - EDGE;

    if (this.x + dx < EDGE || this.x + dx > maxX) {
      dx = -dx;
      this.heading = Math.PI - this.heading;
    }
    if (this.y + dy < EDGE || this.y + dy > maxY) {
      dy = -dy;
      this.heading = -this.heading;
    }

    this.x = clamp(this.x + dx, EDGE, maxX);
    this.y = clamp(this.y + dy, EDGE, maxY);
    this.dispatch(dx, dy);
  }

  private dispatch(dx: number, dy: number): void {
    const clientX = Math.round(this.x);
    const clientY = Math.round(this.y);
    const target = document.elementFromPoint(clientX, clientY) ?? document.documentElement;

    const init: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY,
      screenX: clientX + this.screenOffsetX,
      screenY: clientY + this.screenOffsetY,
      movementX: Math.round(dx),
      movementY: Math.round(dy),
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 0,
      button: -1,
    };

    target.dispatchEvent(new PointerEvent('pointermove', init));
    target.dispatchEvent(new MouseEvent('mousemove', { ...init, button: 0 }));
  }
}

runOnImmediate(() => {
  installToStringMask();
  new BackgroundActivity();
});
