import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-image-prompts.ts';
import '@/ai/flows/generate-image-variations.ts';
import '@/ai/flows/generate-image-from-text.ts';