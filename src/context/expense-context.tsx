
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

  // Function to get from localStorage
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

  // Effect for initial load and cross-tab sync
  useEffect(() => {
    // Initial load
    setExpenses(getLocalExpenses());
    setIsInitialized(true);

    // Listen for changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'expenses') {
            setExpenses(getLocalExpenses());
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [getLocalExpenses]);
  
  // Function to save to localStorage
  const saveLocalExpenses = (expensesToSave: Expense[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('expenses', JSON.stringify(expensesToSave));
    } catch (error) {
      console.error("Error saving expenses to localStorage", error);
    }
  };

  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: new Date().toISOString() + Math.random().toString(),
      owner: 'local',
    };
    
    setExpenses(prevExpenses => {
      const updatedExpenses = [newExpense, ...prevExpenses];
      updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveLocalExpenses(updatedExpenses);
      return updatedExpenses;
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prevExpenses => {
      const updatedExpenses = prevExpenses.filter(exp => exp.id !== id);
      saveLocalExpenses(updatedExpenses);
      return updatedExpenses;
    });
  }, []);

  const value = { expenses, addExpense, removeExpense, isInitialized };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}
