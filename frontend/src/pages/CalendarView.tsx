import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../lib/api';
import { Info } from 'lucide-react';

interface CalendarViewProps {
  onEditApplication: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEditApplication }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.getStats()
      .then((data) => {
        // Map stats calendarEvents into FullCalendar events format
        const mapped = (data.calendarEvents || []).map((evt: any) => {
          let color = '#3b82f6'; // blue for applied/general
          if (evt.type === 'deadline') color = '#ef4444'; // red
          if (evt.type === 'exam') color = '#f59e0b'; // amber
          if (evt.type === 'interview') color = '#8b5cf6'; // purple

          return {
            id: evt.id.split('-')[0], // Extract application UUID
            title: evt.title,
            start: evt.date.split('T')[0],
            backgroundColor: color,
            borderColor: 'transparent',
            extendedProps: {
              type: evt.type,
              company: evt.company,
              role: evt.role
            }
          };
        });
        setEvents(mapped);
      })
      .catch((err) => console.error('Failed to load calendar events:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleEventClick = (info: any) => {
    const applicationId = info.event.id;
    if (applicationId) {
      onEditApplication(applicationId);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0F19] text-slate-400 select-none">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-800 rounded-full animate-spin mb-4"></div>
        <span>Syncing dates with your calendar...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] overflow-hidden p-8 space-y-6 select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Event Calendar</h1>
          <p className="text-slate-500 text-xs mt-1">Deadlines, scheduled coding assessments, and interview rounds</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-400">Deadlines</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]"></span>
            <span className="text-slate-400">Exams</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#8b5cf6]"></span>
            <span className="text-slate-400">Interviews</span>
          </div>
        </div>
      </div>

      {/* Calendar Wrapper with Dark Mode Styles */}
      <div className="flex-1 glass-panel p-6 rounded-xl overflow-y-auto scrollbar-thin fc-dark-theme">
        {/* Embed style element for FullCalendar customization */}
        <style dangerouslySetInnerHTML={{__html: `
          .fc-dark-theme .fc {
            color: #e2e8f0;
            background: transparent;
            font-family: inherit;
          }
          .fc-dark-theme .fc-theme-standard td, 
          .fc-dark-theme .fc-theme-standard th, 
          .fc-dark-theme .fc-theme-standard .fc-scrollgrid {
            border-color: #1e293b !important;
          }
          .fc-dark-theme .fc-header-toolbar {
            margin-bottom: 1.5rem !important;
          }
          .fc-dark-theme .fc-toolbar-title {
            font-size: 1.125rem !important;
            font-weight: 700 !important;
            color: #f1f5f9;
          }
          .fc-dark-theme .fc-button {
            background-color: #1e293b !important;
            border-color: #334155 !important;
            color: #94a3b8 !important;
            font-size: 0.75rem !important;
            font-weight: 600 !important;
            text-transform: capitalize !important;
            box-shadow: none !important;
            cursor: pointer;
          }
          .fc-dark-theme .fc-button-active, 
          .fc-dark-theme .fc-button:hover {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #ffffff !important;
          }
          .fc-dark-theme .fc-button-primary:disabled {
            background-color: #0b0f19 !important;
            border-color: #1e293b !important;
            color: #475569 !important;
          }
          .fc-dark-theme .fc-daygrid-day {
            background-color: rgba(22, 27, 38, 0.2);
          }
          .fc-dark-theme .fc-daygrid-day.fc-day-today {
            background-color: rgba(59, 130, 246, 0.05) !important;
          }
          .fc-dark-theme .fc-daygrid-day-number {
            color: #64748b;
            font-weight: 600;
            font-size: 0.75rem;
            padding: 4px 6px !important;
          }
          .fc-dark-theme .fc-event {
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.7rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .fc-dark-theme .fc-col-header-cell-cushion {
            color: #94a3b8;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 8px 0 !important;
          }
          .fc-dark-theme .fc-day-other {
            opacity: 0.3;
          }
        `}} />
        
        <div className="flex gap-2 items-center text-xs text-blue-400 bg-blue-500/10 border border-blue-500/15 p-3 rounded-lg mb-6 leading-none">
          <Info className="h-4 w-4" />
          <span>Click on any calendar event card to inspect and update application notes.</span>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
        />
      </div>
    </div>
  );
};
