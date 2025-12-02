
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  name: string;
  currency: string;
  theme: Theme;
}

const defaultSettings: Settings = {
  name: 'There',
  currency: 'USD',
  theme: 'system',
};

const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    INR: '₹',
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme, setTheme } = useTheme();

  const loadLocalSettings = useCallback(() => {
    let loadedSettings = { ...defaultSettings };
    try {
      const storedTheme = localStorage.getItem('spendtrack-lite-theme');
      if (storedTheme) loadedSettings.theme = JSON.parse(storedTheme);
      
      const storedSettings = localStorage.getItem('spendtrack-lite-settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        loadedSettings.name = parsed.name || defaultSettings.name;
        loadedSettings.currency = parsed.currency || defaultSettings.currency;
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
    setSettingsState(loadedSettings);
    if(loadedSettings.theme !== theme) setTheme(loadedSettings.theme);
    setIsInitialized(true);
  }, [setTheme, theme]);


  useEffect(() => {
    loadLocalSettings();
  }, [loadLocalSettings]);

  const setSettings = useCallback((newSettings: Partial<Omit<Settings, 'theme'>>) => {
     setSettingsState(prev => {
        const updatedSettings = { ...prev, ...newSettings };
        localStorage.setItem('spendtrack-lite-settings', JSON.stringify({
          name: updatedSettings.name,
          currency: updatedSettings.currency
        }));
        return updatedSettings;
    });
  }, []);

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('spendtrack-lite-theme', JSON.stringify(newTheme));
    setSettingsState(prev => ({...prev, theme: newTheme}));
  }, [setTheme]);

  const formatCurrency = useCallback((amount: number) => {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    const symbol = currencySymbols[settings.currency] || '$';
    try {
        const formattedAmount = amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${symbol}${formattedAmount}`;
    } catch (e) {
        return `${symbol}0.00`;
    }
  }, [settings.currency]);

  return { 
      settings: { ...settings, theme: theme as Theme }, 
      setSettings,
      setTheme: updateTheme, 
      isInitialized, 
      formatCurrency 
  };
}
