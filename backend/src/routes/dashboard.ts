import { Router, Response } from 'express';
import prisma from '../db';
import { AuthRequest, authenticateJWT } from '../middlewares/auth';
import { ApplicationStatus } from '@prisma/client';

const router = Router();

router.get('/stats', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Fetch all user applications to process stats in memory or query specifically
    const apps = await prisma.application.findMany({
      where: { userId }
    });

    const totalCount = apps.length;

    // Filters based on status groups
    const appliedApps = apps.filter(a => 
      a.status !== ApplicationStatus.WISHLIST && 
      a.status !== ApplicationStatus.PLANNING_TO_APPLY
    );
    const appliedCount = appliedApps.length;

    const interviewsCount = apps.filter(a => 
      a.status === ApplicationStatus.INTERVIEW_ROUND_1 ||
      a.status === ApplicationStatus.INTERVIEW_ROUND_2 ||
      a.status === ApplicationStatus.HR_ROUND
    ).length;

    const assessmentsCount = apps.filter(a => 
      a.status === ApplicationStatus.ASSESSMENT_SCHEDULED
    ).length;

    const offersCount = apps.filter(a => 
      a.status === ApplicationStatus.OFFER_RECEIVED ||
      a.status === ApplicationStatus.JOINED ||
      a.status === ApplicationStatus.SELECTED
    ).length;

    const rejectionsCount = apps.filter(a => 
      a.status === ApplicationStatus.REJECTED
    ).length;

    // Success rate: Offers / (Offers + Rejections)
    let successRate = 0;
    if (offersCount + rejectionsCount > 0) {
      successRate = Math.round((offersCount / (offersCount + rejectionsCount)) * 100);
    }

    // Monthly applications: group by month of applicationDate (last 6 months)
    const monthlyStats: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyStats[label] = 0;
    }

    // Populate monthly counts
    apps.forEach(a => {
      if (a.status !== ApplicationStatus.WISHLIST && a.status !== ApplicationStatus.PLANNING_TO_APPLY) {
        const d = new Date(a.applicationDate);
        const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (monthlyStats[label] !== undefined) {
          monthlyStats[label]++;
        }
      }
    });

    const monthlyApplications = Object.keys(monthlyStats).map(name => ({
      name,
      applications: monthlyStats[name]
    }));

    // Weekly applications (last 4 weeks)
    const weeklyApplications = [];
    for (let i = 3; i >= 0; i--) {
      const startOfWeek = new Date();
      startOfWeek.setDate(today.getDate() - today.getDay() - (i * 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const count = apps.filter(a => {
        if (a.status === ApplicationStatus.WISHLIST || a.status === ApplicationStatus.PLANNING_TO_APPLY) return false;
        const appTime = new Date(a.applicationDate).getTime();
        return appTime >= startOfWeek.getTime() && appTime <= endOfWeek.getTime();
      }).length;

      weeklyApplications.push({
        name: `Week ${4 - i}`,
        applications: count
      });
    }

    // Conversion rate stats
    const wishlistCount = apps.filter(a => a.status === ApplicationStatus.WISHLIST || a.status === ApplicationStatus.PLANNING_TO_APPLY).length;
    const assessmentCompletedCount = apps.filter(a => a.status === ApplicationStatus.ASSESSMENT_COMPLETED).length;
    
    const funnel = [
      { stage: 'Wishlist/Plan', count: wishlistCount + appliedCount },
      { stage: 'Applied', count: appliedCount },
      { stage: 'Assessments', count: assessmentsCount + assessmentCompletedCount + interviewsCount + offersCount },
      { stage: 'Interviews', count: interviewsCount + offersCount },
      { stage: 'Offers', count: offersCount }
    ];

    // Activity log (latest 5 logs)
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calendar events
    const calendarEvents: any[] = [];
    apps.forEach(a => {
      if (a.lastDateToApply) {
        calendarEvents.push({
          id: `${a.id}-deadline`,
          title: `Apply: ${a.companyName} (${a.jobTitle})`,
          date: a.lastDateToApply,
          type: 'deadline',
          company: a.companyName,
          role: a.jobTitle
        });
      }
      if (a.examDate) {
        calendarEvents.push({
          id: `${a.id}-exam`,
          title: `Exam: ${a.companyName}`,
          date: a.examDate,
          type: 'exam',
          company: a.companyName,
          role: a.jobTitle
        });
      }
      if (a.interviewDate) {
        calendarEvents.push({
          id: `${a.id}-interview`,
          title: `Interview: ${a.companyName}`,
          date: a.interviewDate,
          type: 'interview',
          company: a.companyName,
          role: a.jobTitle
        });
      }
    });

    res.json({
      metrics: {
        totalOpportunities: totalCount,
        appliedCount,
        interviewsScheduled: interviewsCount,
        upcomingAssessments: assessmentsCount,
        offersReceived: offersCount,
        rejectionsCount,
        successRate
      },
      monthlyApplications,
      weeklyApplications,
      funnel,
      activityLogs: logs,
      calendarEvents
    });
  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

export default router;
