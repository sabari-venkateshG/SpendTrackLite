import type { ExpenseCategory } from '@/lib/types';
import { Car, HeartPulse, Home, MoreHorizontal, ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CATEGORIES: { name: ExpenseCategory; icon: LucideIcon }[] = [
  { name: 'Food', icon: UtensilsCrossed },
  { name: 'Transport', icon: Car },
  { name: 'Utilities', icon: Home },
  { name: 'Entertainment', icon: Ticket },
  { name: 'Health', icon: HeartPulse },
  { name: 'Shopping', icon: ShoppingBag },
  { name: 'Other', icon: MoreHorizontal },
];

export const CATEGORY_NAMES = CATEGORIES.map(c => c.name);
