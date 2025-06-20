import { UserTier } from '../types/ai';
export declare function getUserTier(userId: string): Promise<UserTier>;
export declare function updateUserTier(userId: string, tier: UserTier): Promise<void>;
export declare function checkUserLimits(userId: string, action: string): Promise<boolean>;
export declare function incrementUserUsage(userId: string, action: string): Promise<void>;
//# sourceMappingURL=userUtils.d.ts.map