'use server';
/**
 * @fileOverview A flow that answers questions based on the content of a document.
 *
 * - answerQuestionsFromDocument - A function that handles answering questions from a document.
 * - AnswerQuestionsFromDocumentInput - The input type for the answerQuestionsFromDocument function.
 * - AnswerQuestionsFromDocumentOutput - The return type for the answerQuestionsFromDocument function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnswerQuestionsFromDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to ask questions about, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to ask about the document.'),
});
export type AnswerQuestionsFromDocumentInput = z.infer<typeof AnswerQuestionsFromDocumentInputSchema>;

const AnswerQuestionsFromDocumentOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type AnswerQuestionsFromDocumentOutput = z.infer<typeof AnswerQuestionsFromDocumentOutputSchema>;

export async function answerQuestionsFromDocument(input: AnswerQuestionsFromDocumentInput): Promise<AnswerQuestionsFromDocumentOutput> {
  return answerQuestionsFromDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsFromDocumentPrompt',
  input: {
    schema: z.object({
      documentDataUri: z
        .string()
        .describe(
          "The document to ask questions about, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      question: z.string().describe('The question to ask about the document.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the question.'),
    }),
  },
  prompt: `You are a helpful AI assistant that answers questions based on the content of a document.

  Use the following document to answer the question.

  Document: {{media url=documentDataUri}}

  Question: {{{question}}}

  Answer: `,
});

const answerQuestionsFromDocumentFlow = ai.defineFlow<
  typeof AnswerQuestionsFromDocumentInputSchema,
  typeof AnswerQuestionsFromDocumentOutputSchema
>({
  name: 'answerQuestionsFromDocumentFlow',
  inputSchema: AnswerQuestionsFromDocumentInputSchema,
  outputSchema: AnswerQuestionsFromDocumentOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
