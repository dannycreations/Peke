/**
 * Executes a callback function immediately.
 *
 * @example
 * ```typescript
 * runOnImmediate(() => {
 *   console.log('This code runs right away.');
 * });
 * ```
 *
 * @param {() => unknown} callback The function to execute.
 * @returns {void}
 */
export function runOnImmediate(callback: () => unknown): void {
  callback();
}

/**
 * Executes a callback when the DOM is interactive (`DOMContentLoaded`).
 * If the document is already interactive or complete, the callback is run immediately.
 *
 * @example
 * ```typescript
 * runOnInteractive(() => {
 *   console.log('DOM is ready for interaction.');
 * });
 * ```
 *
 * @param {() => unknown} callback The function to execute upon DOM interactivity.
 * @returns {void}
 */
export function runOnInteractive(callback: () => unknown): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Executes a callback when the page has fully loaded, including all resources like images and stylesheets.
 * If the page is already fully loaded, the callback is run immediately.
 *
 * @example
 * ```typescript
 * runOnComplete(() => {
 *   console.log('Page and all resources are fully loaded.');
 * });
 * ```
 *
 * @param {() => unknown} callback The function to execute upon full page load.
 * @returns {void}
 */
export function runOnComplete(callback: () => unknown): void {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

/**
 * Defines configuration options for the {@link runOnDynamic} function.
 */
export interface DynamicOptions {
  /**
   * A CSS selector to filter which added nodes trigger the callback.
   * If omitted, the callback runs for any added `HTMLElement`.
   */
  readonly selector?: string;
}

/**
 * Executes a callback whenever new nodes are added to the document's body.
 * This is useful for scripts that need to act on dynamically added content.
 *
 * @example
 * ```typescript
 * // Run for any new element added to the body
 * runOnDynamic(() => {
 *   console.log('A new element was added to the body.');
 * });
 *
 * // Run only when an element with the class 'widget' is added
 * runOnDynamic(() => {
 *   console.log('A new widget was added.');
 * }, { selector: '.widget' });
 * ```
 *
 * @param {() => unknown} callback The function to execute when a matching node is added.
 * @param {DynamicOptions=} [options={}] Configuration options, such as a CSS selector to filter nodes.
 *   See {@link DynamicOptions}.
 * @returns {void}
 */
export function runOnDynamic(callback: () => unknown, options: DynamicOptions = {}): MutationObserver {
  const { selector } = options;

  return runOnObserver((mutations) => {
    const shouldTrigger = mutations.some((mutation) =>
      Array.prototype.some.call(mutation.addedNodes, (node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }

        if (!selector || node.matches(selector)) {
          return true;
        }

        return selector && node.querySelector(selector) !== null;
      }),
    );

    if (shouldTrigger) {
      callback();
    }
  });
}

/**
 * Defines configuration options for the {@link runOnObserver} function.
 */
export interface ObserverOptions {
  /**
   * The DOM node to observe for mutations.
   * If omitted, `document.body` is used as the default target.
   */
  readonly target?: Node;

  /**
   * Configuration options for the `MutationObserver`.
   * These options extend the default configuration: `{ childList: true, subtree: true }`.
   */
  readonly options?: MutationObserverInit;
}

/**
 * Executes a callback with mutation records whenever changes occur within the specified DOM subtree.
 * This provides a low-level interface to the `MutationObserver` API.
 *
 * @example
 * ```typescript
 * runOnObserver((mutations) => {
 *   for (const mutation of mutations) {
 *     if (mutation.type === 'childList') {
 *       console.log('A child node has been added or removed.');
 *     }
 *   }
 * });
 * ```
 *
 * @param {(mutations: MutationRecord[]) => unknown} callback The function to execute with the mutation records.
 * @param {ObserverOptions=} [initOptions={}] Configuration options, such as the target node and observer settings.
 *   See {@link ObserverOptions}.
 * @returns {void}
 */
export function runOnObserver(callback: (mutations: MutationRecord[]) => unknown, initOptions: ObserverOptions = {}): MutationObserver {
  const { target = document.body, options = {} } = initOptions;

  const observer = new MutationObserver((mutations, obs) => {
    try {
      callback(mutations);
    } catch (error) {
      obs.disconnect();
      throw error;
    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
    ...options,
  });

  return observer;
}
