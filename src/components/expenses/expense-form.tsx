
'use client';

import React, { useEffect, useState } from 'react';
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
import type { Expense } from '@/lib/types';
import { CalendarIcon } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent } from '../ui/card';

const formSchema = z.object({
  amount: z.coerce.number({invalid_type_error: 'Please enter a valid amount.'}).min(0.01, 'Amount must be greater than $0.00.'),
  reason: z.string().min(1, 'Reason is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  category: z.enum(CATEGORY_NAMES, { required_error: 'Please select a category.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense: Partial<Omit<Expense, 'id' | 'owner'>> | null;
  onSave: (expense: Omit<Expense, 'id' | 'owner'>) => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expense?.amount || undefined,
      reason: expense?.reason || '',
      date: expense?.date ? new Date(expense.date) : new Date(),
      category: expense?.category || undefined,
    },
  });

  useEffect(() => {
    form.reset({
      amount: expense?.amount || undefined,
      reason: expense?.reason || '',
      date: expense?.date ? new Date(expense.date) : new Date(),
      category: expense?.category || undefined,
    });
  }, [expense, form]);


  const onSubmit = (values: FormValues) => {
    onSave({
      ...values,
      date: values.date.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} step="0.01" min="0" value={field.value ?? ''} />
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
              <FormLabel>Date & Time</FormLabel>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP p') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const newDate = new Date(field.value || new Date());
                        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                        field.onChange(newDate);
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                   <div className="p-3 border-t border-border">
                    <Input
                        type="time"
                        value={format(field.value || new Date(), 'HH:mm')}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = new Date(field.value || new Date());
                            newDate.setHours(parseInt(hours, 10));
                            newDate.setMinutes(parseInt(minutes, 10));
                            field.onChange(newDate);
                        }}
                    />
                  </div>
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
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
        </div>
      </form>
    </Form>
  );
}


interface ExpenseFormSuccessProps {
    expense: Omit<Expense, 'id' | 'owner'>;
    onDone: () => void;
}

export function ExpenseFormSuccess({ expense, onDone }: ExpenseFormSuccessProps) {
    const { formatCurrency } = useSettings();
    const category = CATEGORIES.find(c => c.name === expense.category);
    const Icon = category?.icon;

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mt-4">Expense Saved!</h2>
            <p className="text-muted-foreground mb-6">Your expense has been recorded.</p>
            
            <Card className="w-full text-left">
                <CardContent className="p-4">
                    <div className="flex items-center">
                        {Icon && (
                            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <Icon className="h-5 w-5 text-secondary-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{expense.reason}</p>
                            <p className="text-sm text-muted-foreground truncate">
                                {expense.category}
                            </p>
                        </div>
                         <p className="text-lg font-bold ml-4">
                            {formatCurrency(expense.amount)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={onDone} className="mt-8 w-full">
                Done
            </Button>
        </div>
    );
}

    