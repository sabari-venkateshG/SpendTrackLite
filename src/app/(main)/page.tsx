'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/expense-list';
import { Skeleton } from '@/components/ui/skeleton';
import { getExpenseDetailsFromImage } from '@/app/actions';
import type { ExpenseCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ExpenseForm } from '@/components/expenses/expense-form';


export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const result = await getExpenseDetailsFromImage(dataUri);
        const parsedDate = new Date(result.date);
        
        const newExpense = {
          amount: parseFloat(result.amount.replace(/[^0-9.-]+/g,"")),
          reason: result.vendor,
          date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
          category: result.category as ExpenseCategory,
        };

        addExpense(newExpense);

        toast({
          title: 'Expense Added!',
          description: `${result.vendor} for $${newExpense.amount.toFixed(2)} was saved.`,
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      } finally {
        setIsProcessing(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'Could not read the selected image file.',
      });
    };
  }, [addExpense, toast]);

  const handleAddExpenseClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFormSubmit = () => {
    setIsSheetOpen(false);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
       <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      {isInitialized ? (
        <ExpenseList expenses={expenses} removeExpense={removeExpense} />
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      <Button
        className="fixed bottom-20 right-4 z-10 h-14 w-14 rounded-full shadow-lg md:hidden"
        aria-label="Add Expense"
        onClick={handleAddExpenseClick}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
      </Button>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <div className="hidden md:block fixed bottom-8 right-8">
            <Button size="lg" className="h-12 gap-2" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus/>} 
                Add Expense
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add a New Expense</SheetTitle>
          </SheetHeader>
          <ExpenseForm expense={null} onSave={addExpense} onFormSubmit={handleFormSubmit} />
        </SheetContent>
      </Sheet>
    </div>
  );
}