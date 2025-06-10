import { z } from 'zod';
import { AssetType } from '../types/ai';

const assetTypes: AssetType[] = ['logo', 'meme', 'gif'];

export const generationRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  assetType: z.enum(['logo', 'meme', 'gif']),
  tokenSymbol: z.string().min(2).max(10).optional(),
  tokenName: z.string().min(2).max(50).optional(),
  style: z.string().max(100).optional(),
  additionalContext: z.string().max(200).optional(),
});

export const batchGenerationRequestSchema = z.object({
  requests: z.array(generationRequestSchema).min(1).max(10),
});

export const earnCreditsRequestSchema = z.object({
  action: z.enum([
    'dailyLogin',
    'shareOnTwitter',
    'referralSignup',
    'communityEngagement'
  ]),
  metadata: z.record(z.any()).optional(),
});

export function validateGenerationRequest(data: any): { valid: boolean; error?: string } {
  try {
    generationRequestSchema.parse(data);
    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.errors?.[0]?.message || 'Invalid request format' 
    };
  }
}

export function validateBatchRequest(data: any): { valid: boolean; error?: string } {
  try {
    batchGenerationRequestSchema.parse(data);
    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.errors?.[0]?.message || 'Invalid batch request format' 
    };
  }
}

export function sanitizePrompt(prompt: string): string {
  // Remove potentially harmful content
  const blockedTerms = [
    'nsfw',
    'nude',
    'explicit',
    // Add more as needed
  ];

  let sanitized = prompt.toLowerCase();
  for (const term of blockedTerms) {
    if (sanitized.includes(term)) {
      throw new Error('Prompt contains inappropriate content');
    }
  }

  // Basic XSS prevention
  return prompt
    .replace(/[<>]/g, '')
    .trim();
}