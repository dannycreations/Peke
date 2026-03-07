import { useStorage } from '@/hooks/useStorage';
import $ from 'jquery';
import { memo } from 'preact/compat';
import { useCallback, useEffect, useMemo, useRef } from 'preact/hooks';

import { MainPanel } from '../components/MainPanel';
import { RulesPanel } from '../components/RulesPanel';
import { useConfigPersistence } from '../hooks/useConfigPersistence';
import { useElementPicker } from '../hooks/useElementPicker';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { useTaskRunner } from '../hooks/useTaskRunner';
import {
  editingRuleId,
  highlightedRuleIndex,
  highlightState,
  isAutoRun,
  isPicking,
  isRunning,
  selectorList,
  status,
  useStore,
} from '../stores/useStore';
import { ActionType, DEFAULT_CONFIG, PANEL_SPACING, StatusState, STORAGE_AUTORUN_KEY } from './constants';

import type { CSSProperties, JSX } from 'preact';
import type { Rule } from './types';

const PickerClue = memo(() => {
  return (
    <div id="picker-clue">
      Click to select an element. Hold <strong>Ctrl</strong> to pause. Press <strong>Esc</strong> to cancel.
    </div>
  );
});

export const App = memo(() => {
  const storage = useStorage();
  const panelContainerRef = useRef<HTMLDivElement | null>(null);
  const rulesPanelRef = useRef<HTMLDivElement | null>(null);
  const selectorInputRef = useRef<HTMLInputElement | null>(null);
  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  const { config, saveConfigNow, updateConfig } = useConfigPersistence();

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinelRef.current) {
      await wakeLockSentinelRef.current.release();
      wakeLockSentinelRef.current = null;
    }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinelRef.current = await navigator.wakeLock.request('screen');
        wakeLockSentinelRef.current.addEventListener('release', () => {
          wakeLockSentinelRef.current = null;
        });
      } catch (err: any) {
        console.error(`Could not acquire wake lock: ${err.name}, ${err.message}`);
      }
    }
  }, []);

  const onTimeout = useCallback(() => {
    useStore.setIsRunning(false);
    saveConfigNow();
    storage.setItem(STORAGE_AUTORUN_KEY, 'true');
    window.location.reload();
  }, [saveConfigNow, storage]);

  const { start: startRunner, stop: stopRunner } = useTaskRunner({
    cycleDelay: config.cycleDelay,
    stepDelay: config.stepDelay,
    waitDelay: config.waitDelay,
    onTimeout,
  });

  const { startPicking } = useElementPicker({
    panelContainerRef,
    rulesPanelRef,
  });

  const handleDragEnd = useCallback(() => {
    if (panelContainerRef.current) {
      const top: number = panelContainerRef.current.offsetTop;
      const left: number | null = panelContainerRef.current.style.left ? parseInt(panelContainerRef.current.style.left, 10) : null;
      const right: number | null =
        panelContainerRef.current.style.right && panelContainerRef.current.style.right !== 'auto'
          ? parseInt(panelContainerRef.current.style.right, 10)
          : null;
      updateConfig({ position: { top, left, right } });
    }
  }, [updateConfig]);

  usePanelDrag({
    mainPanelRef: panelContainerRef,
    onDragEnd: handleDragEnd,
    rulesPanelRef,
  });

  const editingRule = useMemo(() => {
    return editingRuleId.value !== null ? selectorList.value.find((r) => r.id === editingRuleId.value) || null : null;
  }, [editingRuleId.value, selectorList.value]);

  const editingRuleIndex = useMemo(
    () => (editingRuleId.value !== null ? selectorList.value.findIndex((r) => r.id === editingRuleId.value) : -1),
    [editingRuleId.value, selectorList.value],
  );

  const handleAddSelector = useCallback(() => {
    const newSelector = selectorInputRef.current?.value.trim();
    if (!newSelector) {
      selectorInputRef.current?.focus();
      return;
    }

    useStore.addRule({
      action: ActionType.CLICK,
      options: {
        ignoreWait: false,
      },
      selector: newSelector,
    });

    if (selectorInputRef.current) {
      selectorInputRef.current.value = '';
      selectorInputRef.current.focus();
    }
  }, []);

  const handleCloseRules = useCallback(() => {
    if (rulesPanelRef.current) {
      rulesPanelRef.current.style.display = 'none';
    }
    useStore.setEditingRuleId(null);
  }, []);

  const handleConfigChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      const { name, value } = event.currentTarget;
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue)) {
        updateConfig({ [name]: numericValue });
      }
    },
    [updateConfig],
  );

  const handleListClick = useCallback(
    (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('.selector-item-btn') as HTMLElement;
      if (!target) {
        return;
      }

      const ruleId = Number(target.dataset.ruleId);
      if (isNaN(ruleId)) {
        return;
      }

      if (target.classList.contains('selector-item-remove-btn')) {
        if (editingRuleId.value === ruleId) {
          handleCloseRules();
        }
        useStore.removeRule(ruleId);
      } else if (target.classList.contains('selector-item-config-btn')) {
        if (editingRuleId.value === ruleId) {
          handleCloseRules();
        } else {
          const ruleToEdit = selectorList.value.find((r) => r.id === ruleId);
          if (ruleToEdit) {
            useStore.setEditingRuleId(ruleId);
            if (rulesPanelRef.current && panelContainerRef.current) {
              const userPanelRect = panelContainerRef.current.getBoundingClientRect();
              rulesPanelRef.current.style.top = `${userPanelRect.top}px`;
              rulesPanelRef.current.style.left = `${userPanelRect.left + userPanelRect.width + PANEL_SPACING}px`;
              rulesPanelRef.current.style.right = 'auto';
              rulesPanelRef.current.style.display = 'block';
            }
          }
        }
      }
    },
    [handleCloseRules],
  );

  const handleMainPanelPick = useCallback(() => {
    startPicking((selector: string) => {
      if (selectorInputRef.current) {
        selectorInputRef.current.value = selector;
      }
    });
  }, [startPicking]);

  const testSelector = useCallback((selector: string | undefined, inputEl: HTMLInputElement | null) => {
    if (!inputEl) {
      return;
    }
    inputEl.classList.remove('input-error', 'input-success');

    const showError = () => {
      inputEl.classList.add('input-error');
      setTimeout(() => {
        inputEl.classList.remove('input-error');
      }, 1500);
    };

    const showSuccess = () => {
      inputEl.classList.add('input-success');
      setTimeout(() => {
        inputEl.classList.remove('input-success');
      }, 1500);
    };

    if (!selector) {
      showError();
      return;
    }

    try {
      const element = $(selector).first();
      if (element.length > 0) {
        showSuccess();
        element.each((_, el) => {
          const originalOutline = el.style.outline;
          el.style.outline = '2px solid #22c55e';
          setTimeout(() => (el.style.outline = originalOutline), 1500);
        });
      } else {
        showError();
      }
    } catch {
      showError();
    }
  }, []);

  const handleMainPanelTestSelector = useCallback(() => {
    testSelector(selectorInputRef.current?.value.trim(), selectorInputRef.current);
  }, [testSelector]);

  const handleSaveRule = useCallback(
    (updatedRule: Rule) => {
      useStore.updateRule(updatedRule);
      handleCloseRules();
    },
    [handleCloseRules],
  );

  const handleStart = useCallback(() => {
    acquireWakeLock();
    startRunner();
    storage.setItem(STORAGE_AUTORUN_KEY, 'true');
  }, [startRunner, acquireWakeLock, storage]);

  const handleStop = useCallback(() => {
    releaseWakeLock();
    stopRunner();
    useStore.setIsAutoRun(false);
    useStore.setStatus(StatusState.STOPPED);
    storage.setItem(STORAGE_AUTORUN_KEY, 'false');
  }, [stopRunner, releaseWakeLock, storage]);

  useEffect(() => {
    if (isRunning.value) {
      return;
    }

    const autoStart = storage.getItem(STORAGE_AUTORUN_KEY);
    if (autoStart !== 'true') {
      return;
    }

    useStore.setIsAutoRun(true);
    useStore.setStatus(StatusState.WAITING);

    const startWhenReady = () => {
      if (!isAutoRun.value || isRunning.value) {
        return;
      }

      startRunner();
      useStore.setIsAutoRun(false);
    };

    if (document.readyState === 'complete') {
      startWhenReady();
    } else {
      const onLoad = () => {
        startWhenReady();
        window.removeEventListener('load', onLoad);
      };
      window.addEventListener('load', onLoad);

      return () => {
        window.removeEventListener('load', onLoad);
      };
    }
  }, [startRunner]);

  const mainPanelStyle = useMemo<CSSProperties>(() => {
    if (!config.position) {
      return {};
    }
    const { top, left, right } = config.position;
    return {
      top: `${top}px`,
      left: left !== null ? `${left}px` : 'auto',
      right: left !== null ? 'auto' : `${right ?? DEFAULT_CONFIG.position.right}px`,
    };
  }, [config.position]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
        return;
      }

      if (event.key === '`') {
        updateConfig({ visible: !config.visible });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [config.visible, updateConfig]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return (
    <>
      <div style={{ visibility: config.visible ? 'visible' : 'hidden', pointerEvents: config.visible ? 'auto' : 'none' }}>
        <MainPanel
          mainPanelRef={panelContainerRef}
          style={mainPanelStyle}
          cycleDelay={config.cycleDelay}
          highlightState={highlightState.value}
          highlightedRuleIndex={highlightedRuleIndex.value}
          isAutoRun={isAutoRun.value}
          isRunning={isRunning.value}
          onAddSelector={handleAddSelector}
          onConfigChange={handleConfigChange}
          onListClick={handleListClick}
          onPick={handleMainPanelPick}
          onStart={handleStart}
          onStop={handleStop}
          onTestSelector={handleMainPanelTestSelector}
          selectorInputRef={selectorInputRef}
          selectorList={selectorList.value}
          status={status.value}
          stepDelay={config.stepDelay}
          waitDelay={config.waitDelay}
        />
        <RulesPanel
          editingRule={editingRule}
          editingRuleIndex={editingRuleIndex}
          onCloseRules={handleCloseRules}
          onSaveRule={handleSaveRule}
          onTestSelector={testSelector}
          rulesPanelRef={rulesPanelRef}
          startPicking={startPicking}
        />
      </div>
      {isPicking.value && <PickerClue />}
    </>
  );
});
