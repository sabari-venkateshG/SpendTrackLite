
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  name: string;
  currency: string;
  theme: Theme;
}

const defaultSettings: Settings = {
  name: 'Guest',
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
  const { user, isGuest } = useUser();
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme, setTheme } = useTheme();

  const loadLocalSettings = useCallback(() => {
    let loadedSettings = { ...defaultSettings };
    try {
      const storedTheme = localStorage.getItem('spendtrack-lite-theme');
      if (storedTheme) loadedSettings.theme = JSON.parse(storedTheme);
      
      const storedSettings = localStorage.getItem('spendtrack-lite-settings-guest');
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
    const useFirebase = user && !isGuest;

    if (!useFirebase && !isGuest) {
      setIsInitialized(false);
      return;
    }

    if (isGuest) {
      loadLocalSettings();
      return;
    }
    
    if (useFirebase) {
      const { firestore } = getFirebase();
      if (!firestore) return;

      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettingsState(prev => ({
            ...prev,
            name: data.displayName || user.displayName || 'User',
            currency: data.currency || defaultSettings.currency,
          }));
        } else {
          setSettingsState(prev => ({
            ...prev,
            name: user.displayName || 'User',
            currency: defaultSettings.currency
          }))
        }
        setIsInitialized(true);
      });
      
      // Also load theme from local storage for logged-in users
      try {
        const storedTheme = localStorage.getItem('spendtrack-lite-theme');
        if (storedTheme) {
            const themeValue = JSON.parse(storedTheme);
            if(themeValue !== theme) setTheme(themeValue);
        }
      } catch (error) {
         console.error("Failed to parse theme from localStorage", error);
      }

      return () => unsubscribe();
    }
  }, [user, isGuest, loadLocalSettings, setTheme, theme]);

  const setSettings = useCallback(async (newSettings: Partial<Omit<Settings, 'theme'>>) => {
     setSettingsState(prev => {
        const updatedSettings = { ...prev, ...newSettings };
        const useFirebase = user && !isGuest;

        if (useFirebase) {
            const { firestore } = getFirebase();
            if(firestore) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const settingsToSave: { displayName?: string, currency?: string } = {};
                if(newSettings.name) settingsToSave.displayName = newSettings.name;
                if(newSettings.currency) settingsToSave.currency = newSettings.currency;
                
                setDoc(userDocRef, settingsToSave, { merge: true });
            }
        } else { // Guest mode
            localStorage.setItem('spendtrack-lite-settings-guest', JSON.stringify({
              name: updatedSettings.name,
              currency: updatedSettings.currency
            }));
        }
        return updatedSettings;
    });
  }, [user, isGuest]);

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
