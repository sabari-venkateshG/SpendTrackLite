
'use client';

import type { Expense } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, ShoppingBag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks/use-settings';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  removeExpense: (id: string) => void;
}

export function ExpenseList({ expenses, removeExpense }: ExpenseListProps) {
  const { formatCurrency } = useSettings();

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center shadow-sm min-h-[400px]">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Expenses Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click the &quot;+&quot; button to add your first expense.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map(expense => {
        const category = CATEGORIES.find(c => c.name === expense.category);
        const Icon = category?.icon;

        return (
          <Card key={expense.id} className="group transition-all duration-200 ease-in-out hover:shadow-lg hover:border-primary/50">
            <div className="flex items-center p-4">
              {Icon && (
                <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary md:h-12 md:w-12">
                  <Icon className="h-5 w-5 text-secondary-foreground md:h-6 md:w-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{expense.reason}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {format(parseISO(expense.date), 'MMMM d, yyyy')} &bull; {expense.category}
                </p>
              </div>
              <div className="ml-4 flex items-center">
                <p className="text-md font-bold text-right md:text-lg">
                  {formatCurrency(expense.amount)}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this expense record.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeExpense(expense.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
