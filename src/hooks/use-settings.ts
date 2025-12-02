
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@/firebase';
import { getFirebase } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  name: string;
  currency: string;
  theme: Theme;
}

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
  const { user, loading: userLoading } = useUser();
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (userLoading) {
      setIsInitialized(false);
      return;
    }

    const loadSettings = async () => {
      let loadedSettings = { ...defaultSettings };
      
      // Load theme from localStorage first
      try {
        const storedTheme = localStorage.getItem('spendtrack-lite-theme');
        if (storedTheme) {
          const themeValue = JSON.parse(storedTheme);
          setTheme(themeValue);
          loadedSettings.theme = themeValue;
        }
      } catch (error) {
         console.error("Failed to parse theme from localStorage", error);
      }

      if (user) {
        // User is logged in, load from Firestore
        const { firestore } = getFirebase();
        if (!firestore) {
            setIsInitialized(true);
            return;
        };
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreSettings = userDocSnap.data();
          loadedSettings.name = firestoreSettings.displayName || user.displayName || '';
          loadedSettings.currency = firestoreSettings.currency || defaultSettings.currency;
        } else {
           // No settings in firestore, use defaults and user profile
           loadedSettings.name = user.displayName || '';
        }
      } else {
        // No user, load from localStorage
        try {
          const storedSettings = localStorage.getItem('spendtrack-lite-settings');
          if (storedSettings) {
             const parsed = JSON.parse(storedSettings);
             loadedSettings.name = parsed.name || defaultSettings.name;
             loadedSettings.currency = parsed.currency || defaultSettings.currency;
          }
        } catch (error) {
          console.error("Failed to parse settings from localStorage", error);
        }
      }
      setSettingsState(loadedSettings);
      setIsInitialized(true);
    };

    loadSettings();
  }, [user, userLoading, setTheme]);

  const setSettings = useCallback(async (newSettings: Partial<Settings>) => {
     setSettingsState(prev => {
        const updatedSettings = { ...prev, ...newSettings };

        if (user) {
            const { firestore } = getFirebase();
            if(firestore) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const settingsToSave: { displayName: string, currency: string } = {
                    displayName: updatedSettings.name,
                    currency: updatedSettings.currency,
                };
                setDoc(userDocRef, settingsToSave, { merge: true });
            }
        } else {
            localStorage.setItem('spendtrack-lite-settings', JSON.stringify({
              name: updatedSettings.name,
              currency: updatedSettings.currency
            }));
        }
        
        if (newSettings.theme && newSettings.theme !== theme) {
            setTheme(newSettings.theme);
            localStorage.setItem('spendtrack-lite-theme', JSON.stringify(newSettings.theme));
        }

        return updatedSettings;
    });

  }, [user, theme, setTheme]);

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


  return { settings: { ...settings, theme: theme as Theme }, setSettings, isInitialized, formatCurrency };
}
