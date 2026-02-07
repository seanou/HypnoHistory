'use server';

/**
 * @fileOverview Generates an image from a text prompt using Genkit and the Imagen 4 model.
 *
 * - generateImageFromText - A function that generates an image based on a text prompt.
 * - GenerateImageFromTextInput - The input type for the generateImageFromText function.
 * - GenerateImageFromTextOutput - The return type for the generateImageFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageFromTextInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageFromTextInput = z.infer<typeof GenerateImageFromTextInputSchema>;

const GenerateImageFromTextOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageFromTextOutput = z.infer<typeof GenerateImageFromTextOutputSchema>;

export async function generateImageFromText(input: GenerateImageFromTextInput): Promise<GenerateImageFromTextOutput> {
  return generateImageFromTextFlow(input);
}

const generateImageFromTextFlow = ai.defineFlow(
  {
    name: 'generateImageFromTextFlow',
    inputSchema: GenerateImageFromTextInputSchema,
    outputSchema: GenerateImageFromTextOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.prompt,
    });
    return {imageUrl: media.url!};
  }
);
