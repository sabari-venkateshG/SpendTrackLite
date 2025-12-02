import type { ExpenseCategory } from '@/lib/types';
import { Car, HeartPulse, Home, MoreHorizontal, ShoppingBag, Ticket, UtensilsCrossed, Plane, GraduationCap, Gift, Fuel, Film } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CATEGORIES: { name: ExpenseCategory; icon: LucideIcon; color: string }[] = [
  { name: 'Food', icon: UtensilsCrossed, color: 'bg-red-500' },
  { name: 'Transport', icon: Car, color: 'bg-blue-500' },
  { name: 'Utilities', icon: Home, color: 'bg-yellow-500' },
  { name: 'Entertainment', icon: Film, color: 'bg-purple-500' },
  { name: 'Health', icon: HeartPulse, color: 'bg-green-500' },
  { name: 'Shopping', icon: ShoppingBag, color: 'bg-pink-500' },
  { name: 'Travel', icon: Plane, color: 'bg-indigo-500' },
  { name: 'Education', icon: GraduationCap, color: 'bg-teal-500' },
  { name: 'Gifts', icon: Gift, color: 'bg-orange-500' },
  { name: 'Fuel', icon: Fuel, color: 'bg-gray-500' },
  { name: 'Other', icon: MoreHorizontal, color: 'bg-slate-400' },
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

