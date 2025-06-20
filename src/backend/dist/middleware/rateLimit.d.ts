import { Request, Response, NextFunction } from 'express';
export declare function rateLimitMiddleware(configName: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rateLimit.d.ts.map