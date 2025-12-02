
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

// Helper function to get sorted expenses from localStorage
const getLocalExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  try {
    const localData = localStorage.getItem('expenses');
    const parsedExpenses = localData ? JSON.parse(localData) : [];
    // Sort: Oldest first, newest last
    parsedExpenses.sort((a: Expense, b: Expense) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return parsedExpenses;
  } catch (error) {
    console.error("Error reading expenses from localStorage", error);
    return [];
  }
};

// Helper function to save expenses to localStorage
const saveLocalExpenses = (expensesToSave: Expense[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('expenses', JSON.stringify(expensesToSave));
  } catch (error) {
    console.error("Error saving expenses to localStorage", error);
  }
};

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect for initial load and cross-tab sync
  useEffect(() => {
    // On initial mount, load data from localStorage
    setExpenses(getLocalExpenses());
    setIsInitialized(true);

    // Set up a listener for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expenses') {
        setExpenses(getLocalExpenses());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up the listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: new Date().toISOString() + Math.random().toString(),
      owner: 'local',
    };
    
    setExpenses(prevExpenses => {
      const updatedExpenses = [...prevExpenses, newExpense];
      // Sort: Oldest first, newest last
      updatedExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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

    