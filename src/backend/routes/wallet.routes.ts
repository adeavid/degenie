import { Router, Request, Response } from 'express';

const router = Router();

// Get wallet balance
router.get('/:walletAddress/balance', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    // Mock wallet balance
    const mockBalance = {
      sol: 5.67, // SOL balance
      tokens: {
        'sample_token': 1250000
      }
    };

    res.status(200).json({
      success: true,
      data: mockBalance,
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get specific token balance
router.get('/:walletAddress/balance/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress, tokenAddress } = req.params;
    
    // Mock token balance
    const mockBalance = {
      balance: 1250000 // Mock balance for this token
    };

    res.status(200).json({
      success: true,
      data: mockBalance,
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    res.status(500).json({ error: 'Failed to fetch token balance' });
  }
});

export default router;