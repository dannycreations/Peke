import { debounce } from 'es-toolkit';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_CONFIG, STORAGE_CONFIG_KEY } from '../app/constants';
import { useAppStore } from '../stores/appStore';
import { migrateConfig } from '../utils/utils';

import type { Config, Position, Rule } from '../app/types';

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
    let loadedConfig: Omit<Config, 'selectors'> & { selectors: ReadonlyArray<unknown> } = { ...DEFAULT_CONFIG };
    try {
      const savedJson: string | null = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (savedJson) {
        const saved: unknown = JSON.parse(savedJson);
        if (saved && typeof saved === 'object') {
          loadedConfig = {
            cycleDelay: (saved as Partial<Config>).cycleDelay ?? DEFAULT_CONFIG.cycleDelay,
            isPanelVisible: (saved as Partial<Config>).isPanelVisible ?? DEFAULT_CONFIG.isPanelVisible,
            position: (saved as Partial<Config>).position ?? DEFAULT_CONFIG.position,
            selectors: Array.isArray((saved as Partial<Config>).selectors)
              ? ((saved as Partial<Config>).selectors as unknown[])
              : DEFAULT_CONFIG.selectors,
            stepDelay: (saved as Partial<Config>).stepDelay ?? DEFAULT_CONFIG.stepDelay,
            waitDelay: (saved as Partial<Config>).waitDelay ?? DEFAULT_CONFIG.waitDelay,
          };
        }
      }
    } catch (error) {
      console.warn('SAT: Failed to load config from localStorage.', error);
    }

    const migratedSelectors: ReadonlyArray<Rule> = migrateConfig(loadedConfig.selectors);
    setSelectorList(migratedSelectors);
    setPartialConfig({
      cycleDelay: loadedConfig.cycleDelay,
      isPanelVisible: loadedConfig.isPanelVisible,
      position: loadedConfig.position,
      stepDelay: loadedConfig.stepDelay,
      waitDelay: loadedConfig.waitDelay,
    });
  }, [setSelectorList]);

  const config: Config = useMemo<Config>(
    () => ({
      ...partialConfig,
      selectors: selectorList,
    }),
    [partialConfig, selectorList],
  );

  const saveConfig: (configToSave: Config) => void = useCallback((configToSave: Config) => {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(configToSave));
  }, []);

  const debouncedSave: (configToSave: Config) => void = useMemo(() => debounce(saveConfig, 300), [saveConfig]);

  useEffect(() => {
    debouncedSave(config);
  }, [config, debouncedSave]);

  const saveConfigNow: () => void = useCallback(() => {
    saveConfig(config);
  }, [config, saveConfig]);

  const updateConfig: (newConfig: Partial<Omit<Config, 'selectors'>>) => void = useCallback((newConfig: Partial<Omit<Config, 'selectors'>>) => {
    setPartialConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return { config, saveConfigNow, updateConfig };
};
