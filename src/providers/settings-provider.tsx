import { DEFAULT_SETTINGS_CONFIG } from '@/common/settings';
import type { SettingsConfig } from '@/types/setting-types';
import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface SettingsContextState {
  settings: SettingsConfig;
  setSettings: React.Dispatch<React.SetStateAction<SettingsConfig>>;

}

const SettingsContext = createContext<SettingsContextState | undefined>(undefined);

const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsConfig>(DEFAULT_SETTINGS_CONFIG)

  const value: SettingsContextState = {
    setSettings, settings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export { SettingsProvider, useSettings };