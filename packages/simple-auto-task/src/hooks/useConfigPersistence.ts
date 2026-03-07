import { useStorage } from '@/hooks/useStorage';
import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import { DEFAULT_CONFIG, STORAGE_CONFIG_KEY } from '../app/constants';
import { selectorList, useStore } from '../stores/useStore';

import type { Config, Position, Rule } from '../app/types';

type PartialConfig = Omit<Config, 'selectors' | 'position'> & { position: Position };

interface UseConfigPersistenceReturn {
  readonly config: Config;
  readonly saveConfigNow: () => void;
  readonly updateConfig: (newConfig: Partial<Omit<Config, 'selectors'>>) => void;
}

export const useConfigPersistence = (): UseConfigPersistenceReturn => {
  const storage = useStorage();

  const [partialConfig, setPartialConfig] = useState<PartialConfig>(() => {
    let loadedConfig = { ...DEFAULT_CONFIG };
    try {
      const savedJson = storage.getItem(STORAGE_CONFIG_KEY);
      if (savedJson) {
        const saved: Partial<Config> = JSON.parse(savedJson);
        if (saved && typeof saved === 'object') {
          loadedConfig = {
            visible: saved.visible ?? DEFAULT_CONFIG.visible,
            cycleDelay: saved.cycleDelay ?? DEFAULT_CONFIG.cycleDelay,
            position: saved.position ?? DEFAULT_CONFIG.position,
            selectors: saved.selectors ?? DEFAULT_CONFIG.selectors,
            stepDelay: saved.stepDelay ?? DEFAULT_CONFIG.stepDelay,
            waitDelay: saved.waitDelay ?? DEFAULT_CONFIG.waitDelay,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage.', error);
    }

    useStore.setSelectorList(loadedConfig.selectors);

    return {
      visible: loadedConfig.visible,
      cycleDelay: loadedConfig.cycleDelay,
      position: loadedConfig.position,
      stepDelay: loadedConfig.stepDelay,
      waitDelay: loadedConfig.waitDelay,
    };
  });

  const [selectors, setSelectors] = useState<ReadonlyArray<Rule>>(() => selectorList.value);

  useEffect(() => {
    const update = () => setSelectors([...selectorList.value]);
    const unsubscribe = selectorList.subscribe(update);
    return () => unsubscribe();
  }, []);

  const config = useMemo<Config>(
    () => ({
      ...partialConfig,
      selectors,
    }),
    [partialConfig, selectors],
  );

  const saveConfig = useCallback(
    (configToSave: Config) => {
      storage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
    },
    [storage],
  );

  const debouncedSave = useMemo(() => {
    return debounce(saveConfig, 300);
  }, [saveConfig]);

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const saveConfigNow = useCallback(() => {
    saveConfig(config);
  }, [config, saveConfig]);

  const updateConfig = useCallback((newConfig: Partial<Omit<Config, 'selectors'>>) => {
    setPartialConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return { config, saveConfigNow, updateConfig };
};
