
'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Loader2, ScanLine, Edit, Trash2, ShoppingBag } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
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
import { format, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        
        let parsedDate;
        try {
          // Attempt to parse the date string from AI. This may fail if format is unexpected.
          parsedDate = new Date(result.date);
          if (isNaN(parsedDate.getTime())) {
            // If parsing fails, default to now.
            parsedDate = new Date();
          }
        } catch (e) {
          parsedDate = new Date();
        }
        
        // Remove commas before parsing to handle large numbers correctly
        const amountString = result.amount.replace(/,/g, '');
        const parsedAmount = parseFloat(amountString.replace(/[^0-9.-]+/g,""));
        
        const newExpense: Partial<Omit<Expense, 'id' | 'owner'>> = {
          amount: isNaN(parsedAmount) ? 0 : parsedAmount,
          reason: result.vendor,
          date: parsedDate.toISOString(),
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
        title: 'Expense Saved!',
        description: (
          <div className="flex items-center gap-2">
            <TickAnimation />
            <p>{expense.reason} for {formatCurrency(expense.amount)}</p>
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
  
  const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [expenses]);

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
          {sortedExpenses.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-350px)]">
              <div className="space-y-4 pr-4">
                {sortedExpenses.map(expense => {
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
                            {format(parseISO(expense.date), 'MMM d, yyyy, h:mm a')} • {expense.category}
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
            </ScrollArea>
          ) : (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center shadow-sm min-h-[400px]">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Expenses Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click the "+" button to add your first expense.
                </p>
            </div>
          )}
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
