import React, { useState } from 'react';
import { api } from '../lib/api';
import { 
  Edit, Trash2, Download, Filter, MapPin, DollarSign, Calendar
} from 'lucide-react';

interface ApplicationsListProps {
  onEditApplication: (id: string) => void;
  applications: any[];
  refreshApplications: () => void;
  filters: any;
  setFilters: (filters: any) => void;
}

export const ApplicationsList: React.FC<ApplicationsListProps> = ({
  onEditApplication,
  applications,
  refreshApplications,
  filters,
  setFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      workMode: '',
      jobType: '',
      search: filters.search // Keep search query
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.applications.delete(id);
      refreshApplications();
    } catch (err) {
      console.error('Delete application error:', err);
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (applications.length === 0) return;
    
    const headers = [
      'Company Name', 'Job Title', 'Job Type', 'Work Mode', 'Status', 
      'Priority', 'Salary', 'Location', 'Application Date', 
      'Deadline', 'Exam Date', 'Interview Date', 'Notes', 
      'Resume Version', 'LinkedIn Link', 'GitHub Link'
    ];

    const rows = applications.map(app => [
      `"${app.companyName.replace(/"/g, '""')}"`,
      `"${app.jobTitle.replace(/"/g, '""')}"`,
      app.jobType,
      app.workMode,
      app.status,
      app.priority || 'MEDIUM',
      app.salary || '',
      `"${(app.location || '').replace(/"/g, '""')}"`,
      app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : '',
      app.lastDateToApply ? new Date(app.lastDateToApply).toLocaleDateString() : '',
      app.examDate ? new Date(app.examDate).toLocaleDateString() : '',
      app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : '',
      `"${(app.notes || '').replace(/"/g, '""')}"`,
      app.resumeVersion || '',
      app.linkedinLink || '',
      app.githubLink || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `careerflow_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'HIGH': return 'text-red-400 bg-red-500/10 border-red-500/10';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/10';
      case 'LOW': return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/10';
    }
  };

  const getStatusColor = (s: string) => {
    if (['SELECTED', 'OFFER_RECEIVED', 'JOINED'].includes(s)) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10';
    if (s === 'REJECTED') return 'text-red-400 bg-red-500/10 border-red-500/10';
    if (['INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2', 'HR_ROUND'].includes(s)) return 'text-purple-400 bg-purple-500/10 border-purple-500/10';
    if (['ASSESSMENT_SCHEDULED', 'ASSESSMENT_COMPLETED'].includes(s)) return 'text-amber-400 bg-amber-500/10 border-amber-500/10';
    if (s === 'APPLIED') return 'text-blue-400 bg-blue-500/10 border-blue-500/10';
    return 'text-slate-400 bg-slate-800/60 border-slate-700/50';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden select-none p-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Structured Applications</h1>
          <p className="text-slate-500 text-xs mt-1">Advanced spreadsheet grid with search filters and data export</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showFilters 
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={applications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-panel p-5 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="WISHLIST">Wishlist</option>
              <option value="PLANNING_TO_APPLY">Planning to Apply</option>
              <option value="APPLIED">Applied</option>
              <option value="ASSESSMENT_SCHEDULED">Assessment Scheduled</option>
              <option value="ASSESSMENT_COMPLETED">Assessment Completed</option>
              <option value="INTERVIEW_ROUND_1">Interview Round 1</option>
              <option value="INTERVIEW_ROUND_2">Interview Round 2</option>
              <option value="HR_ROUND">HR Round</option>
              <option value="SELECTED">Selected</option>
              <option value="OFFER_RECEIVED">Offer Received</option>
              <option value="JOINED">Joined</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Work Mode</label>
            <select
              value={filters.workMode}
              onChange={(e) => handleFilterChange('workMode', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Work Modes</option>
              <option value="ONSITE">Onsite</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Job Types</option>
              <option value="FULL_TIME">Full-Time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={clearFilters}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="flex-1 border border-slate-800 bg-[#161B26]/30 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#161B26]/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none sticky top-0 z-10">
                <th className="py-3 px-5">Company / Title</th>
                <th className="py-3 px-4">Job Details</th>
                <th className="py-3 px-4">Salary</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Next Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {applications.length > 0 ? (
                applications.map((app) => {
                  let dateLabel = '';
                  let dateVal = null;
                  if (app.interviewDate) {
                    dateLabel = 'Interview';
                    dateVal = new Date(app.interviewDate);
                  } else if (app.examDate) {
                    dateLabel = 'Exam';
                    dateVal = new Date(app.examDate);
                  } else if (app.lastDateToApply) {
                    dateLabel = 'Deadline';
                    dateVal = new Date(app.lastDateToApply);
                  }

                  return (
                    <tr 
                      key={app.id} 
                      onClick={() => onEditApplication(app.id)}
                      className="hover:bg-slate-900/30 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5">
                        <span className="text-[10px] text-slate-500 font-semibold block leading-none">{app.companyName}</span>
                        <span className="font-bold text-slate-200 text-sm mt-1 block group-hover:text-blue-400 transition-colors">
                          {app.jobTitle}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full mr-1.5">
                          {app.workMode}
                        </span>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                          {app.jobType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-300">
                        {app.salary ? (
                          <span className="flex items-center gap-0.5">
                            <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                            {app.salary.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-medium max-w-[150px] truncate">
                        {app.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            {app.location}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(app.status)}`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getPriorityColor(app.priority || 'MEDIUM')}`}>
                          {app.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-semibold whitespace-nowrap">
                        {dateVal ? (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {dateLabel}: {dateVal.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditApplication(app.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No applications matched your criteria. Try adding an opportunity or clearing filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
