
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  name: string;
  currency: string;
}

const defaultSettings: Settings = {
  name: 'There',
  currency: 'USD',
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
    if (typeof window === 'undefined') {
        setSettingsState(loadedSettings);
        setIsInitialized(true);
        return;
    }
    try {
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
    setIsInitialized(true);
  }, []);


  useEffect(() => {
    loadLocalSettings();
  }, [loadLocalSettings]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spendtrack-lite-settings') {
        loadLocalSettings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadLocalSettings]);


  const setSettings = useCallback((newSettings: Partial<Settings>) => {
     setSettingsState(prev => {
        const updatedSettings = { ...prev, ...newSettings };
        if (typeof window !== 'undefined') {
            localStorage.setItem('spendtrack-lite-settings', JSON.stringify({
              name: updatedSettings.name,
              currency: updatedSettings.currency
            }));
        }
        return updatedSettings;
    });
  }, []);

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
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
      settings,
      theme: (theme as Theme) || 'system',
      setSettings,
      setTheme: updateTheme, 
      isInitialized, 
      formatCurrency 
  };
}
