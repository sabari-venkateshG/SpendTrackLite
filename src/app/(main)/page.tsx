
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Loader2, Edit } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { ExpenseList } from '@/components/expenses/expense-list';
import { Skeleton } from '@/components/ui/skeleton';
import { getExpenseDetailsFromImage } from '@/app/actions';
import type { ExpenseCategory, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExpenseForm } from '@/components/expenses/expense-form';
import { TickAnimation } from '@/components/tick-animation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';

export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = useCallback((amount: number) => {
    // Determine the locale based on the currency. 'en-IN' for INR, default to 'en-US'.
    const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: settings.currency,
      }).format(amount);
    } catch (e) {
      // Fallback for unsupported currencies
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }, [settings.currency]);

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
        
        const newExpense: Partial<Expense> = {
          amount: parseFloat(result.amount.replace(/[^0-9.-]+/g,"")),
          reason: result.vendor,
          date: isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
          category: result.category as ExpenseCategory,
        };

        setEditingExpense(newExpense);
        setIsSheetOpen(true);
        toast({
          title: 'Review Extracted Details',
          description: `We've extracted the details from your receipt. Please review and save.`,
        });

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
  }, [toast]);

  const handleAddManually = () => {
    setEditingExpense(null);
    setIsSheetOpen(true);
  };
  
  const handleSaveExpense = (expense: Omit<Expense, 'id'>) => {
    addExpense(expense);
    setIsSheetOpen(false);
    setEditingExpense(null);
    toast({
        description: (
          <div className="flex flex-col items-center gap-4 text-center">
            <TickAnimation />
            <div>
                <p className="font-bold text-lg">Expense Saved!</p>
                <p>{expense.reason} for {formatCurrency(expense.amount)}</p>
            </div>
          </div>
        ),
        duration: 3000,
      });
  };

  const categoryTotals = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    CATEGORIES.forEach(cat => totals.set(cat.name, 0));
    expenses.forEach(expense => {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
    });
    return Array.from(totals.entries())
      .map(([name, total]) => ({
        name,
        total,
        icon: CATEGORIES.find(c => c.name === name)?.icon,
      }))
      .filter(item => item.total > 0);
  }, [expenses]);

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
        <div className="space-y-8">
          {categoryTotals.length > 0 && (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryTotals.map(({ name, total, icon: Icon }) => (
                <Card key={name} className="transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{name}</CardTitle>
                    {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(total)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <ExpenseList expenses={expenses} removeExpense={removeExpense} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      
      {/* Mobile FABs */}
      <div className="md:hidden fixed bottom-20 right-4 z-10 flex flex-row items-center gap-3">
        <Button
          className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-100"
          aria-label="Add Expense Manually"
          onClick={handleAddManually}
          variant="secondary"
        >
          <Edit className="h-6 w-6" />
        </Button>
        <Button
          className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-100"
          aria-label="Scan Receipt"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : <Plus className="h-8 w-8" />}
        </Button>
      </div>
      
      {/* Desktop Button */}
      <div className="hidden md:block fixed bottom-8 right-8 space-x-2">
         <Button size="lg" className="h-14 gap-2 text-lg transition-transform hover:scale-105" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5"/>} 
            Scan Receipt
        </Button>
        <Button size="lg" variant="secondary" className="h-14 gap-2 text-lg transition-transform hover:scale-105" onClick={handleAddManually}>
            Add Manually
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingExpense ? 'Review Expense' : 'Add New Expense'}</SheetTitle>
          </SheetHeader>
          <ExpenseForm expense={editingExpense} onSave={handleSaveExpense} onCancel={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
