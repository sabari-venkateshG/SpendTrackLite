
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { getFirebase } from '@/firebase/config';
import { useUser } from '@/firebase';
import type { Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useExpenses() {
  const { user, isGuest } = useUser();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Local storage logic
  const getLocalExpenses = useCallback((): Expense[] => {
    try {
      const localData = localStorage.getItem('expenses');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error reading expenses from localStorage", error);
      return [];
    }
  }, []);

  const saveLocalExpenses = useCallback((expensesToSave: Expense[]) => {
    try {
      localStorage.setItem('expenses', JSON.stringify(expensesToSave));
    } catch (error) {
      console.error("Error saving expenses to localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Determine if we should be in Firebase mode or local storage mode
    const useFirebase = user && !isGuest;
    const useLocalStorage = isGuest;

    if (!useFirebase && !useLocalStorage) {
      setIsInitialized(true);
      return;
    }
    
    setIsInitialized(false);

    if (useFirebase) {
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
        setIsInitialized(true);
      });
      
      return () => unsubscribe();

    } else if (useLocalStorage) {
      const localExpenses = getLocalExpenses();
      setExpenses(localExpenses);
      setIsInitialized(true);
    }

  }, [user, isGuest, toast, getLocalExpenses]);

  const addExpense = useCallback(async (newExpenseData: Omit<Expense, 'id' | 'owner'>) => {
    const useFirebase = user && !isGuest;

    if (useFirebase) {
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
        console.error("Error adding expense to Firestore: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save expense." });
      }
    } else { // Local storage mode
      const newExpense: Expense = {
        ...newExpenseData,
        id: new Date().toISOString(), // Simple unique ID for local
        owner: 'local',
      };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      saveLocalExpenses(updatedExpenses);
    }
  }, [user, isGuest, expenses, saveLocalExpenses, toast]);

  const removeExpense = useCallback(async (id: string) => {
    const useFirebase = user && !isGuest;
    
    if (useFirebase) {
      const { firestore } = getFirebase();
      if (!firestore) return;
      try {
        const expenseDocRef = doc(firestore, 'users', user.uid, 'expenses', id);
        await deleteDoc(expenseDocRef);
      } catch (error) {
        console.error("Error removing expense from Firestore: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not remove expense." });
      }
    } else { // Local storage mode
      const updatedExpenses = expenses.filter(exp => exp.id !== id);
      setExpenses(updatedExpenses);
      saveLocalExpenses(updatedExpenses);
    }
  }, [user, isGuest, expenses, saveLocalExpenses, toast]);

  return { expenses, addExpense, removeExpense, isInitialized };
}
