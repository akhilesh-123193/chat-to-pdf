'use server';
/**
 * @fileOverview Generates question suggestions for a given document.
 *
 * - generateQuestionSuggestions - A function that generates question suggestions.
 * - GenerateQuestionSuggestionsInput - The input type for the generateQuestionSuggestions function.
 * - GenerateQuestionSuggestionsOutput - The return type for the generateQuestionSuggestions function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateQuestionSuggestionsInputSchema = z.object({
  documentText: z.string().describe('The text content of the document.'),
});
export type GenerateQuestionSuggestionsInput = z.infer<typeof GenerateQuestionSuggestionsInputSchema>;

const GenerateQuestionSuggestionsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested questions about the document.'),
});
export type GenerateQuestionSuggestionsOutput = z.infer<typeof GenerateQuestionSuggestionsOutputSchema>;

export async function generateQuestionSuggestions(input: GenerateQuestionSuggestionsInput): Promise<GenerateQuestionSuggestionsOutput> {
  return generateQuestionSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionSuggestionsPrompt',
  input: {
    schema: z.object({
      documentText: z.string().describe('The text content of the document.'),
    }),
  },
  output: {
    schema: z.object({
      suggestions: z.array(z.string()).describe('An array of suggested questions about the document.'),
    }),
  },
  prompt: `You are an AI assistant designed to generate question suggestions for a given document.  The user will upload a document, and you will suggest 3 questions that the user could ask about the document.

Document Text: {{{documentText}}}

Suggestions:`,
});

const generateQuestionSuggestionsFlow = ai.defineFlow<
  typeof GenerateQuestionSuggestionsInputSchema,
  typeof GenerateQuestionSuggestionsOutputSchema
>({
  name: 'generateQuestionSuggestionsFlow',
  inputSchema: GenerateQuestionSuggestionsInputSchema,
  outputSchema: GenerateQuestionSuggestionsOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
