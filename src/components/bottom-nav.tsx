'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Expenses', icon: LayoutGrid },
    { href: '/reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="grid h-full grid-cols-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
