import { batch } from '@preact/signals';
import $ from 'jquery';
import { useCallback, useEffect, useRef } from 'preact/hooks';

import { runOnObserver } from '@peke/lib/helpers/autorun';
import { ActionType, HighlightState, StatusState, STORAGE_AUTORUN_KEY } from '../app/constants';
import { highlightedRuleIndex, highlightState, isAutoRun, isRunning, selectorList, status } from '../stores/useStore';
import { getStorage } from '../utilities/storage';

import type { Config, DelayKey, Rule } from '../app/types';

interface UseTaskRunnerProps {
  readonly cycleDelay: number;
  readonly stepDelay: number;
  readonly waitDelay: number;
  readonly onTimeout: () => void;
}

interface UseTaskRunnerReturn {
  readonly start: () => void;
  readonly stop: () => void;
}

export const useTaskRunner = ({ cycleDelay, stepDelay, waitDelay, onTimeout }: UseTaskRunnerProps): UseTaskRunnerReturn => {
  const storage = getStorage();
  const delaysRef = useRef<Pick<Config, DelayKey>>({ stepDelay, waitDelay, cycleDelay });

  useEffect(() => {
    delaysRef.current = { stepDelay, waitDelay, cycleDelay };
  }, [stepDelay, waitDelay, cycleDelay]);

  const executeRuleAction = useCallback(
    (rule: Rule) => {
      if (rule.action === ActionType.STOP) {
        batch(() => {
          isRunning.value = false;
          isAutoRun.value = false;
          status.value = StatusState.STOPPED;
        });
        storage.setItem(STORAGE_AUTORUN_KEY, 'false');
        return;
      }

      const $element = $(rule.selector).first();
      if ($element.length === 0) return;

      switch (rule.action) {
        case ActionType.CLICK: {
          $element[0].scrollIntoView({ block: 'center' });
          $element.trigger('click');
          break;
        }
        case ActionType.DELETE: {
          const { customSelector, deleteActionType, parentSelector } = rule.options;
          switch (deleteActionType) {
            case 'self':
              $element.remove();
              break;
            case 'parent':
              if (parentSelector) $element.closest(parentSelector).remove();
              break;
            case 'custom':
              if (customSelector) $(customSelector).remove();
              break;
          }
          break;
        }
      }
    },
    [storage],
  );

  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitCleanupsRef = useRef<Set<() => void>>(new Set());

  const waitForElement = useCallback((rule: Rule, timeoutMs: number): Promise<boolean> => {
    const { selector, options } = rule;
    if (options.ignoreWait) return Promise.resolve(true);
    if ($(selector).length > 0) return Promise.resolve(true);
    if (timeoutMs <= 0) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let observer: MutationObserver | null = null;

      const finish = (found: boolean) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        waitCleanupsRef.current.delete(abort);
        resolve(found);
      };

      const abort = () => finish(false);

      waitCleanupsRef.current.add(abort);

      observer = runOnObserver(() => {
        if ($(selector).length > 0) {
          finish(true);
        }
      });

      timeoutId = setTimeout(() => finish(false), timeoutMs);
    });
  }, []);

  const cancelPendingWork = useCallback(() => {
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    for (const abort of waitCleanupsRef.current) {
      abort();
    }
    waitCleanupsRef.current.clear();
  }, []);

  const runCycle = useCallback(async () => {
    while (isRunning.value) {
      const currentList = selectorList.value;
      if (currentList.length === 0) break;

      for (let i = 0; i < currentList.length; i++) {
        const rule = currentList[i];
        if (!isRunning.value) return;

        batch(() => {
          highlightedRuleIndex.value = i;
          highlightState.value = HighlightState.WAITING;
        });

        const elementFound = await waitForElement(rule, delaysRef.current.waitDelay);
        if (!isRunning.value) return;

        if (elementFound) {
          executeRuleAction(rule);
          highlightState.value = HighlightState.SUCCESS;
        } else if (!rule.options.ignoreWait) {
          onTimeout();
          return;
        }

        if (!rule.options.ignoreWait && delaysRef.current.stepDelay > 0 && isRunning.value) {
          await new Promise<void>((resolve) => {
            stepTimeoutRef.current = setTimeout(() => {
              stepTimeoutRef.current = null;
              resolve();
            }, delaysRef.current.stepDelay);
          });
        }

        batch(() => {
          highlightState.value = HighlightState.IDLE;
          highlightedRuleIndex.value = null;
        });
      }

      if (isRunning.value && delaysRef.current.cycleDelay > 0) {
        await new Promise<void>((resolve) => {
          cycleTimeoutRef.current = setTimeout(() => {
            cycleTimeoutRef.current = null;
            resolve();
          }, delaysRef.current.cycleDelay);
        });
      }
    }
  }, [executeRuleAction, onTimeout, waitForElement]);

  const start = useCallback(() => {
    if (selectorList.value.length === 0 || isRunning.value) {
      return;
    }

    isRunning.value = true;
    status.value = StatusState.RUNNING;
  }, []);

  const stop = useCallback(() => {
    if (!isRunning.value) {
      return;
    }

    isRunning.value = false;
    status.value = StatusState.STOPPED;
    cancelPendingWork();
  }, [cancelPendingWork]);

  useEffect(() => {
    if (isRunning.value) {
      void runCycle();
    }

    return cancelPendingWork;
  }, [isRunning.value, runCycle, cancelPendingWork]);

  return { start, stop };
};
