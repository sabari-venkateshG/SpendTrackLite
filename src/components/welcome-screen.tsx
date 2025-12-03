
'use client';

import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  isVisible: boolean;
}

export function WelcomeScreen({ isVisible }: WelcomeScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-1000',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <Logo className="h-20 w-20 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          SpendTrack Lite
        </h1>
      </div>
    </div>
  );
}
