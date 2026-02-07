// src/ai/flows/suggest-image-prompts.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting image prompts based on keywords related to the user's last search.
 *
 * @requires genkit
 * @requires zod
 *
 * @exports suggestImagePrompts - An async function that takes an input string and returns suggested image prompts.
 * @exports SuggestImagePromptsInput - The input type for suggestImagePrompts function.
 * @exports SuggestImagePromptsOutput - The output type for suggestImagePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestImagePromptsInputSchema = z.object({
  lastSearchKeywords: z
    .string()
    .describe(
      'Keywords related to the user\'s last image search. Used to generate new prompt suggestions.'
    ),
});
export type SuggestImagePromptsInput = z.infer<typeof SuggestImagePromptsInputSchema>;

const SuggestImagePromptsOutputSchema = z.object({
  suggestedPrompts: z
    .array(z.string())
    .describe('An array of suggested image prompts based on the input keywords.'),
});
export type SuggestImagePromptsOutput = z.infer<typeof SuggestImagePromptsOutputSchema>;

export async function suggestImagePrompts(input: SuggestImagePromptsInput): Promise<SuggestImagePromptsOutput> {
  return suggestImagePromptsFlow(input);
}

const suggestImagePromptsPrompt = ai.definePrompt({
  name: 'suggestImagePromptsPrompt',
  input: {schema: SuggestImagePromptsInputSchema},
  output: {schema: SuggestImagePromptsOutputSchema},
  prompt: `You are an AI assistant designed to inspire users with creative image prompts.

  Based on the user's last search keywords, generate five diverse and engaging image prompts.
  The prompts should be different in style and content. The keywords of the previous search were:

  {{lastSearchKeywords}}

  Your response should be an array of strings, with each string being a suggested prompt. Be as imaginative as possible.
  `,
});

const suggestImagePromptsFlow = ai.defineFlow(
  {
    name: 'suggestImagePromptsFlow',
    inputSchema: SuggestImagePromptsInputSchema,
    outputSchema: SuggestImagePromptsOutputSchema,
  },
  async input => {
    const {output} = await suggestImagePromptsPrompt(input);
    return output!;
  }
);
