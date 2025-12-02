
'use client';

import { BottomNav } from '@/components/bottom-nav';
import { Logo } from '@/components/icons';
import { SettingsDialog } from '@/components/settings-dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { WelcomeScreen } from '@/components/welcome-screen';
import { useIsClient } from '@/hooks/use-is-client';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { useUser } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getFirebase } from '@/firebase/config';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  const handleSignIn = async () => {
    const { auth, firestore } = getFirebase();
    if (!auth || !firestore) return;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;
      
      const userDocRef = doc(firestore, "users", loggedInUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          displayName: loggedInUser.displayName,
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL,
        }, { merge: true });
      }

    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Logo className="h-20 w-20 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Welcome to SpendTrack Lite</h1>
          <p className="max-w-md text-muted-foreground">
            Sign in with your Google account to securely save and sync your expenses across all your devices.
          </p>
          <Button onClick={handleSignIn} size="lg" className="mt-4">
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const isClient = useIsClient();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Expenses' },
    { href: '/reports', label: 'Reports' },
  ];
  
  useEffect(() => {
    if (!isClient) return;
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    if (welcomeShown) {
      setShowWelcome(false);
    } else {
      const timer = setTimeout(() => {
        setShowWelcome(false);
        sessionStorage.setItem('welcomeShown', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isClient]);

  if (!isClient) {
    return (
       <div className="flex h-screen w-screen items-center justify-center">
        <Logo className="h-20 w-20 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <FirebaseClientProvider>
      <AuthWrapper>
        <WelcomeScreen isVisible={showWelcome} />
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b bg-card/80 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                <Logo className="h-6 w-6 text-primary" />
                <span className="font-headline">SpendTrack Lite</span>
              </Link>
              <div className="hidden items-center gap-4 md:flex">
                 <nav className="flex items-center gap-2">
                  {navItems.map((item) => (
                    <Button
                      key={item.href}
                      variant="ghost"
                      asChild
                      className={cn(
                        pathname === item.href
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  ))}
                </nav>
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 pb-24 md:pb-8">{children}</main>
          <BottomNav />
          <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
      </AuthWrapper>
    </FirebaseClientProvider>
  );
}
