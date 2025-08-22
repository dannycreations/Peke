export const SAT_GLOBAL_STYLES = `
  .sat-highlight-pick {
    background-color: rgba(139, 92, 246, 0.2) !important;
    outline: 2px solid #8b5cf6 !important;
    outline-offset: 1px !important;
  }
`;

export const SAT_APP_STYLES = `
  * {
    box-sizing: border-box;
  }

  #sat-panel-container,
  #sat-rules-panel {
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    color: #1f2937;
    font-family: sans-serif;
    position: fixed;
    width: 300px;
    z-index: 999999;
  }

  #sat-rules-panel {
    z-index: 1000000;
  }

  .sat-panel-header {
    align-items: center;
    background: #374151;
    border-radius: 8px 8px 0 0;
    color: white;
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
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    color: #1f2937;
    color-scheme: light;
    margin-top: 4px;
    padding: 4px;
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    width: 100%;
  }

  .sat-panel-input:focus,
  .sat-panel-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
    outline: none;
  }

  .sat-panel-input.sat-input-error {
    border-color: #ef4444;
    box-shadow: 0 0 0 1px #ef4444;
  }

  .sat-panel-button {
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    flex: 1;
    padding: 4px;
  }

  #sat-picker-btn {
    background: #8b5cf6;
  }

  #sat-add-selector-btn {
    background: #3b82f6;
  }

  #sat-test-selector-btn {
    background: #f59e0b;
  }

  #sat-start-btn {
    background: #22c55e;
  }

  #sat-stop-btn {
    background: #ef4444;
  }

  #sat-start-btn:disabled,
  #sat-stop-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  #sat-selector-list-display {
    background: #f9fafb;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    max-height: 106px;
    min-height: 106px;
    overflow-y: auto;
    padding: 4px;
  }

  #sat-selector-list-display::-webkit-scrollbar {
    width: 8px;
  }

  #sat-selector-list-display::-webkit-scrollbar-track {
    background: #f9fafb;
    border-radius: 4px;
  }

  #sat-selector-list-display::-webkit-scrollbar-thumb {
    background-clip: padding-box;
    background-color: #d1d5db;
    border: 2px solid #f9fafb;
    border-radius: 4px;
  }

  #sat-selector-list-display::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
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
    color: #6b7280;
  }

  .sat-selector-item-remove-btn {
    color: #ef4444;
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
    background-color: #ccc;
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
    background-color: white;
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
    background-color: #3b82f6;
  }

  input:focus + .sat-switch-slider {
    box-shadow: 0 0 1px #3b82f6;
  }

  input:checked + .sat-switch-slider:before {
    transform: translateX(14px);
    -ms-transform: translateX(14px);
    -webkit-transform: translateX(14px);
  }

  #sat-picker-clue {
    background-color: rgba(0, 0, 0, 0.8);
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
    z-index: 9999999;
  }
`;
