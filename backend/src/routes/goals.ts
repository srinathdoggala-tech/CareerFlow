import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateJWT } from '../middlewares/auth';
import { ApplicationStatus } from '@prisma/client';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Fetch goals
    let goal = await prisma.goal.findUnique({
      where: { userId }
    });

    if (!goal) {
      goal = await prisma.goal.create({
        data: {
          userId,
          dailyGoal: 5,
          weeklyGoal: 20,
          monthlyGoal: 80,
          streakCount: 0
        }
      });
    }

    // Fetch all user applications (that count as real applications)
    const apps = await prisma.application.findMany({
      where: {
        userId,
        status: {
          notIn: [ApplicationStatus.WISHLIST, ApplicationStatus.PLANNING_TO_APPLY]
        }
      }
    });

    // Compute progress
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Start of week (Sunday)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    
    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const appliedToday = apps.filter(a => new Date(a.applicationDate) >= startOfToday).length;
    const appliedThisWeek = apps.filter(a => new Date(a.applicationDate) >= startOfWeek).length;
    const appliedThisMonth = apps.filter(a => new Date(a.applicationDate) >= startOfMonth).length;

    // Daily progress percentage
    const dailyProgress = goal.dailyGoal > 0 ? Math.min(Math.round((appliedToday / goal.dailyGoal) * 100), 100) : 0;
    const weeklyProgress = goal.weeklyGoal > 0 ? Math.min(Math.round((appliedThisWeek / goal.weeklyGoal) * 100), 100) : 0;
    const monthlyProgress = goal.monthlyGoal > 0 ? Math.min(Math.round((appliedThisMonth / goal.monthlyGoal) * 100), 100) : 0;

    res.json({
      goalSettings: goal,
      progress: {
        daily: { count: appliedToday, target: goal.dailyGoal, percentage: dailyProgress },
        weekly: { count: appliedThisWeek, target: goal.weeklyGoal, percentage: weeklyProgress },
        monthly: { count: appliedThisMonth, target: goal.monthlyGoal, percentage: monthlyProgress },
        streak: goal.streakCount
      }
    });
  } catch (error: any) {
    console.error('Fetch goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goal progress' });
  }
});

router.put('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { dailyGoal, weeklyGoal, monthlyGoal } = req.body;

    const updatedGoal = await prisma.goal.update({
      where: { userId },
      data: {
        dailyGoal: dailyGoal ? parseInt(dailyGoal) : undefined,
        weeklyGoal: weeklyGoal ? parseInt(weeklyGoal) : undefined,
        monthlyGoal: monthlyGoal ? parseInt(monthlyGoal) : undefined
      }
    });

    res.json(updatedGoal);
  } catch (error: any) {
    console.error('Update goals error:', error);
    res.status(500).json({ error: 'Failed to update goal settings' });
  }
});

export default router;
