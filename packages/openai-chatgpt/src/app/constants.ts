export const CONFIG = {
  DEFAULT_MODEL_ID: 'auto',
  AVAILABLE_MODELS: { auto: 'Auto' },
  DEFAULT_SYSTEM_PROMPT: 'You are a helpful assistant.',
  UI_CONTAINER_SEL: 'div#conversation-header-actions',
  MODEL_STORAGE_KEY: 'ms_model_store',
  MODEL_LIST_STORAGE_KEY: 'ms_model_list_store',
  PROMPT_STORAGE_KEY: 'ms_prompt_store',
} as const;
