import { Router, Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middlewares/auth';
import { analyzeJobDescription, generateOutreach, OutreachParams } from '../utils/ai';

const router = Router();

// Analyze job description
router.post('/analyze-jd', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { jd, resume } = req.body;

    if (!jd || !resume) {
      return res.status(400).json({ error: 'Job Description and Resume text are required' });
    }

    const analysis = await analyzeJobDescription(jd, resume);
    res.json(analysis);
  } catch (error: any) {
    console.error('JD analysis route error:', error);
    res.status(500).json({ error: 'Failed to analyze Job Description' });
  }
});

// Generate outreach materials
router.post('/generate-outreach', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { type, companyName, jobTitle, jd, resume, senderName } = req.body;

    if (!type || !companyName || !jobTitle || !jd || !resume || !senderName) {
      return res.status(400).json({ error: 'Missing required parameters for generating outreach' });
    }

    const params: OutreachParams = {
      type,
      companyName,
      jobTitle,
      jd,
      resume,
      senderName
    };

    const text = await generateOutreach(params);
    res.json({ text });
  } catch (error: any) {
    console.error('Outreach generation route error:', error);
    res.status(500).json({ error: 'Failed to generate outreach text' });
  }
});

export default router;
