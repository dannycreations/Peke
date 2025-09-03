import $ from 'jquery';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { MainPanel } from '../components/MainPanel';
import { RulesPanel } from '../components/RulesPanel';
import { useConfigPersistence } from '../hooks/useConfigPersistence';
import { useElementPicker } from '../hooks/useElementPicker';
import { usePanelDrag } from '../hooks/usePanelDrag';
import { useTaskRunner } from '../hooks/useTaskRunner';
import { useAppStore } from '../stores/appStore';
import { ActionType, DEFAULT_CONFIG, PANEL_SPACING, StatusState, STORAGE_AUTORUN_KEY } from './constants';

import type { ChangeEvent, MouseEvent } from 'react';
import type { Rule } from './types';

const PickerClue = memo(() => {
  return (
    <div id="sat-picker-clue">
      Click to select an element. Hold <strong>Ctrl</strong> to pause. Press <strong>Esc</strong> to cancel.
    </div>
  );
});

export const App = memo(() => {
  const addRule = useAppStore((s) => s.addRule);
  const editingRuleId = useAppStore((s) => s.editingRuleId);
  const highlightState = useAppStore((s) => s.highlightState);
  const highlightedRuleIndex = useAppStore((s) => s.highlightedRuleIndex);
  const isAutoRun = useAppStore((s) => s.isAutoRun);
  const isPicking = useAppStore((s) => s.isPicking);
  const isRunning = useAppStore((s) => s.isRunning);
  const removeRule = useAppStore((s) => s.removeRule);
  const selectorList = useAppStore((s) => s.selectorList);
  const setIsAutoRun = useAppStore((s) => s.setIsAutoRun);
  const setEditingRuleId = useAppStore((s) => s.setEditingRuleId);
  const setIsRunning = useAppStore((s) => s.setIsRunning);
  const setStatus = useAppStore((s) => s.setStatus);
  const status = useAppStore((s) => s.status);
  const updateRule = useAppStore((s) => s.updateRule);

  const panelContainerRef = useRef<HTMLDivElement | null>(null);
  const rulesPanelRef = useRef<HTMLDivElement | null>(null);
  const selectorInputRef = useRef<HTMLInputElement | null>(null);

  const { config, saveConfigNow, updateConfig } = useConfigPersistence();

  const onTimeout = useCallback(() => {
    setIsRunning(false);
    saveConfigNow();
    localStorage.setItem(STORAGE_AUTORUN_KEY, 'true');
    window.location.reload();
  }, [saveConfigNow, setIsRunning]);

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
    return editingRuleId !== null ? selectorList.find((r) => r.id === editingRuleId) || null : null;
  }, [editingRuleId, selectorList]);

  const editingRuleIndex = useMemo(
    () => (editingRuleId !== null ? selectorList.findIndex((r) => r.id === editingRuleId) : -1),
    [editingRuleId, selectorList],
  );

  const handleAddSelector = useCallback(() => {
    const newSelector = selectorInputRef.current?.value.trim();
    if (!newSelector) {
      selectorInputRef.current?.focus();
      return;
    }

    addRule({
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
  }, [addRule]);

  const handleCloseRules = useCallback(() => {
    if (rulesPanelRef.current) {
      rulesPanelRef.current.style.display = 'none';
    }
    setEditingRuleId(null);
  }, [setEditingRuleId]);

  const handleConfigChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue)) {
        updateConfig({ [name]: numericValue });
      }
    },
    [updateConfig],
  );

  const handleListClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = (event.target as HTMLElement).closest('.sat-selector-item-btn');
      if (!target) {
        return;
      }

      const ruleId = Number((target as HTMLElement).dataset.ruleId);
      if (isNaN(ruleId)) {
        return;
      }

      if (target.classList.contains('sat-selector-item-remove-btn')) {
        if (editingRuleId === ruleId) {
          handleCloseRules();
        }
        removeRule(ruleId);
      } else if (target.classList.contains('sat-selector-item-config-btn')) {
        if (editingRuleId === ruleId) {
          handleCloseRules();
        } else {
          const ruleToEdit = selectorList.find((r) => r.id === ruleId);
          if (ruleToEdit) {
            setEditingRuleId(ruleId);
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
    [selectorList, removeRule, setEditingRuleId, editingRuleId, handleCloseRules],
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
    inputEl.classList.remove('sat-input-error', 'sat-input-success');

    const showError = () => {
      inputEl.classList.add('sat-input-error');
      setTimeout(() => {
        inputEl.classList.remove('sat-input-error');
      }, 1500);
    };

    const showSuccess = () => {
      inputEl.classList.add('sat-input-success');
      setTimeout(() => {
        inputEl.classList.remove('sat-input-success');
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
      updateRule(updatedRule);
      handleCloseRules();
    },
    [handleCloseRules, updateRule],
  );

  const handleStart = useCallback(() => {
    startRunner();
    localStorage.setItem(STORAGE_AUTORUN_KEY, 'true');
  }, [startRunner]);

  const handleStop = useCallback(() => {
    stopRunner();
    setIsAutoRun(false);
    setStatus(StatusState.STOPPED);
    localStorage.setItem(STORAGE_AUTORUN_KEY, 'false');
  }, [stopRunner, setIsAutoRun, setStatus]);

  useEffect(() => {
    const isRunning = useAppStore.getState().isRunning;
    if (isRunning) {
      return;
    }

    const autoStart = localStorage.getItem(STORAGE_AUTORUN_KEY);
    if (autoStart !== 'true') {
      return;
    }

    setIsAutoRun(true);
    setStatus(StatusState.WAITING);

    const startWhenReady = () => {
      const isAutoRun = useAppStore.getState().isAutoRun;
      const isRunning = useAppStore.getState().isRunning;
      if (!isAutoRun || isRunning) {
        return;
      }

      startRunner();
      setIsAutoRun(false);
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
  }, [setIsAutoRun, setStatus, startRunner]);

  useEffect(() => {
    if (panelContainerRef.current && config.position) {
      const { top, left, right } = config.position;
      panelContainerRef.current.style.top = `${top}px`;
      if (left !== null) {
        panelContainerRef.current.style.left = `${left}px`;
        panelContainerRef.current.style.right = 'auto';
      } else {
        panelContainerRef.current.style.right = `${right ?? DEFAULT_CONFIG.position.right}px`;
        panelContainerRef.current.style.left = 'auto';
      }
    }
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

  return (
    <>
      <div style={{ visibility: config.visible ? 'visible' : 'hidden', pointerEvents: config.visible ? 'auto' : 'none' }}>
        <MainPanel
          ref={panelContainerRef}
          cycleDelay={config.cycleDelay}
          highlightState={highlightState}
          highlightedRuleIndex={highlightedRuleIndex}
          isAutoRun={isAutoRun}
          isRunning={isRunning}
          onAddSelector={handleAddSelector}
          onConfigChange={handleConfigChange}
          onListClick={handleListClick}
          onPick={handleMainPanelPick}
          onStart={handleStart}
          onStop={handleStop}
          onTestSelector={handleMainPanelTestSelector}
          selectorInputRef={selectorInputRef}
          selectorList={selectorList}
          status={status}
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
      {isPicking && <PickerClue />}
    </>
  );
});
