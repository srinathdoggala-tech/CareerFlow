import React, { useState } from 'react';
import { api } from '../lib/api';
import { 
  Plus, Calendar, DollarSign, Edit, Trash2
} from 'lucide-react';

interface KanbanBoardProps {
  onEditApplication: (id: string) => void;
  onAddApplicationInStatus: (status: string) => void;
  applications: any[];
  refreshApplications: () => void;
}

const PIPELINE_COLUMNS = [
  { id: 'WISHLIST', name: 'Wishlist', color: 'border-t-slate-500 bg-slate-500/5 text-slate-400' },
  { id: 'PLANNING_TO_APPLY', name: 'Planning', color: 'border-t-teal-500 bg-teal-500/5 text-teal-400' },
  { id: 'APPLIED', name: 'Applied', color: 'border-t-blue-500 bg-blue-500/5 text-blue-400' },
  { id: 'ASSESSMENT_SCHEDULED', name: 'Test Scheduled', color: 'border-t-amber-500 bg-amber-500/5 text-amber-400' },
  { id: 'ASSESSMENT_COMPLETED', name: 'Test Done', color: 'border-t-yellow-600 bg-yellow-600/5 text-yellow-500' },
  { id: 'INTERVIEW_ROUND_1', name: 'Interview R1', color: 'border-t-indigo-500 bg-indigo-500/5 text-indigo-400' },
  { id: 'INTERVIEW_ROUND_2', name: 'Interview R2', color: 'border-t-purple-500 bg-purple-500/5 text-purple-400' },
  { id: 'HR_ROUND', name: 'HR Round', color: 'border-t-pink-500 bg-pink-500/5 text-pink-400' },
  { id: 'OFFER_RECEIVED', name: 'Offer Received', color: 'border-t-emerald-500 bg-emerald-500/5 text-emerald-400' },
  { id: 'SELECTED', name: 'Selected', color: 'border-t-green-600 bg-green-600/5 text-green-500' },
  { id: 'JOINED', name: 'Joined', color: 'border-t-green-500 bg-green-500/5 text-green-400' },
  { id: 'REJECTED', name: 'Rejected', color: 'border-t-red-500 bg-red-500/5 text-red-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onEditApplication,
  onAddApplicationInStatus,
  applications,
  refreshApplications
}) => {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardDrop = async (targetStatus: string) => {
    if (!draggedCardId) return;
    
    // Find the current application
    const app = applications.find(a => a.id === draggedCardId);
    if (!app || app.status === targetStatus) {
      setDraggedCardId(null);
      return;
    }

    try {
      // Optimistic Update
      app.status = targetStatus;
      
      await api.applications.update(draggedCardId, { status: targetStatus });
      refreshApplications();
    } catch (err) {
      console.error('Failed to update status on drop:', err);
    } finally {
      setDraggedCardId(null);
    }
  };

  const handleDeleteCard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete application card?')) return;
    try {
      await api.applications.delete(id);
      refreshApplications();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const formatSalary = (salary: number | null) => {
    if (!salary) return '';
    if (salary >= 100000) return `${(salary / 100000).toFixed(1)}L`;
    return `${salary.toLocaleString()}`;
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'MEDIUM': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'LOW': return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden select-none">
      {/* Scrollable Columns Container */}
      <div className="flex-1 overflow-x-auto flex gap-4 p-8 items-start h-full scrollbar-thin">
        {PIPELINE_COLUMNS.map((col) => {
          // Filter applications matching status
          const colApps = applications.filter(app => app.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleCardDrop(col.id)}
              className="w-80 flex-shrink-0 flex flex-col max-h-[80vh] rounded-xl border border-slate-800/60 bg-[#161B26]/30 overflow-hidden"
            >
              {/* Column Header */}
              <div className={`p-4 border-t-2 border-b border-slate-800 flex justify-between items-center ${col.color}`}>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider">{col.name}</h4>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddApplicationInStatus(col.id)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] scrollbar-none">
                {colApps.length > 0 ? (
                  colApps.map((card) => {
                    // Determine next key date to display
                    let dateLabel = '';
                    let dateVal = null;
                    if (card.interviewDate) {
                      dateLabel = 'Interview';
                      dateVal = new Date(card.interviewDate);
                    } else if (card.examDate) {
                      dateLabel = 'Exam';
                      dateVal = new Date(card.examDate);
                    } else if (card.lastDateToApply) {
                      dateLabel = 'Deadline';
                      dateVal = new Date(card.lastDateToApply);
                    }

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                        onClick={() => onEditApplication(card.id)}
                        className="glass-card p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-slate-700/60 flex flex-col gap-3 group border border-slate-800/40 bg-slate-900/10"
                      >
                        {/* Company & Edit/Delete */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.companyName}</span>
                            <h5 className="font-bold text-slate-200 text-sm leading-tight mt-0.5 group-hover:text-blue-400 transition-colors">
                              {card.jobTitle}
                            </h5>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditApplication(card.id); }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-200"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteCard(card.id, e)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Location, Salary Badges */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {card.priority && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${getPriorityBadgeColor(card.priority)}`}>
                              {card.priority}
                            </span>
                          )}
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-full">
                            {card.workMode}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/50 rounded-full">
                            {card.jobType.replace('_', ' ')}
                          </span>
                          {card.salary && (
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-full flex items-center">
                              <DollarSign className="h-2.5 w-2.5 -mr-0.5" />
                              {formatSalary(card.salary)}
                            </span>
                          )}
                        </div>

                        {/* Next event date */}
                        {dateVal && (
                          <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              {dateLabel}
                            </span>
                            <span className={dateLabel === 'Deadline' ? 'text-red-400/80' : 'text-slate-400'}>
                              {dateVal.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center py-12 border-2 border-dashed border-slate-800/30 rounded-xl">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Drag cards here</span>
                  </div>
                )}
              </div>

              {/* Column Footer Quick Add */}
              <button
                onClick={() => onAddApplicationInStatus(col.id)}
                className="p-3 border-t border-slate-800/40 text-left text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-slate-900/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Add opportunity
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
