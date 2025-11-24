export type ExpenseCategory = 'Food' | 'Transport' | 'Utilities' | 'Entertainment' | 'Health' | 'Shopping' | 'Other';

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  date: string; // ISO 8601 format date string
  category: ExpenseCategory;
}
