import { delay } from 'es-toolkit';
import $ from 'jquery';
import { useCallback, useEffect, useRef } from 'react';

import { ActionType, HighlightState, StatusState, STORAGE_AUTORUN_KEY } from '../app/constants';
import { useAppStore } from '../stores/appStore';

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
  const isRunning = useAppStore((state) => state.isRunning);
  const selectorList = useAppStore((state) => state.selectorList);
  const setHighlightState = useAppStore((state) => state.setHighlightState);
  const setHighlightedRuleIndex = useAppStore((state) => state.setHighlightedRuleIndex);
  const setIsRunning = useAppStore((state) => state.setIsRunning);
  const setStatus = useAppStore((state) => state.setStatus);
  const setIsAutoRun = useAppStore((state) => state.setIsAutoRun);

  const delaysRef = useRef<Pick<Config, 'stepDelay' | 'waitDelay' | 'cycleDelay'>>({ stepDelay, waitDelay, cycleDelay });

  useEffect(() => {
    delaysRef.current = { stepDelay, waitDelay, cycleDelay };
  }, [stepDelay, waitDelay, cycleDelay]);

  const executeRuleAction = useCallback(
    (rule: Rule) => {
      if (rule.action === ActionType.STOP) {
        setIsRunning(false);
        setIsAutoRun(false);
        setStatus(StatusState.STOPPED);
        localStorage.setItem(STORAGE_AUTORUN_KEY, 'false');
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
    },
    [setIsAutoRun, setIsRunning, setStatus],
  );

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
    while (useAppStore.getState().isRunning) {
      for (const [index, rule] of useAppStore.getState().selectorList.entries()) {
        if (!useAppStore.getState().isRunning) {
          return;
        }

        setHighlightedRuleIndex(index);
        setHighlightState(HighlightState.WAITING);

        const timeoutMs: number = delaysRef.current.waitDelay;
        const elementFound: boolean = await waitForElement(rule, timeoutMs);

        if (!useAppStore.getState().isRunning) {
          return;
        }

        if (elementFound) {
          executeRuleAction(rule);
          setHighlightState(HighlightState.SUCCESS);
        } else if (!rule.options.ignoreWait) {
          onTimeout();
          return;
        }

        if (!rule.options.ignoreWait) {
          await delay(delaysRef.current.stepDelay);
        }

        setHighlightState(HighlightState.IDLE);
        setHighlightedRuleIndex(null);
      }

      if (useAppStore.getState().isRunning) {
        await delay(delaysRef.current.cycleDelay);
      }
    }
  }, [executeRuleAction, onTimeout, setHighlightState, setHighlightedRuleIndex, waitForElement]);

  const start = useCallback(() => {
    if (selectorList.length === 0 || isRunning) {
      return;
    }

    setIsRunning(true);
    setStatus(StatusState.RUNNING);
  }, [isRunning, selectorList.length, setIsRunning, setStatus]);

  const stop = useCallback(() => {
    if (!isRunning) {
      return;
    }

    setIsRunning(false);
    setStatus(StatusState.STOPPED);
  }, [isRunning, setIsRunning, setStatus]);

  useEffect(() => {
    let isCancelled: boolean = false;
    if (isRunning) {
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
  }, [isRunning, runCycle]);

  return { start, stop };
};
