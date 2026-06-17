import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Briefcase, CheckCircle, Clock, AlertTriangle, TrendingUp, Zap, Calendar, RefreshCw
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [statsData, setStatsData] = useState<any>(null);
  const [goalsData, setGoalsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const stats = await api.dashboard.getStats();
      const goals = await api.goals.get();
      setStatsData(stats);
      setGoalsData(goals);
    } catch (err: any) {
      console.error('Fetch dashboard error:', err);
      setError('Could not connect to the database. Make sure the backend server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] text-slate-400 select-none">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-800 rounded-full animate-spin mb-4"></div>
        <span>Assembling your dashboard metrics...</span>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex-1 p-8 bg-[#0B0F19] flex flex-col items-center justify-center select-none text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl max-w-md flex flex-col items-center gap-3">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-semibold">{error}</p>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-350 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { metrics, monthlyApplications, funnel, activityLogs, calendarEvents } = statsData;
  const { progress } = goalsData;

  const cards = [
    { 
      title: 'Total Opportunities', 
      value: metrics.totalOpportunities, 
      desc: 'Wishlisted & applied jobs', 
      icon: Briefcase, 
      color: 'border-l-slate-500 text-slate-400 bg-slate-500/5' 
    },
    { 
      title: 'Applied Applications', 
      value: metrics.appliedCount, 
      desc: 'Active job applications', 
      icon: TrendingUp, 
      color: 'border-l-blue-500 text-blue-400 bg-blue-500/5' 
    },
    { 
      title: 'Upcoming Assessments', 
      value: metrics.upcomingAssessments, 
      desc: 'Tests scheduled soon', 
      icon: AlertTriangle, 
      color: 'border-l-amber-500 text-amber-400 bg-amber-500/5' 
    },
    { 
      title: 'Interviews Scheduled', 
      value: metrics.interviewsScheduled, 
      desc: 'Active round discussions', 
      icon: Clock, 
      color: 'border-l-purple-500 text-purple-400 bg-purple-500/5' 
    },
    { 
      title: 'Offers Received', 
      value: metrics.offersReceived, 
      desc: 'Offer letters in-hand', 
      icon: CheckCircle, 
      color: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/5' 
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#0B0F19] space-y-8 select-none">
      {/* Welcome & Goal Streak Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Smart Analytics</h1>
          <p className="text-slate-500 text-xs mt-1">Real-time tracker of job applications and response pipelines</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Streak Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl">
            <Zap className="h-5 w-5 text-amber-400 fill-amber-400 animate-pulse" />
            <div>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wider leading-none">Application Streak</p>
              <p className="text-lg font-bold text-slate-200">{progress.streak} {progress.streak === 1 ? 'Day' : 'Days'}</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4.5 w-4.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`glass-card p-5 border-l-4 rounded-xl flex flex-col justify-between ${card.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-semibold">{card.title}</span>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                <p className="text-[10px] text-slate-500 mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals widget row & charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals widget */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <Zap className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
              Job Application Goals
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Keep applying to maintain your streak</p>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {/* Daily Goal */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1.5">
                <span>Daily Target</span>
                <span>{progress.daily.count} / {progress.daily.target} applied</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.daily.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Weekly Goal */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1.5">
                <span>Weekly Target</span>
                <span>{progress.weekly.count} / {progress.weekly.target} applied</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.weekly.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Monthly Goal */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-350 mb-1.5">
                <span>Monthly Target</span>
                <span>{progress.monthly.count} / {progress.monthly.target} applied</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progress.monthly.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-500">
              Change goal settings in the Settings panel
            </span>
          </div>
        </div>

        {/* Monthly Applications Chart */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2">
          <h3 className="font-bold text-sm text-slate-200 mb-4">Applications Trend</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyApplications} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b26', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '10px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funnel & Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-200">Application Pipeline Funnel</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span>Success Rate: {metrics.successRate}%</span>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="stage" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b26', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Logs & Upcoming events */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-blue-400" />
              Upcoming Deadlines & Tests
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {calendarEvents.slice(0, 4).length > 0 ? (
                calendarEvents.slice(0, 4).map((evt: any, idx: number) => {
                  const colors = 
                    evt.type === 'deadline' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    evt.type === 'exam' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-purple-500/10 border-purple-500/20 text-purple-400';
                  return (
                    <div key={idx} className={`p-2.5 border rounded-lg text-xs flex justify-between items-center ${colors}`}>
                      <div className="truncate pr-2">
                        <p className="font-bold truncate">{evt.company}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{evt.role}</p>
                      </div>
                      <span className="font-semibold whitespace-nowrap text-[10px] uppercase">
                        {evt.type}: {new Date(evt.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 py-6 text-center">No upcoming dates scheduled.</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-4">
            <h4 className="font-semibold text-xs text-slate-350 mb-3">Recent Activity Log</h4>
            <div className="space-y-2.5">
              {activityLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-2 text-[10px] leading-tight">
                  <span className="text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-slate-400 truncate"><strong className="text-slate-300">{log.action}:</strong> {log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
