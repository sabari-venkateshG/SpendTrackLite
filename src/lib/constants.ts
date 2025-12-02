import type { ExpenseCategory } from '@/lib/types';
import { Car, HeartPulse, Home, MoreHorizontal, ShoppingBag, Ticket, UtensilsCrossed, Plane, GraduationCap, Gift, Fuel, Film } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CATEGORIES: { name: ExpenseCategory; icon: LucideIcon; color: string }[] = [
  { name: 'Food', icon: UtensilsCrossed, color: 'food' },
  { name: 'Transport', icon: Car, color: 'transport' },
  { name: 'Utilities', icon: Home, color: 'utilities' },
  { name: 'Entertainment', icon: Film, color: 'entertainment' },
  { name: 'Health', icon: HeartPulse, color: 'health' },
  { name: 'Shopping', icon: ShoppingBag, color: 'shopping' },
  { name: 'Travel', icon: Plane, color: 'travel' },
  { name: 'Education', icon: GraduationCap, color: 'education' },
  { name: 'Gifts', icon: Gift, color: 'gifts' },
  { name: 'Fuel', icon: Fuel, color: 'fuel' },
  { name: 'Other', icon: MoreHorizontal, color: 'other' },
];

export const CATEGORY_NAMES = [
    'Food', 
    'Transport', 
    'Utilities', 
    'Entertainment', 
    'Health', 
    'Shopping',
    'Travel',
    'Education',
    'Gifts',
    'Fuel',
    'Other'
] as const;
