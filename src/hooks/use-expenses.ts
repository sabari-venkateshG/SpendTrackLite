
'use client';

import { useContext } from 'react';
import { ExpenseContext } from '@/context/expense-context';

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
