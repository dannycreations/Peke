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
export function runOnDynamic(callback: () => unknown, options: DynamicOptions = {}): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length === 0) {
        continue;
      }

      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) {
          return;
        }

        if (!options.selector || node.matches(options.selector)) {
          callback();
        }
      });
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Executes a callback with mutation records whenever the document's body changes.
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
 * @returns {void}
 */
export function runOnObserver(callback: (mutations: MutationRecord[]) => unknown): void {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
