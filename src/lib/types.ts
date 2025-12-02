
import { CATEGORY_NAMES } from './constants';

export type ExpenseCategory = typeof CATEGORY_NAMES[number];

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  date: string; // ISO 8601 format date string
  category: ExpenseCategory;
  owner: string; // UID of the user who owns this expense
}
