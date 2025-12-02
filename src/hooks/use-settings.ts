
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
  const { user } = useUser();
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        // User is logged in, load from Firestore
        const { firestore } = getFirebase();
        if (!firestore) return;
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const firestoreSettings = userDocSnap.data();
          const newName = firestoreSettings.displayName || user.displayName || '';
          const newCurrency = firestoreSettings.currency || defaultSettings.currency;
          
          setSettingsState(prev => ({...prev, name: newName, currency: newCurrency }));

        } else {
           // No settings in firestore, use defaults and user profile
            setSettingsState(prev => ({ ...prev, name: user.displayName || '' }));
        }
      } else {
        // No user, load from localStorage
        try {
          const storedSettings = localStorage.getItem('spendtrack-lite-settings');
          if (storedSettings) {
            setSettingsState(JSON.parse(storedSettings));
          }
        } catch (error) {
          console.error("Failed to parse settings from localStorage", error);
        }
      }
       try {
          const storedTheme = localStorage.getItem('spendtrack-lite-theme');
          if (storedTheme) {
            const themeValue = JSON.parse(storedTheme);
            setTheme(themeValue);
            setSettingsState(prev => ({ ...prev, theme: themeValue }))
          }
        } catch (error) {
           console.error("Failed to parse theme from localStorage", error);
        }

      setIsInitialized(true);
    };

    loadSettings();
  }, [user, setTheme]);

  const setSettings = useCallback(async (newSettings: Partial<Settings>) => {
     setSettingsState(prev => {
        const updatedSettings = { ...prev, ...newSettings };

        if (user) {
            const { firestore } = getFirebase();
            if(firestore) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const settingsToSave = {
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
    const symbol = currencySymbols[settings.currency] || '$';
    const formattedAmount = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol}${formattedAmount}`;
  }, [settings.currency]);


  return { settings: { ...settings, theme: theme as Theme }, setSettings, isInitialized, formatCurrency };
}
