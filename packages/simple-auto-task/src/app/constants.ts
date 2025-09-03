import type { Config } from './types';

export const STORAGE_CONFIG_KEY = 'sat_config';
export const STORAGE_AUTORUN_KEY = 'sat_autorun';

export const PANEL_SPACING = 10;

export const ActionType = {
  CLICK: 'CLICK',
  DELETE: 'DELETE',
  STOP: 'STOP',
} as const;

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

export const HIGHLIGHT_BG_COLORS = {
  idle: '',
  success: '#22c55e',
  waiting: '#facc15',
} as const;

export const HIGHLIGHT_TEXT_COLORS = {
  idle: '',
  success: 'white',
  waiting: 'black',
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

export const STATUS_COLORS = {
  idle: '#6b7280',
  running: '#22c55e',
  stopped: '#ef4444',
  waiting: '#facc15',
} as const;

export const STATUS_TEXTS = {
  idle: 'Idle',
  running: 'Running',
  stopped: 'Stopped',
  waiting: 'Waiting',
} as const;
