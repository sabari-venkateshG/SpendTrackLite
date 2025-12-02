'use client';

import { AuthProvider } from '@/firebase/auth/use-user';
import { ReactNode, useEffect, useState } from 'react';
import { getFirebase } from './config';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // getFirebase() is now guaranteed to run only on the client.
    const { app, auth, firestore } = getFirebase();
    if (app && auth && firestore) {
      setServices({ app, auth, firestore });
    }
  }, []);

  if (!services) {
    // You can render a loading skeleton or a spinner here
    return (
       <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
       </div>
    );
  }

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
