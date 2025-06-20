import { z } from 'zod';
export declare const generationRequestSchema: z.ZodObject<{
    prompt: z.ZodString;
    assetType: z.ZodEnum<["logo", "meme", "gif"]>;
    tokenSymbol: z.ZodOptional<z.ZodString>;
    tokenName: z.ZodOptional<z.ZodString>;
    style: z.ZodOptional<z.ZodString>;
    additionalContext: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    assetType: "gif" | "logo" | "meme";
    tokenSymbol?: string | undefined;
    tokenName?: string | undefined;
    style?: string | undefined;
    additionalContext?: string | undefined;
}, {
    prompt: string;
    assetType: "gif" | "logo" | "meme";
    tokenSymbol?: string | undefined;
    tokenName?: string | undefined;
    style?: string | undefined;
    additionalContext?: string | undefined;
}>;
export declare const batchGenerationRequestSchema: z.ZodObject<{
    requests: z.ZodArray<z.ZodObject<{
        prompt: z.ZodString;
        assetType: z.ZodEnum<["logo", "meme", "gif"]>;
        tokenSymbol: z.ZodOptional<z.ZodString>;
        tokenName: z.ZodOptional<z.ZodString>;
        style: z.ZodOptional<z.ZodString>;
        additionalContext: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        prompt: string;
        assetType: "gif" | "logo" | "meme";
        tokenSymbol?: string | undefined;
        tokenName?: string | undefined;
        style?: string | undefined;
        additionalContext?: string | undefined;
    }, {
        prompt: string;
        assetType: "gif" | "logo" | "meme";
        tokenSymbol?: string | undefined;
        tokenName?: string | undefined;
        style?: string | undefined;
        additionalContext?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    requests: {
        prompt: string;
        assetType: "gif" | "logo" | "meme";
        tokenSymbol?: string | undefined;
        tokenName?: string | undefined;
        style?: string | undefined;
        additionalContext?: string | undefined;
    }[];
}, {
    requests: {
        prompt: string;
        assetType: "gif" | "logo" | "meme";
        tokenSymbol?: string | undefined;
        tokenName?: string | undefined;
        style?: string | undefined;
        additionalContext?: string | undefined;
    }[];
}>;
export declare const earnCreditsRequestSchema: z.ZodObject<{
    action: z.ZodEnum<["dailyLogin", "shareOnTwitter", "referralSignup", "communityEngagement"]>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    action: "dailyLogin" | "shareOnTwitter" | "referralSignup" | "communityEngagement";
    metadata?: Record<string, any> | undefined;
}, {
    action: "dailyLogin" | "shareOnTwitter" | "referralSignup" | "communityEngagement";
    metadata?: Record<string, any> | undefined;
}>;
export declare function validateGenerationRequest(data: unknown): {
    valid: boolean;
    error?: string;
    data?: z.infer<typeof generationRequestSchema>;
};
export declare function validateBatchRequest(data: unknown): {
    valid: boolean;
    error?: string;
    data?: z.infer<typeof batchGenerationRequestSchema>;
};
export declare function sanitizePrompt(prompt: string): string;
//# sourceMappingURL=aiValidators.d.ts.map