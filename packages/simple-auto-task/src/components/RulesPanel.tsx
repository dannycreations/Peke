import { ChangeEvent, KeyboardEvent, memo, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { ActionType as ActionTypeConst } from '../app/constants';

import type { ActionType, DeleteActionType, Rule, RuleOptions } from '../app/types';

interface RulesPanelProps {
  readonly editingRule: Rule | null;
  readonly onCloseRules: () => void;
  readonly onSaveRule: (rule: Rule) => void;
  readonly onTestSelector: (selector: string, inputEl: HTMLInputElement | null) => void;
  readonly rulesPanelRef: RefObject<HTMLDivElement | null>;
  readonly startPicking: (onElementPicked: (selector: string) => void) => void;
}

const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void => {
  event.stopPropagation();
};

export const RulesPanel = memo<RulesPanelProps>(({ editingRule, onCloseRules, onSaveRule, onTestSelector, rulesPanelRef, startPicking }) => {
  const [action, setAction] = useState<ActionType>(ActionTypeConst.CLICK);
  const [customDeleteSelector, setCustomDeleteSelector] = useState<string>('');
  const [deleteActionType, setDeleteActionType] = useState<DeleteActionType>('self');
  const [ignoreWait, setIgnoreWait] = useState<boolean>(false);
  const [parentSelector, setParentSelector] = useState<string>('');
  const [selector, setSelector] = useState<string>('');
  const selectorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingRule) {
      setAction(editingRule.action);
      setCustomDeleteSelector(editingRule.options.customDeleteSelector || '');
      setDeleteActionType(editingRule.options.deleteActionType || 'self');
      setIgnoreWait(editingRule.options.ignoreWait || false);
      setParentSelector(editingRule.options.parentSelector || '');
      setSelector(editingRule.selector);
    }
  }, [editingRule]);

  const handlePick: () => void = useCallback(() => {
    startPicking((newSelector: string) => {
      setSelector(newSelector);
    });
  }, [startPicking]);

  const handleSave: () => void = useCallback(() => {
    if (!editingRule) {
      return;
    }

    const {
      customDeleteSelector: _customDeleteSelector,
      deleteActionType: _deleteActionType,
      parentSelector: _parentSelector,
      ...baseOptions
    } = editingRule.options;

    let updatedOptions: RuleOptions = {
      ...baseOptions,
      ignoreWait,
    };

    if (action === ActionTypeConst.DELETE) {
      updatedOptions = {
        ...updatedOptions,
        deleteActionType,
      };
      if (deleteActionType === 'parent') {
        updatedOptions = { ...updatedOptions, parentSelector };
      } else if (deleteActionType === 'custom') {
        updatedOptions = { ...updatedOptions, customDeleteSelector };
      }
    }

    const updatedRule: Rule = {
      action,
      id: editingRule.id,
      options: updatedOptions,
      selector,
    };

    onSaveRule(updatedRule);
  }, [action, customDeleteSelector, deleteActionType, editingRule, ignoreWait, onSaveRule, parentSelector, selector]);

  const handleTest: () => void = useCallback(() => {
    onTestSelector(selector, selectorInputRef.current);
  }, [onTestSelector, selector]);

  const isDeleteAction: boolean = action === ActionTypeConst.DELETE;

  return (
    <div id="sat-rules-panel" ref={rulesPanelRef} style={{ display: editingRule ? 'block' : 'none' }}>
      <div id="sat-rules-panel-header" className="sat-panel-header">
        <span>Rule Configuration</span>
      </div>
      <div className="sat-panel-body">
        <label className="sat-panel-label">
          jQuery Selector
          <input
            ref={selectorInputRef}
            className="sat-panel-input"
            id="sat-rules-selector-input"
            placeholder="Enter selector"
            style={{ marginBottom: '4px' }}
            type="text"
            value={selector}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSelector(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="sat-btn-group">
            <button
              aria-label="Pick an element from the page"
              className="sat-panel-button"
              style={{ background: '#8b5cf6' }}
              title="Pick an element from the page"
              onClick={handlePick}
            >
              Pick
            </button>
            <button
              aria-label="Test the current selector"
              className="sat-panel-button"
              style={{ background: '#f59e0b' }}
              title="Test the current selector"
              onClick={handleTest}
            >
              Test
            </button>
          </div>
        </label>

        <label className="sat-panel-label">
          Action
          <select
            id="sat-rules-panel-action"
            className="sat-panel-select"
            value={action}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setAction(e.target.value as ActionType)}
            onKeyDown={handleKeyDown}
          >
            <option value={ActionTypeConst.CLICK}>Click Element</option>
            <option value={ActionTypeConst.DELETE}>Delete Element(s)</option>
          </select>
        </label>

        {isDeleteAction && (
          <>
            <label id="sat-rules-panel-delete-type-label" className="sat-panel-label">
              Delete Type
              <select
                id="sat-rules-panel-delete-type"
                className="sat-panel-select"
                value={deleteActionType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setDeleteActionType(e.target.value as DeleteActionType)}
                onKeyDown={handleKeyDown}
              >
                <option value="self">Delete Self</option>
                <option value="parent">Delete Parent</option>
                <option value="custom">Delete Custom</option>
              </select>
            </label>
            {deleteActionType === 'parent' && (
              <label id="sat-rules-panel-parent-label" className="sat-panel-label">
                Parent Selector
                <input
                  id="sat-rules-parent-input"
                  className="sat-panel-input"
                  type="text"
                  value={parentSelector}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setParentSelector(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </label>
            )}
            {deleteActionType === 'custom' && (
              <label id="sat-rules-panel-custom-label" className="sat-panel-label">
                Custom Selector
                <input
                  id="sat-rules-custom-input"
                  className="sat-panel-input"
                  type="text"
                  value={customDeleteSelector}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomDeleteSelector(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </label>
            )}
          </>
        )}

        <label className="sat-panel-label sat-switch-label">
          <span>Ignore wait</span>
          <div className="sat-switch">
            <input
              id="sat-rules-ignore-wait-checkbox"
              type="checkbox"
              checked={ignoreWait}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setIgnoreWait(e.target.checked)}
            />
            <span className="sat-switch-slider"></span>
          </div>
        </label>

        <div className="sat-btn-group">
          <button id="sat-rules-panel-save-btn" className="sat-panel-button" style={{ background: '#3b82f6' }} onClick={handleSave}>
            Save
          </button>
          <button id="sat-rules-panel-cancel-btn" className="sat-panel-button" style={{ background: '#6b7280' }} onClick={onCloseRules}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
