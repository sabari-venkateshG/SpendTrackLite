'use server';

/**
 * @fileOverview An image to expense AI agent.
 *
 * - imageToExpense - A function that handles the image to expense process.
 * - ImageToExpenseInput - The input type for the imageToExpense function.
 * - ImageToExpenseOutput - The return type for the imageToExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { CATEGORY_NAMES } from '@/lib/constants';

const ImageToExpenseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ImageToExpenseInput = z.infer<typeof ImageToExpenseInputSchema>;

const ImageToExpenseOutputSchema = z.object({
  amount: z.string().describe('The amount on the receipt.'),
  vendor: z.string().describe('The vendor on the receipt.'),
  date: z.string().describe('The date on the receipt.'),
  category: z.enum(CATEGORY_NAMES).describe('The category of the expense based on the vendor and items. If unsure, use "Other".'),
});
export type ImageToExpenseOutput = z.infer<typeof ImageToExpenseOutputSchema>;

export async function imageToExpense(input: ImageToExpenseInput): Promise<ImageToExpenseOutput> {
  return imageToExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageToExpensePrompt',
  input: {schema: ImageToExpenseInputSchema},
  output: {schema: ImageToExpenseOutputSchema},
  prompt: `You are an expert expense tracker. Extract key details from the image: amount, vendor, date, and category.

  Categorize the expense into one of the following: ${CATEGORY_NAMES.join(', ')}.

  Use the following as the primary source of information about the receipt.

  Photo: {{media url=photoDataUri}}`,
});

const imageToExpenseFlow = ai.defineFlow(
  {
    name: 'imageToExpenseFlow',
    inputSchema: ImageToExpenseInputSchema,
    outputSchema: ImageToExpenseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
