'use server';
/**
 * @fileOverview AI agent that generates variations of an existing image based on a prompt.
 *
 * - generateImageVariations - A function that handles the image variation generation process.
 * - GenerateImageVariationsInput - The input type for the generateImageVariations function.
 * - GenerateImageVariationsOutput - The return type for the generateImageVariations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageVariationsInputSchema = z.object({
  baseImage: z
    .string()
    .describe(
      "The base image to use for generating variations, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The prompt to guide the image variations.'),
});
export type GenerateImageVariationsInput = z.infer<typeof GenerateImageVariationsInputSchema>;

const GenerateImageVariationsOutputSchema = z.object({
  variedImage: z
    .string()
    .describe(
      'The generated image variation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type GenerateImageVariationsOutput = z.infer<typeof GenerateImageVariationsOutputSchema>;

export async function generateImageVariations(input: GenerateImageVariationsInput): Promise<GenerateImageVariationsOutput> {
  return generateImageVariationsFlow(input);
}

const generateImageVariationsPrompt = ai.definePrompt({
  name: 'generateImageVariationsPrompt',
  input: {schema: GenerateImageVariationsInputSchema},
  output: {schema: GenerateImageVariationsOutputSchema},
  prompt: [
    {media: {url: '{{{baseImage}}}'}},
    {text: 'Generate an image of this character with following variations: {{{prompt}}}'},
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const generateImageVariationsFlow = ai.defineFlow(
  {
    name: 'generateImageVariationsFlow',
    inputSchema: GenerateImageVariationsInputSchema,
    outputSchema: GenerateImageVariationsOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.baseImage}},
        {text: `generate an image of this character with following variations: ${input.prompt}`},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
      variedImage: media!.url,
    };
  }
);
