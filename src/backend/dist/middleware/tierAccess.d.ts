import { Request, Response, NextFunction } from 'express';
import { UserTier } from '../types/ai';
export declare function tierAccessMiddleware(allowedTiers: UserTier[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=tierAccess.d.ts.map