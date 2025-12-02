
'use client';

import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Expense } from '@/lib/types';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (newExpenseData: Omit<Expense, 'id' | 'owner'>) => void;
  removeExpense: (id: string) => void;
  isInitialized: boolean;
}

export const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getLocalExpenses = useCallback((): Expense[] => {
    if (typeof window === 'undefined') return [];
    try {
      const localData = localStorage.getItem('expenses');
      const parsedExpenses = localData ? JSON.parse(localData) : [];
      parsedExpenses.sort((a: Expense, b: Expense) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return parsedExpenses;
    } catch (error) {
      console.error("Error reading expenses from localStorage", error);
      return [];
    }
  }, []);

  const saveLocalExpenses = useCallback((expensesToSave: Expense[]) => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expensesToSave));
      // Manually dispatch a storage event to sync across tabs/windows
      window.dispatchEvent(new StorageEvent('storage', { key: 'expenses' }));
    } catch (error) {
      console.error("Error saving expenses to localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Initial load from localStorage
    setExpenses(getLocalExpenses());
    setIsInitialized(true);

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'expenses' || e.key === null) { // e.key is null for manual dispatch
            setExpenses(getLocalExpenses());
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [getLocalExpenses]);

  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    const currentExpenses = getLocalExpenses();
    const newExpense: Expense = {
      ...newExpenseData,
      id: new Date().toISOString() + Math.random().toString(), // Simple unique ID for local
      owner: 'local',
    };
    const updatedExpenses = [newExpense, ...currentExpenses];
    saveLocalExpenses(updatedExpenses);
  }, [getLocalExpenses, saveLocalExpenses]);

  const removeExpense = useCallback((id: string) => {
    const currentExpenses = getLocalExpenses();
    const updatedExpenses = currentExpenses.filter(exp => exp.id !== id);
    saveLocalExpenses(updatedExpenses);
  }, [getLocalExpenses, saveLocalExpenses]);

  const value = { expenses, addExpense, removeExpense, isInitialized };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}
