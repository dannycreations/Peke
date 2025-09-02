export const SAT_GLOBAL_STYLES = `
  .sat-highlight-pick {
    background-color: rgba(139, 92, 246, 0.2) !important;
    outline: 2px solid #8b5cf6 !important;
    outline-offset: 1px !important;
  }
`;

export const SAT_APP_STYLES = `
  :host {
    --sat-color-primary: #3b82f6;
    --sat-color-secondary: #8b5cf6;
    --sat-color-success: #22c55e;
    --sat-color-warning: #f59e0b;
    --sat-color-danger: #ef4444;
    --sat-color-neutral: #6b7280;
    --sat-color-header-bg: #374151;
    --sat-color-border: #ccc;
    --sat-color-border-light: #ddd;
    --sat-color-body-bg: white;
    --sat-color-body-text: #1f2937;
    --sat-color-input-bg: #f9fafb;
    --sat-color-scrollbar-thumb: #d1d5db;
    --sat-color-scrollbar-thumb-hover: #9ca3af;
    --sat-color-button-disabled-bg: #9ca3af;
  }

  * {
    box-sizing: border-box;
  }

  #sat-panel-container,
  #sat-rules-panel {
    background: var(--sat-color-body-bg);
    border: 1px solid var(--sat-color-border);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    color: var(--sat-color-body-text);
    font-family: sans-serif;
    position: fixed;
    width: 300px;
    z-index: 2147483645;
  }

  #sat-rules-panel {
    z-index: 2147483646;
  }

  .sat-panel-header {
    align-items: center;
    background: var(--sat-color-header-bg);
    border-radius: 8px 8px 0 0;
    color: var(--sat-color-body-bg);
    cursor: move;
    display: flex;
    font-size: 14px;
    font-weight: bold;
    padding: 6px 8px;
  }

  #sat-panel-header {
    justify-content: space-between;
  }

  #sat-status-indicator {
    align-items: center;
    display: flex;
    font-size: 12px;
    gap: 4px;
  }

  #sat-status-dot {
    border-radius: 50%;
    height: 8px;
    width: 8px;
  }

  .sat-panel-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  .sat-panel-label {
    display: block;
    font-size: 12px;
  }

  .sat-panel-input,
  .sat-panel-select {
    background-color: var(--sat-color-body-bg);
    border: 1px solid var(--sat-color-border);
    border-radius: 4px;
    box-sizing: border-box;
    color: var(--sat-color-body-text);
    color-scheme: light;
    margin-top: 4px;
    padding: 4px;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    width: 100%;
  }

  .sat-panel-input:focus,
  .sat-panel-select:focus {
    border-color: var(--sat-color-primary);
    box-shadow: 0 0 0 1px var(--sat-color-primary);
    outline: none;
  }

  .sat-panel-input.sat-input-error {
    border-color: var(--sat-color-danger);
    box-shadow: 0 0 0 1px var(--sat-color-danger);
  }

  .sat-panel-input.sat-input-success {
    border-color: var(--sat-color-success);
    box-shadow: 0 0 0 1px var(--sat-color-success);
  }

  .sat-panel-button {
    border: none;
    border-radius: 4px;
    color: var(--sat-color-body-bg);
    cursor: pointer;
    flex: 1;
    padding: 4px;
    transition: all 0.15s ease-in-out;
  }

  .sat-panel-button:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .sat-panel-button:active:not(:disabled) {
    transform: scale(0.98);
    filter: brightness(0.95);
  }

  #sat-picker-btn, #sat-rules-pick-btn, #sat-rules-parent-pick-btn, #sat-rules-custom-pick-btn { background: var(--sat-color-secondary); }
  #sat-add-selector-btn, #sat-rules-panel-save-btn { background: var(--sat-color-primary); }
  #sat-test-selector-btn, #sat-rules-test-btn, #sat-rules-parent-test-btn, #sat-rules-custom-test-btn { background: var(--sat-color-warning); }
  #sat-start-btn { background: var(--sat-color-success); }
  #sat-stop-btn { background: var(--sat-color-danger); }
  #sat-rules-panel-cancel-btn { background: var(--sat-color-neutral); }

  #sat-start-btn:disabled,
  #sat-stop-btn:disabled {
    background: var(--sat-color-button-disabled-bg);
    cursor: not-allowed;
    opacity: 0.7;
  }

  #sat-selector-list-display {
    background: var(--sat-color-input-bg);
    border: 1px solid var(--sat-color-border-light);
    border-radius: 4px;
    font-size: 12px;
    max-height: 150px;
    min-height: 98px;
    overflow-y: auto;
    padding: 4px;
  }

  #sat-no-rules-message {
    align-items: center;
    color: var(--sat-color-neutral);
    display: flex;
    font-style: italic;
    height: 100%;
    justify-content: center;
    min-height: 88px;
    text-align: center;
    user-select: none;
  }

  #sat-selector-list-display::-webkit-scrollbar {
    width: 8px;
  }

  #sat-selector-list-display::-webkit-scrollbar-track {
    background: var(--sat-color-input-bg);
    border-radius: 4px;
  }

  #sat-selector-list-display::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: var(--sat-color-scrollbar-thumb);
    border: 2px solid var(--sat-color-input-bg);
    border-radius: 4px;
  }

  #sat-selector-list-display::-webkit-scrollbar-thumb:hover {
    background-color: var(--sat-color-scrollbar-thumb-hover);
  }

  .sat-selector-item {
    align-items: center;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
    padding: 2px 4px;
  }

  .sat-selector-item-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
    padding: 0 4px;
  }

  .sat-selector-item-config-btn {
    color: var(--sat-color-neutral);
  }

  .sat-selector-item-remove-btn {
    color: var(--sat-color-danger);
  }

  .sat-selector-text {
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sat-btn-group {
    display: flex;
    gap: 4px;
  }

  .sat-input-with-btn {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }

  .sat-input-with-btn .sat-panel-input {
    margin-top: 0;
  }

  .sat-input-with-btn .sat-panel-button {
    flex: 0 1 auto;
  }

  #sat-panel-container.sat-picking-mode-panel,
  #sat-rules-panel.sat-picking-mode-panel {
    display: none !important;
  }

  .sat-switch-label {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .sat-switch {
    display: inline-block;
    height: 20px;
    position: relative;
    width: 34px;
  }

  .sat-switch input {
    height: 0;
    opacity: 0;
    width: 0;
  }

  .sat-switch-slider {
    background-color: var(--sat-color-border);
    border-radius: 20px;
    bottom: 0;
    cursor: pointer;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    transition: 0.4s;
    -webkit-transition: 0.4s;
  }

  .sat-switch-slider:before {
    background-color: var(--sat-color-body-bg);
    border-radius: 50%;
    bottom: 4px;
    content: '';
    height: 12px;
    left: 4px;
    position: absolute;
    transition: 0.4s;
    -webkit-transition: 0.4s;
    width: 12px;
  }

  input:checked + .sat-switch-slider {
    background-color: var(--sat-color-primary);
  }

  input:focus + .sat-switch-slider {
    box-shadow: 0 0 1px var(--sat-color-primary);
  }

  input:checked + .sat-switch-slider:before {
    transform: translateX(14px);
    -ms-transform: translateX(14px);
    -webkit-transform: translateX(14px);
  }

  #sat-picker-clue {
    background-color: rgba(17, 24, 39, 0.9);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(55, 65, 81, 0.5);
    border-radius: 8px;
    bottom: 20px;
    color: white;
    font-family: sans-serif;
    font-size: 14px;
    left: 50%;
    padding: 10px 15px;
    pointer-events: none;
    position: fixed;
    transform: translateX(-50%);
    z-index: 2147483647;
  }
`;
