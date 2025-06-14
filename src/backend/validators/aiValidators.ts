import { z } from 'zod';

const assetTypes = ['logo', 'meme', 'gif'] as const;

export const generationRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
  assetType: z.enum(assetTypes),
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

export function validateGenerationRequest(data: unknown): { valid: boolean; error?: string; data?: z.infer<typeof generationRequestSchema> } {
  try {
    const validated = generationRequestSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.errors?.[0]?.message || 'Invalid request format' 
    };
  }
}

export function validateBatchRequest(data: unknown): { valid: boolean; error?: string; data?: z.infer<typeof batchGenerationRequestSchema> } {
  try {
    const validated = batchGenerationRequestSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.errors?.[0]?.message || 'Invalid batch request format' 
    };
  }
}

export function sanitizePrompt(prompt: string): string {
  if (typeof prompt !== 'string') {
    throw new Error('Prompt must be a string');
  }

  if (prompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  // Remove potentially harmful content
  const blockedTerms = [
    'nsfw',
    'nude',
    'explicit',
    'sexual',
    'violence',
    // Add more as needed
  ] as const;

  const normalizedPrompt = prompt.toLowerCase();
  for (const term of blockedTerms) {
    if (normalizedPrompt.includes(term)) {
      throw new Error(`Prompt contains inappropriate content: ${term}`);
    }
  }

  // Enhanced XSS prevention and sanitization
  return prompt
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}