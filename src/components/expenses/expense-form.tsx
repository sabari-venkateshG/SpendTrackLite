'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/constants';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { getExpenseDetailsFromImage } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ImageIcon, Loader2 } from 'lucide-react';

const formSchema = z.object({
  amount: z.coerce.number({invalid_type_error: 'Please enter a valid amount.'}).min(0.01, 'Amount must be greater than $0.00.'),
  reason: z.string().min(1, 'Reason is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  category: z.enum(CATEGORY_NAMES, { required_error: 'Please select a category.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  onFormSubmit?: () => void;
}

export function ExpenseForm({ addExpense, onFormSubmit }: ExpenseFormProps) {
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      reason: '',
      date: new Date(),
      category: undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    addExpense({
      ...values,
      date: values.date.toISOString(),
      category: values.category as ExpenseCategory,
    });
    onFormSubmit?.();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        const result = await getExpenseDetailsFromImage(dataUri);
        form.setValue('amount', parseFloat(result.amount.replace(/[^0-9.-]+/g,"")));
        form.setValue('reason', result.vendor);
        const parsedDate = new Date(result.date);
        if(!isNaN(parsedDate.getTime())) {
          form.setValue('date', parsedDate);
        }
        toast({
          title: 'Details Extracted!',
          description: 'Please review and confirm the extracted expense details.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      } finally {
        setIsExtracting(false);
        // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = (error) => {
      setIsExtracting(false);
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'Could not read the selected image file.',
      });
    };
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isExtracting}>
          {isExtracting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="mr-2 h-4 w-4" />
          )}
          Upload a Receipt
        </Button>
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason / Vendor</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lunch, Coffee, Groceries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map(({ name, icon: Icon }) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Expense
        </Button>
      </form>
    </Form>
  );
}
