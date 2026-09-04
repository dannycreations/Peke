import $ from 'jquery';
import { useCallback, useEffect, useRef } from 'preact/hooks';

import { runOnObserver } from '@peke/lib/helpers/autorun';
import { useStorage } from '@peke/lib/hooks/useStorage';
import { ActionType, HighlightState, StatusState, STORAGE_AUTORUN_KEY } from '../app/constants';
import { isRunning, selectorList, useStore } from '../stores/useStore';

import type { Config, Rule } from '../app/types';

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
  const storage = useStorage();
  const delaysRef = useRef<Pick<Config, 'stepDelay' | 'waitDelay' | 'cycleDelay'>>({ stepDelay, waitDelay, cycleDelay });

  useEffect(() => {
    delaysRef.current = { stepDelay, waitDelay, cycleDelay };
  }, [stepDelay, waitDelay, cycleDelay]);

  const executeRuleAction = useCallback(
    (rule: Rule) => {
      if (rule.action === ActionType.STOP) {
        useStore.batchUpdate(() => {
          useStore.setIsRunning(false);
          useStore.setIsAutoRun(false);
          useStore.setStatus(StatusState.STOPPED);
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

  const cleanupWaitObservers = useCallback(() => {
    for (const cleanup of waitCleanupsRef.current) {
      cleanup();
    }
    waitCleanupsRef.current.clear();
  }, []);

  const waitForElement = useCallback((rule: Rule, timeoutMs: number): Promise<boolean> => {
    const { selector, options } = rule;
    if (options.ignoreWait) return Promise.resolve(true);
    if ($(selector).length > 0) return Promise.resolve(true);
    if (timeoutMs <= 0) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let observer: MutationObserver | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        waitCleanupsRef.current.delete(cleanup);
      };

      waitCleanupsRef.current.add(cleanup);

      observer = runOnObserver(() => {
        if ($(selector).length > 0) {
          cleanup();
          resolve(true);
        }
      });

      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
    });
  }, []);

  const runCycle = useCallback(async () => {
    while (isRunning.value) {
      const currentList = selectorList.value;
      if (currentList.length === 0) break;

      for (let i = 0; i < currentList.length; i++) {
        const rule = currentList[i];
        if (!isRunning.value) return;

        useStore.batchUpdate(() => {
          useStore.setHighlightedRuleIndex(i);
          useStore.setHighlightState(HighlightState.WAITING);
        });

        const elementFound = await waitForElement(rule, delaysRef.current.waitDelay);
        if (!isRunning.value) return;

        if (elementFound) {
          executeRuleAction(rule);
          useStore.setHighlightState(HighlightState.SUCCESS);
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

        useStore.batchUpdate(() => {
          useStore.setHighlightState(HighlightState.IDLE);
          useStore.setHighlightedRuleIndex(null);
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

    useStore.setIsRunning(true);
    useStore.setStatus(StatusState.RUNNING);
  }, []);

  const stop = useCallback(() => {
    if (!isRunning.value) {
      return;
    }

    useStore.setIsRunning(false);
    useStore.setStatus(StatusState.STOPPED);

    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
    cleanupWaitObservers();
  }, [cleanupWaitObservers]);

  useEffect(() => {
    let isCancelled: boolean = false;
    if (isRunning.value) {
      const cycle = async (): Promise<void> => {
        if (!isCancelled) {
          await runCycle();
        }
      };
      cycle();
    }
    return () => {
      isCancelled = true;
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
        cycleTimeoutRef.current = null;
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
        stepTimeoutRef.current = null;
      }
      cleanupWaitObservers();
    };
  }, [isRunning.value, runCycle, cleanupWaitObservers]);

  return { start, stop };
};
