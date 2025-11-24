'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { ExpenseList } from '@/components/expenses/expense-list';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Add a New Expense</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <ExpenseForm addExpense={addExpense} onFormSubmit={() => setSheetOpen(false)} />
          </div>
        </SheetContent>

        {isInitialized ? (
          <ExpenseList expenses={expenses} removeExpense={removeExpense} />
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        <SheetTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 z-10 h-14 w-14 rounded-full shadow-lg md:hidden"
            aria-label="Add Expense"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </SheetTrigger>
         <div className="hidden md:block fixed bottom-8 right-8">
            <SheetTrigger asChild>
                <Button size="lg" className="h-12 gap-2">
                    <Plus/> Add Expense
                </Button>
            </SheetTrigger>
        </div>
      </Sheet>
    </div>
  );
}
