const LOCATION_CHANGE_EVENT = 'ms-locationchange';

export function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0];
  if (clean.length > 1 && clean.endsWith('/')) {
    return clean.slice(0, -1);
  }
  return clean || '/';
}

export function getCurrentPath(): string {
  return normalizePath(window.location.pathname);
}

let lastRawPath = window.location.pathname;
let lastPath = normalizePath(lastRawPath);
let isWatching = false;

export function notifyLocationChange(): void {
  const rawPath = window.location.pathname;
  if (rawPath === lastRawPath) return;
  lastRawPath = rawPath;

  const path = normalizePath(rawPath);
  if (path === lastPath) return;

  lastPath = path;
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT));
}

export function watchLocation(): void {
  if (isWatching) return;
  isWatching = true;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
    const result = originalPushState.apply(this, args);
    notifyLocationChange();
    return result;
  };

  window.history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) {
    const result = originalReplaceState.apply(this, args);
    notifyLocationChange();
    return result;
  };

  window.addEventListener('popstate', notifyLocationChange);
  window.addEventListener('hashchange', notifyLocationChange);
}

export function onLocationChange(handler: () => void): () => void {
  window.addEventListener(LOCATION_CHANGE_EVENT, handler);
  return () => window.removeEventListener(LOCATION_CHANGE_EVENT, handler);
}
