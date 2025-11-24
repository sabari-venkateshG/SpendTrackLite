'use server';

import { imageToExpense, type ImageToExpenseInput, type ImageToExpenseOutput } from '@/ai/flows/image-to-expense';

export async function getExpenseDetailsFromImage(photoDataUri: string): Promise<ImageToExpenseOutput> {
  const input: ImageToExpenseInput = { photoDataUri };
  try {
    const result = await imageToExpense(input);
    return result;
  } catch (error) {
    console.error("AI expense extraction failed:", error);
    throw new Error("Failed to extract details from the receipt image. Please try again or enter manually.");
  }
}
