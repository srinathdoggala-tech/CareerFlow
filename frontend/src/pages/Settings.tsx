import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Settings as SettingsIcon, Zap, FileText, Check, AlertCircle, Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Goals State
  const [dailyGoal, setDailyGoal] = useState('5');
  const [weeklyGoal, setWeeklyGoal] = useState('20');
  const [monthlyGoal, setMonthlyGoal] = useState('80');
  
  // Profile default assets State (Pre-fills new apps)
  const [resumeVersion, setResumeVersion] = useState('v1.0');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Fetch goals
    api.goals.get()
      .then((data) => {
        if (data && data.goalSettings) {
          setDailyGoal(String(data.goalSettings.dailyGoal));
          setWeeklyGoal(String(data.goalSettings.weeklyGoal));
          setMonthlyGoal(String(data.goalSettings.monthlyGoal));
        }
      })
      .catch((err) => console.error('Failed to load goals settings:', err))
      .finally(() => setLoading(false));

    // Load defaults from local storage
    setResumeVersion(localStorage.getItem('cf_default_resume') || 'v1.0');
    setLinkedinLink(localStorage.getItem('cf_default_linkedin') || 'https://linkedin.com/in/');
    setGithubLink(localStorage.getItem('cf_default_github') || 'https://github.com/');
    setPortfolioLink(localStorage.getItem('cf_default_portfolio') || '');
  }, []);

  const handleSaveGoals = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGoals(true);
    setMessage(null);
    try {
      await api.goals.update({
        dailyGoal: parseInt(dailyGoal),
        weeklyGoal: parseInt(weeklyGoal),
        monthlyGoal: parseInt(monthlyGoal)
      });
      setMessage({ text: 'Application targets updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update goals', type: 'error' });
    } finally {
      setSavingGoals(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    try {
      localStorage.setItem('cf_default_resume', resumeVersion);
      localStorage.setItem('cf_default_linkedin', linkedinLink);
      localStorage.setItem('cf_default_github', githubLink);
      localStorage.setItem('cf_default_portfolio', portfolioLink);
      setMessage({ text: 'Default profile templates saved!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to write browser storage', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] text-slate-400 select-none">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-800 rounded-full animate-spin mb-4"></div>
        <span>Retrieving account settings...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden select-none p-8 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-slate-400" />
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Settings & Targets</h1>
          <p className="text-slate-500 text-xs mt-1">Adjust your career tracker settings, application quotas, and resume credentials</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-xs flex items-center gap-2 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Goals Target Settings */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />
            <h3 className="font-bold text-sm text-slate-200">Application Quota Targets</h3>
          </div>

          <form onSubmit={handleSaveGoals} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Daily Goal Target
              </label>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Weekly Goal Target
              </label>
              <input
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Monthly Goal Target
              </label>
              <input
                type="number"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingGoals}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingGoals ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Update Goals
            </button>
          </form>
        </div>

        {/* Global pre-fills Settings */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText className="h-4.5 w-4.5 text-blue-500" />
            <h3 className="font-bold text-sm text-slate-200">Default Outreach Profile</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Default Resume Version
              </label>
              <input
                type="text"
                value={resumeVersion}
                onChange={(e) => setResumeVersion(e.target.value)}
                placeholder="e.g. Software_Eng_v2.pdf"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                GitHub Profile URL
              </label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Portfolio Website URL
              </label>
              <input
                type="url"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Save Profile Templates
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
