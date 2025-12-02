
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Loader2, ScanLine, Edit } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { formatCurrency } = useSettings();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Omit<Expense, 'id' | 'owner'>> | null>(null);

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
        
        const newExpense: Partial<Omit<Expense, 'id' | 'owner'>> = {
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
  
  const handleSaveExpense = (expense: Omit<Expense, 'id' | 'owner'>) => {
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
    if (!isInitialized) return [];
    const totals = new Map<ExpenseCategory, number>();
    CATEGORIES.forEach(cat => totals.set(cat.name, 0));
    expenses.forEach(expense => {
      totals.set(expense.category, (totals.get(expense.category) || 0) + expense.amount);
    });
    return Array.from(totals.entries())
      .map(([name, total]) => ({
        name,
        total,
        ...CATEGORIES.find(c => c.name === name),
      }))
      .filter(item => item.total > 0);
  }, [expenses, isInitialized]);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
       {isProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold">Extracting receipt details...</p>
          <p className="text-sm text-muted-foreground">This may take a few seconds.</p>
        </div>
      )}

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
              {categoryTotals.map(({ name, total, icon: Icon, color }) => (
                <Card
                  key={name}
                  className="group transition-shadow hover:shadow-lg"
                  style={{
                    // @ts-ignore
                    '--cat-color': `hsl(var(--cat-${color}))`,
                    '--cat-color-foreground': `hsl(var(--cat-${color}-foreground))`,
                  }}
                >
                  <div className="p-1">
                    <div className="rounded-lg p-5 transition-colors duration-300 group-hover:bg-[--cat-color] group-hover:text-[--cat-color-foreground]">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                        <CardTitle className="text-sm font-medium">{name}</CardTitle>
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-[--cat-color-foreground]" />}
                      </CardHeader>
                      <CardContent className="p-0 pt-2">
                        <div className="text-2xl font-bold">{formatCurrency(total)}</div>
                      </CardContent>
                    </div>
                  </div>
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
      
      <div className="fixed bottom-20 right-4 z-10 md:bottom-8 md:right-8">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className="h-16 w-16 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-100 md:h-14 md:w-auto md:rounded-md md:px-4 md:py-2 md:text-base"
                    aria-label="Add Expense"
                    >
                    <Plus className="h-8 w-8 md:h-5 md:w-5" />
                    <span className="hidden md:inline md:ml-2">Add Expense</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()} disabled={isProcessing}>
                    <ScanLine className="mr-2 h-4 w-4" />
                    <span>Scan Receipt</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAddManually}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Add Manually</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingExpense && editingExpense.reason ? 'Review Expense' : 'Add New Expense'}</SheetTitle>
          </SheetHeader>
          <ExpenseForm expense={editingExpense} onSave={handleSaveExpense} onCancel={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
