'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Plus, Loader2, ScanLine, Edit, Trash2 } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getExpenseDetailsFromImage } from '@/app/actions';
import type { ExpenseCategory, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ExpenseForm, ExpenseFormSuccess } from '@/components/expenses/expense-form';
import { Card } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyBoxLottie } from '@/components/lottie/empty-box-lottie';
import { NotificationBellLottie } from '@/components/lottie/notification-bell-lottie';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HomePage() {
  const { expenses, addExpense, removeExpense, isInitialized } = useExpenses();
  const { formatCurrency } = useSettings();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Omit<Expense, 'id' | 'owner'>> | null>(null);
  const [lastSavedExpense, setLastSavedExpense] = useState<Omit<Expense, 'id' | 'owner'> | null>(null);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);

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
        
        const newExpense: Partial<Omit<Expense, 'id' | 'owner'>> = {
          amount: parseFloat(result.amount.replace(/,/g, '')),
          reason: result.vendor,
          date: new Date().toISOString(),
          category: result.category as ExpenseCategory,
        };

        setEditingExpense(newExpense);
        setShowReviewPrompt(true);
        setIsSheetOpen(true);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: error instanceof Error ? error.message : "An unknown error occurred. Please enter manually.",
        });
        setEditingExpense({});
        setShowReviewPrompt(false);
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
    setShowReviewPrompt(false);
    setIsSheetOpen(true);
  };
  
  const handleSaveExpense = (expense: Omit<Expense, 'id' | 'owner'>) => {
    addExpense(expense);
    setLastSavedExpense(expense);
    setEditingExpense(null);
    setShowReviewPrompt(false);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
        // Give a moment for the sheet to close before resetting state
        setTimeout(() => {
            setLastSavedExpense(null);
            setEditingExpense(null);
            setShowReviewPrompt(false);
        }, 300);
    }
    setIsSheetOpen(open);
  }
  
  const sortedExpenses = useMemo(() => {
    if (!isInitialized) return [];
    return [...expenses].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
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
          {sortedExpenses.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-250px)]">
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
                <EmptyBoxLottie />
                <h3 className="mt-4 text-lg font-semibold">No Expenses Yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click the "+" button to add your first expense.
                </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
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

      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent>
            {lastSavedExpense ? (
                <ExpenseFormSuccess expense={lastSavedExpense} onDone={() => handleSheetClose(false)} />
            ) : (
                <>
                    <SheetHeader>
                        <SheetTitle>{editingExpense ? 'Review Expense' : 'Add New Expense'}</SheetTitle>
                    </SheetHeader>
                     {showReviewPrompt && (
                        <Alert className="mt-4 bg-accent border-accent-foreground/20">
                            <div className="flex items-center gap-2">
                                <NotificationBellLottie />
                                <AlertDescription>
                                    Review the extracted details from your receipt and save.
                                </AlertDescription>
                            </div>
                        </Alert>
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
