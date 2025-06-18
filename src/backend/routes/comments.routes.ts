import { Router, Request, Response } from 'express';

const router = Router();

// Like comment
router.post('/:commentId/like', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userAddress } = req.body;
    
    // Mock like toggle
    res.status(200).json({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Delete comment
router.delete('/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { userAddress } = req.body;
    
    // Mock comment deletion
    res.status(200).json({
      success: true,
      data: { success: true },
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;