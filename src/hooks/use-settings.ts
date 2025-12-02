
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  name: string;
  currency: string;
  theme: Theme;
}

const STORAGE_KEY = 'spendtrack-lite-settings';

const defaultSettings: Settings = {
  name: '',
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

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setSettingsState(parsedSettings);
        if (parsedSettings.theme) {
            setTheme(parsedSettings.theme);
        }
      } else {
        setSettingsState(defaultSettings);
      }
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      setSettingsState(defaultSettings);
    }
    setIsInitialized(true);
  }, [setTheme]);

  useEffect(() => {
    if (isInitialized) {
      try {
        const newSettings = { ...settings, theme: theme as Theme };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("Failed to save settings to localStorage", error);
      }
    }
  }, [settings, isInitialized, theme]);

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      if (newSettings.theme) {
        setTheme(newSettings.theme);
      }
      return updatedSettings;
    });
  }, [setTheme]);

  const formatCurrency = useCallback((amount: number) => {
    const symbol = currencySymbols[settings.currency] || '$';
    const formattedAmount = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
    return `${symbol}${formattedAmount}`;
  }, [settings.currency]);


  return { settings: { ...settings, theme: theme as Theme }, setSettings, isInitialized, formatCurrency };
}
