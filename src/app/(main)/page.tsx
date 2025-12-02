'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/expense-list';
import { Skeleton } from '@/components/ui/skeleton';
import { getExpenseDetailsFromImage } from '@/app/actions';
import type { ExpenseCategory, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExpenseForm } from '@/components/expenses/expense-form';


export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

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
        
        const newExpense: Omit<Expense, 'id'> = {
          amount: parseFloat(result.amount.replace(/[^0-9.-]+/g,"")),
          reason: result.vendor,
          date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
          category: result.category as ExpenseCategory,
        };

        if (isNaN(newExpense.amount) || !newExpense.reason) {
          setEditingExpense(newExpense);
          setIsSheetOpen(true);
          toast({
            title: 'Please complete the details',
            description: `We extracted what we could, but some fields need your attention.`,
          });
        } else {
          addExpense(newExpense);
          toast({
            title: 'Expense Added!',
            description: `${newExpense.reason} for $${newExpense.amount.toFixed(2)} was saved.`,
          });
        }

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: error instanceof Error ? error.message : "An unknown error occurred. Please enter manually.",
        });
        setEditingExpense({});
        setIsSheetOpen(true);
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

  const handleAddManually = () => {
    setEditingExpense(null);
    setIsSheetOpen(true);
  };
  
  const handleSaveExpense = (expense: Omit<Expense, 'id'>) => {
    addExpense(expense);
    setIsSheetOpen(false);
    setEditingExpense(null);
     toast({
        title: 'Expense Saved!',
        description: `${expense.reason} for $${expense.amount.toFixed(2)} was saved.`,
    });
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
      
      {/* Mobile FAB */}
      <Button
        className="fixed bottom-20 right-4 z-10 h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-100 md:hidden"
        aria-label="Add Expense"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
      >
        {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Plus className="h-8 w-8" />}
      </Button>
      
      {/* Desktop Button */}
      <div className="hidden md:block fixed bottom-8 right-8">
        <Button size="lg" className="h-14 gap-2 text-lg" onClick={handleAddManually}>
            <Plus/> 
            Add Manually
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingExpense ? 'Review Expense' : 'Add New Expense'}</SheetTitle>
          </SheetHeader>
          <ExpenseForm expense={editingExpense} onSave={handleSaveExpense} onFormSubmit={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
