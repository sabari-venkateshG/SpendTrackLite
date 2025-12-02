
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { getFirebase } from '@/firebase/config';
import { useUser } from '@/firebase';
import type { Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useExpenses() {
  const { user } = useUser();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!user) {
      // If there's no user, we aren't fetching data.
      // We can consider the hook "initialized" in this state.
      setIsInitialized(true);
      return;
    }

    // Set loading state to true when user changes
    setIsInitialized(false); 
    const { firestore } = getFirebase();
    if (!firestore) {
      setIsInitialized(true);
      return;
    }

    const expensesColRef = collection(firestore, 'users', user.uid, 'expenses');
    const q = query(expensesColRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData: Expense[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Expense));
      setExpenses(expensesData);
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching expenses: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch expenses.",
      });
      setIsInitialized(true); // Ensure initialization is true even on error
    });

    return () => unsubscribe();
  }, [user, toast]);

  const addExpense = useCallback(async (newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "You must be signed in to add an expense.",
      });
      return;
    }
    const { firestore } = getFirebase();
    if (!firestore) return;

    try {
      const expensesColRef = collection(firestore, 'users', user.uid, 'expenses');
      await addDoc(expensesColRef, {
        ...newExpenseData,
        owner: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save expense.",
      });
    }
  }, [user, toast]);

  const removeExpense = useCallback(async (id: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "You must be signed in to remove an expense.",
      });
      return;
    }
    const { firestore } = getFirebase();
    if (!firestore) return;

    try {
      const expenseDocRef = doc(firestore, 'users', user.uid, 'expenses', id);
      await deleteDoc(expenseDocRef);
    } catch (error) {
      console.error("Error removing expense: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not remove expense.",
      });
    }
  }, [user, toast]);

  return { expenses, addExpense, removeExpense, isInitialized };
}
