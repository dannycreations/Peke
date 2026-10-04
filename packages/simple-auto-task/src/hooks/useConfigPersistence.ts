import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { DEFAULT_CONFIG, STORAGE_CONFIG_KEY } from '../app/constants';
import { selectorList } from '../stores/useStore';
import { getStorage } from '../utilities/storage';

import type { Config } from '../app/types';

interface UseConfigPersistenceReturn {
  readonly config: Config;
  readonly saveConfigNow: () => void;
  readonly updateConfig: (newConfig: Partial<Omit<Config, 'selectors'>>) => void;
}

export const useConfigPersistence = (): UseConfigPersistenceReturn => {
  const storage = getStorage();

  const [storedConfig, setStoredConfig] = useState<Omit<Config, 'selectors'>>(() => {
    let loadedConfig: Config = { ...DEFAULT_CONFIG };
    try {
      const savedJson = storage.getItem(STORAGE_CONFIG_KEY);
      if (savedJson) {
        const saved: Partial<Config> = JSON.parse(savedJson);
        if (typeof saved === 'object') {
          loadedConfig = { ...DEFAULT_CONFIG, ...saved };
        }
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage.', error);
    }

    selectorList.value = loadedConfig.selectors;
    const { selectors, ...config } = loadedConfig;
    return config;
  });

  const config = useMemo<Config>(
    () => ({
      ...storedConfig,
      selectors: selectorList.value,
    }),
    [storedConfig, selectorList.value],
  );

  const saveConfig = useCallback(
    (configToSave: Config) => {
      storage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
    },
    [storage],
  );

  const debouncedSave = useMemo(() => debounce(saveConfig, 500), [saveConfig]);

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const saveConfigNow = useCallback(() => {
    debouncedSave.cancel();
    saveConfig(config);
  }, [config, saveConfig, debouncedSave]);

  const updateConfig = useCallback((newConfig: Partial<Omit<Config, 'selectors'>>) => {
    setStoredConfig((previous) => ({ ...previous, ...newConfig }));
  }, []);

  return { config, saveConfigNow, updateConfig };
};
