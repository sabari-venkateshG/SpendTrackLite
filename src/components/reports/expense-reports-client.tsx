
'use client';

import { useState, useMemo } from 'react';
import type { Expense } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfMonth, subDays, subMonths, startOfYear, parseISO, format } from 'date-fns';
import { useSettings } from '@/hooks/use-settings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';


const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

type TimeRange = '30-day' | '6-month' | 'annual' | 'all';

export function ExpenseReportsClient({ expenses }: { expenses: Expense[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30-day');
  const { formatCurrency } = useSettings();

  const filteredData = useMemo(() => {
    if (timeRange === 'all') {
      return expenses;
    }
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case '30-day':
        startDate = subDays(now, 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '6-month':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      case 'annual':
        startDate = startOfYear(now);
        break;
    }

    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses, timeRange]);

  const totalSpent = useMemo(() => filteredData.reduce((acc, exp) => acc + exp.amount, 0), [filteredData]);
  const averageSpent = useMemo(() => filteredData.length > 0 ? totalSpent / filteredData.length : 0, [totalSpent, filteredData]);
  const transactionCount = useMemo(() => filteredData.length, [filteredData]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredData.forEach(exp => {
      categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + exp.amount);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData]);


  const trendData = useMemo(() => {
    const trendMap = new Map<string, number>();
    
    if (timeRange === '30-day') {
      filteredData.forEach(exp => {
        const day = format(parseISO(exp.date), 'MMM d');
        trendMap.set(day, (trendMap.get(day) || 0) + exp.amount);
      });
    } else { // 6-month or annual or all
      filteredData.forEach(exp => {
        const month = format(parseISO(exp.date), 'MMM yyyy');
        trendMap.set(month, (trendMap.get(month) || 0) + exp.amount);
      });
    }

    let data = Array.from(trendMap.entries()).map(([name, total]) => ({ name, total }));

    if (timeRange !== '30-day') {
      data.sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());
      data = data.map(d => ({...d, name: d.name.split(' ')[0]}));
    }

    return data;

  }, [filteredData, timeRange]);
  
  const categoryMonthlyBreakdown = useMemo(() => {
    const breakdown: { [month: string]: { [category: string]: number } } = {};

    filteredData.forEach(expense => {
      const month = format(parseISO(expense.date), 'MMMM yyyy');
      if (!breakdown[month]) {
        breakdown[month] = {};
      }
      if (!breakdown[month][expense.category]) {
        breakdown[month][expense.category] = 0;
      }
      breakdown[month][expense.category] += expense.amount;
    });

    return Object.entries(breakdown).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredData]);

  const handleExport = () => {
    const headers = ["Date", "Reason", "Category", "Amount"];
    const rows = filteredData.map(exp => [
      format(parseISO(exp.date), 'yyyy-MM-dd HH:mm'),
      `"${exp.reason.replace(/"/g, '""')}"`,
      exp.category,
      exp.amount.toFixed(2)
    ].join(','));
    
    const totalRow = ["", "", "Total", totalSpent.toFixed(2)].join(',');

    const csvContent = [headers.join(','), ...rows, '', totalRow].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expense-report-${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-primary">{`Total: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">No Data for Reports</h2>
        <p className="text-muted-foreground">Start adding expenses to see your reports here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <Button onClick={handleExport} disabled={filteredData.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export as CSV
        </Button>
      </div>

      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
        <ScrollArea className="w-full whitespace-nowrap md:w-auto">
            <TabsList className="w-max">
                <TabsTrigger value="30-day">Last 30 Days</TabsTrigger>
                <TabsTrigger value="6-month">Last 6 Months</TabsTrigger>
                <TabsTrigger value="annual">This Year</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
        </ScrollArea>
        <TabsContent value={timeRange} className="mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{transactionCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg. Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(averageSpent)}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-12">No data for this period.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-12">No data for this period.</p>}
              </CardContent>
            </Card>
          </div>

          {timeRange !== '30-day' && categoryMonthlyBreakdown.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Monthly Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryMonthlyBreakdown.map(([month, categories]) => (
                  <div key={month} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-semibold mb-2">{month}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {CATEGORIES.map(category => {
                          const total = categories[category.name] || 0;
                          return total > 0 ? (
                            <TableRow key={category.name}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <category.icon className="h-4 w-4 text-muted-foreground" />
                                {category.name}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          ) : null;
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
