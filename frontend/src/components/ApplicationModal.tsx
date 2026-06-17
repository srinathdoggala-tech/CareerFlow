import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, Briefcase, Calendar, FileText, Bookmark, Check } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  applicationId?: string | null; // If provided, we are editing
  initialStatus?: string | null; // For Kanban column quick addition
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  applicationId,
  initialStatus
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'timeline' | 'assets' | 'prep'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [applicationLink, setApplicationLink] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('ONSITE');
  const [status, setStatus] = useState('WISHLIST');
  const [priority, setPriority] = useState(''); // empty string means auto-calculate
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastDateToApply, setLastDateToApply] = useState('');
  const [examDate, setExamDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [expectedResultDate, setExpectedResultDate] = useState('');
  const [notes, setNotes] = useState('');

  // Resume & Links
  const [resumeVersion, setResumeVersion] = useState('v1.0');
  const [coverLetterVersion, setCoverLetterVersion] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [githubLink, setGithubLink] = useState('');

  // Interview Prep
  const [interviewNotes, setInterviewNotes] = useState('');
  const [technicalQuestions, setTechnicalQuestions] = useState('');
  const [hrQuestions, setHRQuestions] = useState('');
  const [feedback, setFeedback] = useState('');
  const [prepResources, setPrepResources] = useState('');

  // Fetch data if editing
  useEffect(() => {
    if (applicationId && isOpen) {
      setLoading(true);
      setError(null);
      api.applications.get(applicationId)
        .then((data) => {
          setCompanyName(data.companyName || '');
          setJobTitle(data.jobTitle || '');
          setJobType(data.jobType || 'FULL_TIME');
          setApplicationLink(data.applicationLink || '');
          setSalary(data.salary ? String(data.salary) : '');
          setLocation(data.location || '');
          setWorkMode(data.workMode || 'ONSITE');
          setStatus(data.status || 'WISHLIST');
          setPriority(data.priority || '');
          setApplicationDate(data.applicationDate ? new Date(data.applicationDate).toISOString().split('T')[0] : '');
          setLastDateToApply(data.lastDateToApply ? new Date(data.lastDateToApply).toISOString().split('T')[0] : '');
          setExamDate(data.examDate ? new Date(data.examDate).toISOString().split('T')[0] : '');
          setInterviewDate(data.interviewDate ? new Date(data.interviewDate).toISOString().split('T')[0] : '');
          setExpectedResultDate(data.expectedResultDate ? new Date(data.expectedResultDate).toISOString().split('T')[0] : '');
          setNotes(data.notes || '');
          setResumeVersion(data.resumeVersion || '');
          setCoverLetterVersion(data.coverLetterVersion || '');
          setPortfolioLink(data.portfolioLink || '');
          setLinkedinLink(data.linkedinLink || '');
          setGithubLink(data.githubLink || '');
          
          if (data.interviewPrep) {
            setInterviewNotes(data.interviewPrep.interviewNotes || '');
            setTechnicalQuestions(data.interviewPrep.technicalQuestions || '');
            setHRQuestions(data.interviewPrep.hrQuestions || '');
            setFeedback(data.interviewPrep.feedback || '');
            setPrepResources(data.interviewPrep.prepResources || '');
          }
        })
        .catch(() => setError('Failed to load application details.'))
        .finally(() => setLoading(false));
    } else {
      // Clear for new entry
      setCompanyName('');
      setJobTitle('');
      setJobType('FULL_TIME');
      setApplicationLink('');
      setSalary('');
      setLocation('');
      setWorkMode('ONSITE');
      setStatus(initialStatus || 'WISHLIST');
      setPriority('');
      setApplicationDate(new Date().toISOString().split('T')[0]);
      setLastDateToApply('');
      setExamDate('');
      setInterviewDate('');
      setExpectedResultDate('');
      setNotes('');
      setResumeVersion('v1.0');
      setCoverLetterVersion('');
      setPortfolioLink('');
      setLinkedinLink('');
      setGithubLink('');
      setInterviewNotes('');
      setTechnicalQuestions('');
      setHRQuestions('');
      setFeedback('');
      setPrepResources('');
      setActiveTab('basic');
    }
  }, [applicationId, isOpen, initialStatus]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) {
      setError('Company Name and Job Title are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      companyName,
      jobTitle,
      jobType,
      applicationLink,
      salary: salary ? parseFloat(salary) : null,
      location,
      workMode,
      status,
      priority: priority || undefined, // Send undefined to let backend auto-calculate
      applicationDate,
      lastDateToApply: lastDateToApply || null,
      examDate: examDate || null,
      interviewDate: interviewDate || null,
      expectedResultDate: expectedResultDate || null,
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
      prepResources,
      // Nested prep notes structure if editing
      interviewPrep: applicationId ? {
        interviewNotes,
        technicalQuestions,
        hrQuestions,
        feedback,
        prepResources
      } : undefined
    };

    try {
      if (applicationId) {
        await api.applications.update(applicationId, payload);
      } else {
        await api.applications.create(payload);
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-[#161B26] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            {applicationId ? 'Edit Application' : 'Add Opportunity'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-4">
          {[
            { id: 'basic', label: 'Basic Details', icon: Briefcase },
            { id: 'timeline', label: 'Timeline & Status', icon: Calendar },
            { id: 'assets', label: 'Resume & Links', icon: FileText },
            { id: 'prep', label: 'Interview Prep', icon: Bookmark },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12 text-slate-500">
              <span className="animate-pulse">Loading application data...</span>
            </div>
          )}

          <div className={loading ? 'hidden' : 'space-y-4'}>
            {/* Tab 1: Basic Details */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Work Mode</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Salary / Stipend (Monthly/Annual)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Application Link</label>
                  <input
                    type="url"
                    value={applicationLink}
                    onChange={(e) => setApplicationLink(e.target.value)}
                    placeholder="https://careers.google.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Auto-Calculate Priority (Smart)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab 2: Timeline & Status */}
            {activeTab === 'timeline' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Pipeline Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="WISHLIST">Wishlist</option>
                    <option value="PLANNING_TO_APPLY">Planning to Apply</option>
                    <option value="APPLIED">Applied</option>
                    <option value="ASSESSMENT_SCHEDULED">Assessment Scheduled</option>
                    <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
                    <option value="INTERVIEW_ROUND_1">Interview Round 1</option>
                    <option value="INTERVIEW_ROUND_2">Interview Round 2</option>
                    <option value="HR_ROUND">HR Round</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="OFFER_RECEIVED">Offer Received</option>
                    <option value="JOINED">Joined</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Application Date</label>
                  <input
                    type="date"
                    value={applicationDate}
                    onChange={(e) => setApplicationDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Last Date to Apply</label>
                  <input
                    type="date"
                    value={lastDateToApply}
                    onChange={(e) => setLastDateToApply(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Assessment/Exam Date</label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Expected Result Date</label>
                  <input
                    type="date"
                    value={expectedResultDate}
                    onChange={(e) => setExpectedResultDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">General Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Provide details about requirements, preparation logs, or general notes..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Resume & Links */}
            {activeTab === 'assets' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Resume Version Used</label>
                  <input
                    type="text"
                    value={resumeVersion}
                    onChange={(e) => setResumeVersion(e.target.value)}
                    placeholder="e.g. Software_v2.pdf"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Cover Letter Used</label>
                  <input
                    type="text"
                    value={coverLetterVersion}
                    onChange={(e) => setCoverLetterVersion(e.target.value)}
                    placeholder="e.g. Google_CoverLetter.pdf"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={linkedinLink}
                    onChange={(e) => setLinkedinLink(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Portfolio Link</label>
                  <input
                    type="url"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    placeholder="https://myportfolio.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Interview Prep */}
            {activeTab === 'prep' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Technical Preparation Questions</label>
                  <textarea
                    value={technicalQuestions}
                    onChange={(e) => setTechnicalQuestions(e.target.value)}
                    rows={3}
                    placeholder="List coding questions, system design topics, or algorithms asked..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">HR & Behavioral Questions</label>
                  <textarea
                    value={hrQuestions}
                    onChange={(e) => setHRQuestions(e.target.value)}
                    rows={3}
                    placeholder="Tell me about a time you resolved conflict... Why Google?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Interview Feedback / Experience</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={2}
                    placeholder="Notes on how the round went, points of improvement, and followups..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Preparation Resources & Links</label>
                  <textarea
                    value={prepResources}
                    onChange={(e) => setPrepResources(e.target.value)}
                    rows={2}
                    placeholder="Leetcode links, sheets, design papers, documentation urls..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-800 rounded-lg text-sm text-slate-400 hover:bg-slate-850 hover:text-slate-350 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10 disabled:opacity-50"
          >
            <Check className="h-4.5 w-4.5" />
            {applicationId ? 'Save Changes' : 'Create Application'}
          </button>
        </div>
      </div>
    </div>
  );
};
