
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

const getLocalExpenses = (): Expense[] => {
  if (typeof window === 'undefined') return [];
  try {
    const localData = localStorage.getItem('expenses');
    return localData ? JSON.parse(localData) : [];
  } catch (error) {
    console.error("Error reading expenses from localStorage", error);
    return [];
  }
};

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

  useEffect(() => {
    setExpenses(getLocalExpenses());
    setIsInitialized(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expenses') {
        setExpenses(getLocalExpenses());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    setExpenses(prevExpenses => {
      const newExpense: Expense = {
        ...newExpenseData,
        id: new Date().toISOString() + Math.random().toString(),
        owner: 'local',
      };
      const updatedExpenses = [...prevExpenses, newExpense];
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
