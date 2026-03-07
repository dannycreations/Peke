import { useStorage } from '@/hooks/useStorage';
import { delay } from 'es-toolkit';
import $ from 'jquery';
import { useCallback, useEffect, useRef } from 'preact/hooks';

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

  const executeRuleAction = useCallback((rule: Rule) => {
    if (rule.action === ActionType.STOP) {
      useStore.setIsRunning(false);
      useStore.setIsAutoRun(false);
      useStore.setStatus(StatusState.STOPPED);
      storage.setItem(STORAGE_AUTORUN_KEY, 'false');
      return;
    }

    const element = $(rule.selector).first();
    if (element.length === 0) {
      return;
    }

    switch (rule.action) {
      case ActionType.CLICK: {
        element[0].scrollIntoView({
          block: 'center',
        });
        element.trigger('click');
        break;
      }
      case ActionType.DELETE: {
        const { customSelector, deleteActionType, parentSelector } = rule.options;
        if (deleteActionType === 'self') {
          element.remove();
        } else if (deleteActionType === 'parent' && parentSelector) {
          element.closest(parentSelector)?.remove();
        } else if (deleteActionType === 'custom' && customSelector) {
          $(customSelector).each((_: number, el: HTMLElement) => {
            $(el).remove();
          });
        }
        break;
      }
    }
  }, []);

  const waitForElement = useCallback(async (rule: Rule, timeoutMs: number): Promise<boolean> => {
    if ($(rule.selector).length > 0) {
      return true;
    }

    if (rule.options.ignoreWait) {
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const observer = new MutationObserver(() => {
        if ($(rule.selector).length > 0) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(false);
      }, timeoutMs);
    });
  }, []);

  const runCycle = useCallback(async () => {
    while (isRunning.value) {
      for (const [index, rule] of selectorList.value.entries()) {
        if (!isRunning.value) {
          return;
        }

        useStore.setHighlightedRuleIndex(index);
        useStore.setHighlightState(HighlightState.WAITING);

        const timeoutMs: number = delaysRef.current.waitDelay;
        const elementFound: boolean = await waitForElement(rule, timeoutMs);

        if (!isRunning.value) {
          return;
        }

        if (elementFound) {
          executeRuleAction(rule);
          useStore.setHighlightState(HighlightState.SUCCESS);
        } else if (!rule.options.ignoreWait) {
          onTimeout();
          return;
        }

        if (!rule.options.ignoreWait) {
          await delay(delaysRef.current.stepDelay);
        }

        useStore.setHighlightState(HighlightState.IDLE);
        useStore.setHighlightedRuleIndex(null);
      }

      if (isRunning.value) {
        await delay(delaysRef.current.cycleDelay);
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
  }, []);

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
    };
  }, [isRunning.value, runCycle]);

  return { start, stop };
};
