export const GLOBAL_STYLES = `
  .highlight-pick {
    background-color: rgba(139, 92, 246, 0.2) !important;
    outline: 2px solid #8b5cf6 !important;
    outline-offset: 1px !important;
  }
`;

export const APP_STYLES = `
  :host {
    --color-primary: #3b82f6;
    --color-secondary: #8b5cf6;
    --color-success: #22c55e;
    --color-warning: #f59e0b;
    --color-danger: #ef4444;
    --color-neutral: #6b7280;
    --color-header-bg: #374151;
    --color-border: #ccc;
    --color-border-light: #ddd;
    --color-body-bg: white;
    --color-body-text: #1f2937;
    --color-input-bg: #f9fafb;
    --color-scrollbar-thumb: #d1d5db;
    --color-scrollbar-thumb-hover: #9ca3af;
    --color-button-disabled-bg: #9ca3af;
  }

  * {
    box-sizing: border-box;
  }

  #panel-container,
  #rules-panel {
    background: var(--color-body-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    color: var(--color-body-text);
    font-family: sans-serif;
    position: fixed;
    width: 300px;
    z-index: 2147483645;
  }

  #rules-panel {
    z-index: 2147483646;
  }

  .panel-header {
    align-items: center;
    background: var(--color-header-bg);
    border-radius: 8px 8px 0 0;
    color: var(--color-body-bg);
    cursor: move;
    display: flex;
    font-size: 14px;
    font-weight: bold;
    padding: 6px 8px;
  }

  #panel-header {
    justify-content: space-between;
  }

  #status-indicator {
    align-items: center;
    display: flex;
    font-size: 12px;
    gap: 4px;
  }

  #status-dot {
    border-radius: 50%;
    height: 8px;
    width: 8px;
  }

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  .panel-label {
    display: block;
    font-size: 12px;
  }

  .panel-input,
  .panel-select {
    background-color: var(--color-body-bg);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    box-sizing: border-box;
    color: var(--color-body-text);
    color-scheme: light;
    margin-top: 4px;
    padding: 4px;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    width: 100%;
  }

  .panel-input:focus,
  .panel-select:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
    outline: none;
  }

  .panel-input.input-error {
    border-color: var(--color-danger);
    box-shadow: 0 0 0 1px var(--color-danger);
  }

  .panel-input.input-success {
    border-color: var(--color-success);
    box-shadow: 0 0 0 1px var(--color-success);
  }

  .panel-button {
    border: none;
    border-radius: 4px;
    color: var(--color-body-bg);
    cursor: pointer;
    flex: 1;
    padding: 4px;
    transition: background-color 0.15s ease-in-out, opacity 0.15s ease-in-out, filter 0.15s ease-in-out, transform 0.15s ease-in-out;
  }

  .panel-button:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .panel-button:active:not(:disabled) {
    transform: scale(0.98);
    filter: brightness(0.95);
  }

  #picker-btn, #rules-pick-btn, #rules-parent-pick-btn, #rules-custom-pick-btn { background: var(--color-secondary); }
  #add-selector-btn, #rules-panel-save-btn { background: var(--color-primary); }
  #test-selector-btn, #rules-test-btn, #rules-parent-test-btn, #rules-custom-test-btn { background: var(--color-warning); }
  #start-btn { background: var(--color-success); }
  #stop-btn { background: var(--color-danger); }
  #rules-panel-cancel-btn { background: var(--color-neutral); }

  #start-btn:disabled,
  #stop-btn:disabled {
    background: var(--color-button-disabled-bg);
    cursor: not-allowed;
    opacity: 0.7;
  }

  #selector-list-display {
    background: var(--color-input-bg);
    border: 1px solid var(--color-border-light);
    border-radius: 4px;
    font-size: 12px;
    max-height: 150px;
    min-height: 98px;
    overflow-y: auto;
    padding: 4px;
  }

  #no-rules-message {
    align-items: center;
    color: var(--color-neutral);
    display: flex;
    font-style: italic;
    height: 100%;
    justify-content: center;
    min-height: 88px;
    text-align: center;
    user-select: none;
  }

  #selector-list-display::-webkit-scrollbar {
    width: 8px;
  }

  #selector-list-display::-webkit-scrollbar-track {
    background: var(--color-input-bg);
    border-radius: 4px;
  }

  #selector-list-display::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: var(--color-scrollbar-thumb);
    border: 2px solid var(--color-input-bg);
    border-radius: 4px;
  }

  #selector-list-display::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-scrollbar-thumb-hover);
  }

  .selector-item {
    align-items: center;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
    padding: 2px 4px;
  }

  .selector-item-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
    padding: 0 4px;
  }

  .selector-item-config-btn {
    color: var(--color-neutral);
  }

  .selector-item-remove-btn {
    color: var(--color-danger);
  }

  .selector-text {
    flex-grow: 1;
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .btn-group {
    display: flex;
    gap: 4px;
  }

  .input-with-btn {
    display: flex;
    gap: 4px;
    margin-top: 4px;
  }

  .input-with-btn .panel-input {
    margin-top: 0;
  }

  .input-with-btn .panel-button {
    flex: 0 1 auto;
  }

  #panel-container.picking-mode-panel,
  #rules-panel.picking-mode-panel {
    display: none !important;
  }

  .switch-label {
    align-items: center;
    display: flex;
    gap: 8px;
  }

  .switch {
    display: inline-block;
    height: 20px;
    position: relative;
    width: 34px;
  }

  .switch input {
    height: 0;
    opacity: 0;
    width: 0;
  }

  .switch-slider {
    background-color: var(--color-border);
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

  .switch-slider:before {
    background-color: var(--color-body-bg);
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

  input:checked + .switch-slider {
    background-color: var(--color-primary);
  }

  input:focus + .switch-slider {
    box-shadow: 0 0 1px var(--color-primary);
  }

  input:checked + .switch-slider:before {
    transform: translateX(14px);
    -ms-transform: translateX(14px);
    -webkit-transform: translateX(14px);
  }

  #picker-clue {
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
