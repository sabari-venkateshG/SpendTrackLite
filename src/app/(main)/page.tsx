
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO, isToday, isThisMonth } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

type FilterType = 'all' | 'month' | 'today';

export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { formatCurrency } = useSettings();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Omit<Expense, 'id' | 'owner'>> | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('month');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setEditingExpense(null);
    setIsSheetOpen(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const result = await getExpenseDetailsFromImage(dataUri);
        
        const newExpense: Partial<Omit<Expense, 'id' | 'owner'>> = {
          amount: parseFloat(result.amount.replace(/,/g, '')),
          reason: result.vendor,
          date: new Date().toISOString(),
          category: result.category as ExpenseCategory,
        };

        setEditingExpense(newExpense);
        toast({
            title: "Review Extracted Details",
            description: "Check the details from your receipt and save.",
            duration: 5000,
        });

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: error instanceof Error ? error.message : "An unknown error occurred. Please enter manually.",
        });
        setEditingExpense({});
      } finally {
        setIsProcessing(false);
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
    setEditingExpense({});
    setIsSheetOpen(true);
  };
  
  const handleSaveExpense = (expense: Omit<Expense, 'id' | 'owner'>) => {
    addExpense(expense);
    setEditingExpense(null);
    setIsSheetOpen(false);
    toast({
        title: "Expense Saved!",
        description: "Your expense has been successfully recorded.",
        duration: 3000,
    });
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
        setTimeout(() => {
            setEditingExpense(null);
        }, 300);
    }
    setIsSheetOpen(open);
  }

  const sortedExpenses = useMemo(() => {
    if (!isInitialized) return [];
    return [...expenses].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [expenses, isInitialized]);

  const filteredExpenses = useMemo(() => {
    if (activeFilter === 'all') return sortedExpenses;
    return sortedExpenses.filter(exp => {
        const expenseDate = parseISO(exp.date);
        if (activeFilter === 'today') return isToday(expenseDate);
        if (activeFilter === 'month') return isThisMonth(expenseDate);
        return true;
    });
  }, [sortedExpenses, activeFilter]);

  const summaryStats = useMemo(() => {
    const todayExpenses = expenses.filter(e => isToday(parseISO(e.date)));
    const monthExpenses = expenses.filter(e => isThisMonth(parseISO(e.date)));
    
    return {
      today: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
      month: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      transactions: filteredExpenses.length,
    }
  }, [expenses, filteredExpenses]);

  const categoryTotals = useMemo(() => {
    const totals = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return CATEGORIES.map(category => ({
      ...category,
      total: totals[category.name] || 0,
    })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  }, [filteredExpenses]);


  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
       {(isProcessing && !isSheetOpen) && (
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card onClick={() => setActiveFilter('today')} className={cn("cursor-pointer transition-all", activeFilter === 'today' && 'ring-2 ring-primary')}>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Today's Spend</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(summaryStats.today)}</p>
                  </CardContent>
              </Card>
              <Card onClick={() => setActiveFilter('month')} className={cn("cursor-pointer transition-all", activeFilter === 'month' && 'ring-2 ring-primary')}>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-2xl font-bold">{formatCurrency(summaryStats.month)}</p>
                  </CardContent>
              </Card>
              <Card onClick={() => setActiveFilter('all')} className={cn("cursor-pointer transition-all col-span-2 md:col-span-1", activeFilter === 'all' && 'ring-2 ring-primary')}>
                  <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-2xl font-bold">{summaryStats.transactions}</p>
                  </CardContent>
              </Card>
          </div>

          {categoryTotals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
              <Carousel
                opts={{
                  align: "start",
                  loop: categoryTotals.length > 3,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {categoryTotals.map((category, index) => {
                    const Icon = category.icon;
                    return(
                    <CarouselItem key={index} className="basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <div className="p-1">
                      <Card className="w-full flex-shrink-0 transition-all duration-300 ease-in-out hover:bg-accent hover:shadow-xl hover:-translate-y-1">
                         <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-secondary group-hover:bg-background transition-colors">
                            <Icon className="h-6 w-6 text-secondary-foreground" />
                          </div>
                          <p className="text-sm font-semibold truncate">{category.name}</p>
                          <p className="text-lg font-bold">{formatCurrency(category.total)}</p>
                        </CardContent>
                      </Card>
                      </div>
                    </CarouselItem>
                  )})}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          )}

          {filteredExpenses.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-560px)] md:h-[calc(100vh-480px)]">
              <div className="space-y-4 pr-4">
                {filteredExpenses.map(expense => {
                  const category = CATEGORIES.find(c => c.name === expense.category);
                  const Icon = category?.icon;

                  return (
                    <Card key={expense.id} className="group transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 hover:scale-[1.02]">
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
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card p-12 text-center shadow-sm min-h-[calc(100vh-420px)] md:min-h-[calc(100vh-350px)]">
                <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Expenses Recorded</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click the "+" button to add an expense.
                </p>
            </div>
          )}
        </div>
      ) : (
         <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full col-span-2 md:col-span-1" />
            </div>
             <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
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

      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent>
            { isProcessing ? (
                <div className="flex h-full flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-lg font-semibold">Extracting details...</p>
                </div>
            ) : (
                <>
                    <SheetHeader>
                        <SheetTitle>
                          {editingExpense && Object.keys(editingExpense).length > 0
                              ? 'Review Expense'
                              : 'Add New Expense'}
                        </SheetTitle>
                    </SheetHeader>
                    {editingExpense && Object.keys(editingExpense).length > 0 && (
                       <div className="flex items-center gap-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground my-4">
                         <span>Please review the extracted details before saving.</span>
                       </div>
                    )}
                    <ExpenseForm 
                        expense={editingExpense} 
                        onSave={handleSaveExpense} 
                        onCancel={() => handleSheetClose(false)} 
                    />
                </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

    