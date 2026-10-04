import { memo } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';

import { HIGHLIGHT_STYLES, STATUS_DISPLAY } from '../app/constants';
import { stopKeyboardPropagation } from '../utilities/dom';

import type { CSSProperties, RefObject } from 'preact';
import type { HighlightState, StatusState } from '../app/constants';
import type { DelayKey, Rule } from '../app/types';

interface MainPanelProps {
  readonly cycleDelay: number;
  readonly highlightState: HighlightState;
  readonly highlightedRuleIndex: number | null;
  readonly isAutoRun: boolean;
  readonly isRunning: boolean;
  readonly onAddSelector: () => void;
  readonly onConfigChange: (name: DelayKey, value: string) => void;
  readonly onListClick: (event: MouseEvent) => void;
  readonly onPick: () => void;
  readonly onStart: () => void;
  readonly onStop: () => void;
  readonly onTestSelector: () => void;
  readonly selectorInputRef: RefObject<HTMLInputElement | null>;
  readonly selectorList: ReadonlyArray<Rule>;
  readonly status: StatusState;
  readonly stepDelay: number;
  readonly waitDelay: number;
  readonly mainPanelRef?: RefObject<HTMLDivElement | null>;
  readonly style?: CSSProperties;
}

interface DelayConfig {
  readonly id: string;
  readonly name: DelayKey;
  readonly label: string;
  readonly min: number;
  readonly step: number;
  readonly value: number;
}

export const MainPanel = memo<MainPanelProps>(
  ({
    cycleDelay,
    highlightState,
    highlightedRuleIndex,
    isAutoRun,
    isRunning,
    onAddSelector,
    onConfigChange,
    onListClick,
    onPick,
    onStart,
    onStop,
    onTestSelector,
    selectorInputRef,
    selectorList,
    status,
    stepDelay,
    waitDelay,
    mainPanelRef,
    style,
  }) => {
    const listDisplayRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (isRunning && highlightedRuleIndex !== null && listDisplayRef.current) {
        const itemElement = listDisplayRef.current.children[highlightedRuleIndex] as HTMLElement;
        if (itemElement) {
          itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [isRunning, highlightedRuleIndex]);

    const delayConfigs: ReadonlyArray<DelayConfig> = [
      { id: 'step-delay', name: 'stepDelay', label: 'Step Delay (ms)', min: 0, step: 10, value: stepDelay },
      { id: 'wait-delay', name: 'waitDelay', label: 'Wait Delay (ms)', min: 1000, step: 100, value: waitDelay },
      { id: 'cycle-delay', name: 'cycleDelay', label: 'Cycle Delay (ms)', min: 100, step: 100, value: cycleDelay },
    ];

    return (
      <div id="panel-container" ref={mainPanelRef} style={style}>
        <div id="panel-header" className="panel-header">
          <span>Simple Auto Task</span>
          <span id="status-indicator">
            <span id="status-dot" style={{ backgroundColor: STATUS_DISPLAY[status].color }}></span>
            <span id="status-text">{STATUS_DISPLAY[status].text}</span>
          </span>
        </div>

        <div className="panel-body">
          <label className="panel-label">
            jQuery Selector
            <input
              ref={selectorInputRef}
              className="panel-input"
              id="selector-input"
              placeholder="Click 'Pick' or enter selector"
              style={{ marginBottom: '4px' }}
              type="text"
              onKeyDown={(e) => {
                stopKeyboardPropagation(e);
                if (e.key === 'Enter') {
                  onAddSelector();
                }
              }}
            />
            <div className="btn-group">
              <button id="picker-btn" className="panel-button" onClick={onPick}>
                Pick
              </button>
              <button id="test-selector-btn" className="panel-button" onClick={onTestSelector}>
                Test
              </button>
              <button id="add-selector-btn" className="panel-button" onClick={onAddSelector}>
                Add
              </button>
            </div>
          </label>

          <div id="selector-list-display" ref={listDisplayRef} onClick={onListClick}>
            {selectorList.length === 0 ? (
              <div id="no-rules-message">No rules yet. Add one above.</div>
            ) : (
              selectorList.map((rule, index) => (
                <div key={rule.id} className="selector-item" style={highlightedRuleIndex === index ? HIGHLIGHT_STYLES[highlightState] : undefined}>
                  <span className="selector-text" title={rule.selector}>
                    {index + 1}. {rule.selector}
                  </span>
                  <div className="btn-group">
                    <button className="selector-item-btn selector-item-config-btn" data-rule-id={rule.id} title={`Configure rule ${index + 1}`}>
                      &#9881;
                    </button>
                    <button className="selector-item-btn selector-item-remove-btn" data-rule-id={rule.id} title={`Remove rule ${index + 1}`}>
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {delayConfigs.map((config) => (
            <label key={config.name} className="panel-label">
              {config.label}
              <input
                className="panel-input"
                id={`${config.id}-input`}
                min={config.min}
                name={config.name}
                step={config.step}
                type="number"
                value={config.value}
                onChange={(event) => onConfigChange(config.name, event.currentTarget.value)}
                onKeyDown={stopKeyboardPropagation}
              />
            </label>
          ))}

          <div className="btn-group">
            <button id="start-btn" className="panel-button" disabled={isRunning || isAutoRun || selectorList.length === 0} onClick={onStart}>
              Start
            </button>
            <button id="stop-btn" className="panel-button" disabled={!isRunning && !isAutoRun} onClick={onStop}>
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  },
);
