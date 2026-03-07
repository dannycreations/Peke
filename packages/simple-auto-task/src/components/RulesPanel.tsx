import { memo } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { ActionType as ActionTypeConst } from '../app/constants';

import type { RefObject } from 'preact';
import type { ActionType, DeleteActionType, Rule } from '../app/types';

interface RulesPanelProps {
  readonly editingRule: Rule | null;
  readonly editingRuleIndex: number;
  readonly onCloseRules: () => void;
  readonly onSaveRule: (rule: Rule) => void;
  readonly onTestSelector: (selector: string, inputEl: HTMLInputElement | null) => void;
  readonly rulesPanelRef: RefObject<HTMLDivElement>;
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

const handleKeyDown = (event: KeyboardEvent): void => {
  event.stopPropagation();
};

export const RulesPanel = memo<RulesPanelProps>(
  ({ editingRule, editingRuleIndex, onCloseRules, onSaveRule, onTestSelector, rulesPanelRef, startPicking }) => {
    const [form, setForm] = useState<Omit<Rule, 'id'>>({
      action: ActionTypeConst.CLICK,
      selector: '',
      options: {
        ignoreWait: false,
      },
    });

    const selectorInputRef = useRef<HTMLInputElement | null>(null);
    const parentSelectorInputRef = useRef<HTMLInputElement | null>(null);
    const customSelectorInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (editingRule) {
        setForm({
          action: editingRule.action,
          selector: editingRule.selector,
          options: { ...editingRule.options },
        });
      }
    }, [editingRule]);

    const updateForm = useCallback((updates: Partial<Omit<Rule, 'id'>>) => {
      setForm((prev) => ({ ...prev, ...updates }));
    }, []);

    const updateOptions = useCallback((updates: Partial<Rule['options']>) => {
      setForm((prev) => ({
        ...prev,
        options: { ...prev.options, ...updates },
      }));
    }, []);

    const handlePick = useCallback(
      (field: 'selector' | 'parentSelector' | 'customSelector') => {
        startPicking((newSelector: string) => {
          if (field === 'selector') {
            updateForm({ selector: newSelector });
          } else {
            updateOptions({ [field]: newSelector });
          }
        });
      },
      [startPicking, updateForm, updateOptions],
    );

    const handleSave = useCallback(() => {
      if (!editingRule) return;

      const updatedOptions: any = {
        ignoreWait: form.options.ignoreWait,
      };

      if (form.action === ActionTypeConst.DELETE) {
        updatedOptions.deleteActionType = form.options.deleteActionType || 'self';
        if (updatedOptions.deleteActionType === 'parent') {
          updatedOptions.parentSelector = form.options.parentSelector;
        } else if (updatedOptions.deleteActionType === 'custom') {
          updatedOptions.customSelector = form.options.customSelector;
        }
      }

      onSaveRule({
        id: editingRule.id,
        action: form.action,
        selector: form.selector,
        options: updatedOptions,
      });
    }, [editingRule, form, onSaveRule]);

    const handleTest = useCallback(
      (selector: string, ref: RefObject<HTMLInputElement>) => {
        onTestSelector(selector, ref.current);
      },
      [onTestSelector],
    );

    const isDeleteAction = form.action === ActionTypeConst.DELETE;

    return (
      <div id="rules-panel" ref={rulesPanelRef} style={{ display: editingRule ? 'block' : 'none' }}>
        <div id="rules-panel-header" className="panel-header">
          <span>{editingRule ? `Configure Rule #${editingRuleIndex + 1}` : 'Rule Configuration'}</span>
        </div>
        <div className="panel-body">
          <label className="panel-label">
            jQuery Selector
            <input
              ref={selectorInputRef}
              className="panel-input"
              id="rules-selector-input"
              placeholder="Enter selector"
              style={{ marginBottom: '4px' }}
              type="text"
              value={form.selector}
              onInput={(e) => updateForm({ selector: e.currentTarget.value })}
              onKeyDown={handleKeyDown}
            />
            <div className="btn-group">
              <button id="rules-pick-btn" className="panel-button" title="Pick an element from the page" onClick={() => handlePick('selector')}>
                Pick
              </button>
              <button
                id="rules-test-btn"
                className="panel-button"
                title="Test the current selector"
                onClick={() => handleTest(form.selector, selectorInputRef)}
              >
                Test
              </button>
            </div>
          </label>

          <label className="panel-label">
            Action
            <select
              id="rules-panel-action"
              className="panel-select"
              value={form.action}
              onChange={(e) => updateForm({ action: e.currentTarget.value as ActionType })}
              onKeyDown={handleKeyDown}
            >
              <option value={ActionTypeConst.CLICK}>Click Element</option>
              <option value={ActionTypeConst.DELETE}>Delete Element(s)</option>
              <option value={ActionTypeConst.STOP}>Stop Task</option>
            </select>
          </label>

          {isDeleteAction && (
            <>
              <label id="rules-panel-delete-type-label" className="panel-label">
                Delete Type
                <select
                  id="rules-panel-delete-type"
                  className="panel-select"
                  value={form.options.deleteActionType || 'self'}
                  onChange={(e) => updateOptions({ deleteActionType: e.currentTarget.value as DeleteActionType })}
                  onKeyDown={handleKeyDown}
                >
                  <option value="self">Delete Self</option>
                  <option value="parent">Delete Parent</option>
                  <option value="custom">Delete Custom</option>
                </select>
              </label>
              {form.options.deleteActionType === 'parent' && (
                <label id="rules-panel-parent-label" className="panel-label">
                  Parent Selector
                  <input
                    ref={parentSelectorInputRef}
                    id="rules-parent-input"
                    className="panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={form.options.parentSelector || ''}
                    placeholder="e.g., .card, #container"
                    onInput={(e) => updateOptions({ parentSelector: e.currentTarget.value })}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="btn-group">
                    <button
                      id="rules-parent-pick-btn"
                      className="panel-button"
                      title="Pick Parent Element"
                      onClick={() => handlePick('parentSelector')}
                    >
                      Pick
                    </button>
                    <button
                      id="rules-parent-test-btn"
                      className="panel-button"
                      title="Test Parent Selector"
                      onClick={() => handleTest(form.options.parentSelector || '', parentSelectorInputRef)}
                    >
                      Test
                    </button>
                  </div>
                </label>
              )}
              {form.options.deleteActionType === 'custom' && (
                <label id="rules-panel-custom-label" className="panel-label">
                  Custom Selector
                  <input
                    ref={customSelectorInputRef}
                    id="rules-custom-input"
                    className="panel-input"
                    style={{ marginBottom: '4px' }}
                    type="text"
                    value={form.options.customSelector || ''}
                    placeholder="e.g., .ad-banner"
                    onInput={(e) => updateOptions({ customSelector: e.currentTarget.value })}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="btn-group">
                    <button
                      id="rules-custom-pick-btn"
                      className="panel-button"
                      title="Pick Custom Element"
                      onClick={() => handlePick('customSelector')}
                    >
                      Pick
                    </button>
                    <button
                      id="rules-custom-test-btn"
                      className="panel-button"
                      title="Test Custom Selector"
                      onClick={() => handleTest(form.options.customSelector || '', customSelectorInputRef)}
                    >
                      Test
                    </button>
                  </div>
                </label>
              )}
            </>
          )}

          <label className="panel-label switch-label">
            <span>Ignore wait</span>
            <div className="switch">
              <input
                id="rules-ignore-wait-checkbox"
                type="checkbox"
                checked={form.options.ignoreWait}
                onChange={(e) => updateOptions({ ignoreWait: e.currentTarget.checked })}
              />
              <span className="switch-slider"></span>
            </div>
          </label>

          <div className="btn-group">
            <button id="rules-panel-save-btn" className="panel-button" onClick={handleSave}>
              Save
            </button>
            <button id="rules-panel-cancel-btn" className="panel-button" onClick={onCloseRules}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  },
);
