import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_CONFIG, STORAGE_CONFIG_KEY } from '../app/constants';
import { useAppStore } from '../stores/appStore';

import type { Config, Position } from '../app/types';

type PartialConfig = Omit<Config, 'selectors' | 'position'> & { position: Position };

interface UseConfigPersistenceReturn {
  readonly config: Config;
  readonly saveConfigNow: () => void;
  readonly updateConfig: (newConfig: Partial<Omit<Config, 'selectors'>>) => void;
}

export const useConfigPersistence = (): UseConfigPersistenceReturn => {
  const [partialConfig, setPartialConfig] = useState<PartialConfig>(DEFAULT_CONFIG);
  const selectorList = useAppStore((state) => state.selectorList);
  const setSelectorList = useAppStore((state) => state.setSelectorList);

  useEffect(() => {
    let loadedConfig = { ...DEFAULT_CONFIG };
    try {
      const savedJson: string | null = localStorage.getItem(STORAGE_CONFIG_KEY);
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
      console.warn('SAT: Failed to load config from localStorage.', error);
    }

    setSelectorList(loadedConfig.selectors);
    setPartialConfig({
      visible: loadedConfig.visible,
      cycleDelay: loadedConfig.cycleDelay,
      position: loadedConfig.position,
      stepDelay: loadedConfig.stepDelay,
      waitDelay: loadedConfig.waitDelay,
    });
  }, [setSelectorList]);

  const config = useMemo<Config>(
    () => ({
      ...partialConfig,
      selectors: selectorList,
    }),
    [partialConfig, selectorList],
  );

  const saveConfig = useCallback((configToSave: Config) => {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
  }, []);

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
