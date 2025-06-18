import { Request, Response } from 'express';
export declare class AIGenerationController {
    private assetService;
    private creditService;
    constructor();
    generateAsset(req: Request, res: Response): Promise<void>;
    batchGenerate(req: Request, res: Response): Promise<void>;
    getGenerationHistory(req: Request, res: Response): Promise<void>;
    getCreditBalance(req: Request, res: Response): Promise<void>;
    earnCredits(req: Request, res: Response): Promise<void>;
    private getRequiredCredits;
}
//# sourceMappingURL=AIGenerationController.d.ts.map