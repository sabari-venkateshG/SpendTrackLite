"use client";

import type { Expense } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'spendtrack-lite-expenses';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem(STORAGE_KEY);
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      }
    } catch (error) {
      console.error("Failed to parse expenses from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      } catch (error) {
        console.error("Failed to save expenses to localStorage", error);
      }
    }
  }, [expenses, isInitialized]);

  const addExpense = useCallback((newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: crypto.randomUUID(),
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
  }, []);

  return { expenses, addExpense, removeExpense, isInitialized };
}
