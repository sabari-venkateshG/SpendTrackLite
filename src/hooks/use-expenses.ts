
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Expense } from '@/lib/types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getLocalExpenses = useCallback((): Expense[] => {
    if (typeof window === 'undefined') return [];
    try {
      const localData = localStorage.getItem('expenses');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error reading expenses from localStorage", error);
      return [];
    }
  }, []);

  const saveLocalExpenses = useCallback((expensesToSave: Expense[]) => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expensesToSave));
    } catch (error) {
      console.error("Error saving expenses to localStorage", error);
    }
  }, []);

  useEffect(() => {
    const localExpenses = getLocalExpenses();
    localExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(localExpenses);
    setIsInitialized(true);
  }, [getLocalExpenses]);

  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    setExpenses(prevExpenses => {
      const newExpense: Expense = {
        ...newExpenseData,
        id: new Date().toISOString() + Math.random().toString(), // Simple unique ID for local
        owner: 'local',
      };
      const updatedExpenses = [newExpense, ...prevExpenses];
      updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      saveLocalExpenses(updatedExpenses);
      return updatedExpenses;
    });
  }, [saveLocalExpenses]);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prevExpenses => {
      const updatedExpenses = prevExpenses.filter(exp => exp.id !== id);
      saveLocalExpenses(updatedExpenses);
      return updatedExpenses;
    });
  }, [saveLocalExpenses]);

  return { expenses, addExpense, removeExpense, isInitialized };
}
