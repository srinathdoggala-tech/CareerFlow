import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateJWT } from '../middlewares/auth';
import { Priority, ApplicationStatus, JobType, WorkMode } from '@prisma/client';

const router = Router();

// Get all applications with search & filter
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { status, priority, workMode, jobType, search } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status as ApplicationStatus;
    }
    if (priority) {
      where.priority = priority as Priority;
    }
    if (workMode) {
      where.workMode = workMode as WorkMode;
    }
    if (jobType) {
      where.jobType = jobType as JobType;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search as string, mode: 'insensitive' } },
        { jobTitle: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        interviewPrep: true,
      },
    });

    res.json(applications);
  } catch (error: any) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const application = await prisma.application.findFirst({
      where: { id, userId },
      include: {
        interviewPrep: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error: any) {
    console.error('Fetch application details error:', error);
    res.status(500).json({ error: 'Failed to fetch application details' });
  }
});

// Helper for smart auto-priority calculation
function calculateAutoPriority(companyName: string, salary: number | undefined, lastDateToApply: string | undefined): Priority {
  // 1. Tier-1 Company list (Notion, Google, Stripe, Microsoft, Apple, Amazon, Meta, Netflix, ClickUp, Airbnb, Coinbase, Uber)
  const tier1Keywords = ['google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'stripe', 'notion', 'clickup', 'airbnb', 'uber', 'coinbase', 'salesforce', 'nvidia', 'atlassian'];
  const nameLower = companyName.toLowerCase();
  
  const isTier1 = tier1Keywords.some(keyword => nameLower.includes(keyword));
  if (isTier1) return Priority.HIGH;

  // 2. High Salary packages (Stipend > 75000/month or Package > 1200000/year)
  if (salary && salary >= 75000) {
    return Priority.HIGH;
  }

  // 3. Proximity of application deadline (within 3 days)
  if (lastDateToApply) {
    const deadline = new Date(lastDateToApply);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 3) {
      return Priority.HIGH;
    }
  }

  // Default priority calculations
  if (salary && salary >= 30000) {
    return Priority.MEDIUM;
  }

  return Priority.LOW;
}

// Helper to update application streaks
const updateGoalStreak = async (userId: string) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { userId } });
    if (!goal) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let newStreak = goal.streakCount;
    
    if (goal.lastApplied) {
      const lastAppliedDate = new Date(
        goal.lastApplied.getFullYear(),
        goal.lastApplied.getMonth(),
        goal.lastApplied.getDate()
      );
      const diffTime = today.getTime() - lastAppliedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // If diffDays is 0 (same day), maintain current streak
    } else {
      newStreak = 1;
    }

    await prisma.goal.update({
      where: { userId },
      data: {
        streakCount: newStreak,
        lastApplied: now,
      }
    });
  } catch (err) {
    console.error('Streak update failed:', err);
  }
};

// Create new application
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      companyName,
      jobTitle,
      jobType,
      applicationLink,
      salary,
      location,
      workMode,
      status,
      priority,
      applicationDate,
      lastDateToApply,
      examDate,
      interviewDate,
      expectedResultDate,
      notes,
      resumeVersion,
      coverLetterVersion,
      portfolioLink,
      linkedinLink,
      githubLink,
      interviewNotes,
      technicalQuestions,
      hrQuestions,
      feedback,
      prepResources
    } = req.body;

    if (!companyName || !jobTitle) {
      return res.status(400).json({ error: 'Company Name and Job Title are required' });
    }

    // Determine final priority (auto-priority if not set or default)
    let finalPriority = priority as Priority;
    if (!finalPriority) {
      finalPriority = calculateAutoPriority(companyName, salary ? Number(salary) : undefined, lastDateToApply);
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        userId,
        companyName,
        jobTitle,
        jobType: jobType || JobType.FULL_TIME,
        applicationLink,
        salary: salary ? parseFloat(salary) : null,
        location,
        workMode: workMode || WorkMode.ONSITE,
        status: status || ApplicationStatus.WISHLIST,
        priority: finalPriority,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : null,
        examDate: examDate ? new Date(examDate) : null,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        expectedResultDate: expectedResultDate ? new Date(expectedResultDate) : null,
        notes,
        resumeVersion,
        coverLetterVersion,
        portfolioLink,
        linkedinLink,
        githubLink,
        interviewPrep: {
          create: {
            interviewNotes: interviewNotes || '',
            technicalQuestions: technicalQuestions || '',
            hrQuestions: hrQuestions || '',
            feedback: feedback || '',
            prepResources: prepResources || ''
          }
        }
      },
      include: {
        interviewPrep: true
      }
    });

    // Record activity log
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'APPLICATION_CREATED',
        details: `Created application for ${jobTitle} at ${companyName}`
      }
    });

    // Update streak if the status represents a real action (e.g., Applied, Assessment, Interview)
    if (status && status !== ApplicationStatus.WISHLIST && status !== ApplicationStatus.PLANNING_TO_APPLY) {
      await updateGoalStreak(userId);
    }

    res.status(201).json(application);
  } catch (error: any) {
    console.error('Create application error:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update application
router.put('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const {
      companyName,
      jobTitle,
      jobType,
      applicationLink,
      salary,
      location,
      workMode,
      status,
      priority,
      applicationDate,
      lastDateToApply,
      examDate,
      interviewDate,
      expectedResultDate,
      notes,
      resumeVersion,
      coverLetterVersion,
      portfolioLink,
      linkedinLink,
      githubLink,
      interviewPrep // nested fields
    } = req.body;

    const existingApp = await prisma.application.findFirst({
      where: { id, userId }
    });

    if (!existingApp) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    // Check if status changed to log activity
    const statusChanged = status && status !== existingApp.status;

    // Update Application
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        companyName,
        jobTitle,
        jobType,
        applicationLink,
        salary: salary ? parseFloat(salary) : null,
        location,
        workMode,
        status,
        priority,
        applicationDate: applicationDate ? new Date(applicationDate) : undefined,
        lastDateToApply: lastDateToApply ? new Date(lastDateToApply) : lastDateToApply === null ? null : undefined,
        examDate: examDate ? new Date(examDate) : examDate === null ? null : undefined,
        interviewDate: interviewDate ? new Date(interviewDate) : interviewDate === null ? null : undefined,
        expectedResultDate: expectedResultDate ? new Date(expectedResultDate) : expectedResultDate === null ? null : undefined,
        notes,
        resumeVersion,
        coverLetterVersion,
        portfolioLink,
        linkedinLink,
        githubLink,
        interviewPrep: interviewPrep ? {
          upsert: {
            create: {
              interviewNotes: interviewPrep.interviewNotes || '',
              technicalQuestions: interviewPrep.technicalQuestions || '',
              hrQuestions: interviewPrep.hrQuestions || '',
              feedback: interviewPrep.feedback || '',
              prepResources: interviewPrep.prepResources || ''
            },
            update: {
              interviewNotes: interviewPrep.interviewNotes,
              technicalQuestions: interviewPrep.technicalQuestions,
              hrQuestions: interviewPrep.hrQuestions,
              feedback: interviewPrep.feedback,
              prepResources: interviewPrep.prepResources
            }
          }
        } : undefined
      },
      include: {
        interviewPrep: true
      }
    });

    if (statusChanged) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'STATUS_CHANGE',
          details: `Updated ${updatedApplication.companyName} application status from ${existingApp.status} to ${status}`
        }
      });

      // Update streaks if status changes to APPLIED
      if (status === ApplicationStatus.APPLIED) {
        await updateGoalStreak(userId);
      }
    }

    res.json(updatedApplication);
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Delete application
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existingApp = await prisma.application.findFirst({
      where: { id, userId }
    });

    if (!existingApp) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await prisma.application.delete({
      where: { id }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: userId!,
        action: 'APPLICATION_DELETED',
        details: `Deleted application for ${existingApp.jobTitle} at ${existingApp.companyName}`
      }
    });

    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
