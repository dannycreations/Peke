import type { Config } from './types';

export const ROOT_ELEMENT_ID = 'sat-root';

export const STORAGE_CONFIG_KEY = 'sat_config';
export const STORAGE_AUTORUN_KEY = 'sat_autorun';

export const PANEL_SPACING = 10;

export const ActionType = {
  CLICK: 'CLICK',
  DELETE: 'DELETE',
  STOP: 'STOP',
} as const;

export const HighlightState = {
  IDLE: 'idle',
  SUCCESS: 'success',
  WAITING: 'waiting',
} as const;

export const StatusState = {
  IDLE: 'idle',
  RUNNING: 'running',
  STOPPED: 'stopped',
  WAITING: 'waiting',
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];
export type HighlightState = (typeof HighlightState)[keyof typeof HighlightState];
export type StatusState = (typeof StatusState)[keyof typeof StatusState];

export const DEFAULT_CONFIG: Config = {
  visible: false,
  cycleDelay: 1000,
  position: {
    left: 10,
    right: null,
    top: 10,
  },
  selectors: [],
  stepDelay: 150,
  waitDelay: 5000,
};

export const HIGHLIGHT_STYLES: Record<HighlightState, { backgroundColor: string; color: string }> = {
  [HighlightState.IDLE]: { backgroundColor: '', color: '' },
  [HighlightState.SUCCESS]: { backgroundColor: '#22c55e', color: 'white' },
  [HighlightState.WAITING]: { backgroundColor: '#facc15', color: 'black' },
};

export const STATUS_DISPLAY: Record<StatusState, { color: string; text: string }> = {
  [StatusState.IDLE]: { color: '#6b7280', text: 'Idle' },
  [StatusState.RUNNING]: { color: '#22c55e', text: 'Running' },
  [StatusState.STOPPED]: { color: '#ef4444', text: 'Stopped' },
  [StatusState.WAITING]: { color: '#facc15', text: 'Waiting' },
};
