'use client';

import { useExpenses } from '@/hooks/use-expenses';
import { ExpenseReportsClient } from '@/components/reports/expense-reports-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsClient } from '@/hooks/use-is-client';

export default function ReportsPage() {
  const { expenses, isInitialized } = useExpenses();
  const isClient = useIsClient();

  if (!isClient || !isInitialized) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <ExpenseReportsClient expenses={expenses} />
    </div>
  );
}
