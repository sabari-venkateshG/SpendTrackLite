import { BottomNav } from '@/components/bottom-nav';
import { Logo } from '@/components/icons';
import Link from 'next/link';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-headline">SpendTrack Lite</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 pb-20 md:pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
