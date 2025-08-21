/**
 * Defines the possible page loading stages for callback execution.
 * - `immediate`: Executes the callback without delay.
 * - `interactive`: Executes when the DOM is fully parsed and loaded (`DOMContentLoaded`).
 * - `complete`: Executes after the entire page, including all dependent resources
 *   like stylesheets and images, has finished loading (`load` event).
 * - `dynamic`: Executes when a new DOM node, optionally matching a specific
 *   selector, is added to the document body.
 */
export type PageStage = 'immediate' | 'interactive' | 'complete' | 'dynamic';

/**
 * Defines configuration options for the {@link setAutorun} function.
 */
export interface SetAutorunOptions {
  /**
   * A CSS selector string. When `stage` is 'dynamic', the callback is only
   * triggered for added nodes that match this selector. If undefined, the
   * callback runs for any added `HTMLElement`.
   */
  readonly dynamicSelector?: string;
}

/**
 * Schedules a callback function to execute at a specified document loading stage.
 *
 * @example
 * ```typescript
 * // Run a function as soon as the DOM is interactive.
 * setAutorun('interactive', () => {
 *   console.log('DOM is ready!');
 * });
 *
 * // Run a function when a specific element is dynamically added to the page.
 * setAutorun('dynamic', initComplexComponent, {
 *   dynamicSelector: '#complex-component-root'
 * });
 * ```
 *
 * @param {PageStage} stage The page loading stage at which to execute the callback. See {@link PageStage}.
 * @param {() => unknown} callback The function to execute when the specified stage is reached.
 * @param {Partial<SetAutorunOptions>=} [options={}] Configuration options, primarily for the 'dynamic' stage. See {@link SetAutorunOptions}.
 * @returns {void}
 */
export function setAutorun(stage: PageStage, callback: () => unknown, options: Partial<SetAutorunOptions> = {}): void {
  switch (stage) {
    case 'immediate':
    default:
      callback();
      break;

    case 'interactive': {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
      } else {
        callback();
      }
      break;
    }

    case 'complete': {
      if (document.readyState === 'complete') {
        callback();
      } else {
        window.addEventListener('load', callback);
      }
      break;
    }

    case 'dynamic': {
      const observer = new MutationObserver((mutations: MutationRecord[]) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length === 0) {
            continue;
          }

          mutation.addedNodes.forEach((node: Node) => {
            if (!(node instanceof HTMLElement)) {
              return;
            }

            if (!options.dynamicSelector || node.matches(options.dynamicSelector)) {
              callback();
            }
          });
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      break;
    }
  }
}
