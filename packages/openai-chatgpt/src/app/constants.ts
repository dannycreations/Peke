export const CONFIG = {
  DEFAULT_MODEL_ID: 'gpt-5.2',
  AVAILABLE_MODELS: {
    'gpt-5.2': 'GPT-5.2',
    'gpt-5.2-mini': 'GPT-5.2-mini',
    'gpt-5.1': 'GPT-5.1',
    'gpt-5.1-mini': 'GPT-5.1-mini',
    'gpt-5': 'GPT-5',
    'gpt-5-mini': 'GPT-5-mini',
    'gpt-5-t-mini': 'GPT-5-t-mini',
  },
  DEFAULT_SYSTEM_PROMPT: 'You are a helpful assistant.',
  UI_CONTAINER_SEL: 'div#conversation-header-actions',
  MODEL_STORAGE_KEY: 'ms_model_store',
  PROMPT_STORAGE_KEY: 'ms_prompt_store',
} as const;
