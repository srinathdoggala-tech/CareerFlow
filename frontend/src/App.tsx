import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { KanbanBoard } from './pages/KanbanBoard';
import { ApplicationsList } from './pages/ApplicationsList';
import { CalendarView } from './pages/CalendarView';
import { AICopilot } from './pages/AICopilot';
import { Settings } from './pages/Settings';
import { ApplicationModal } from './components/ApplicationModal';
import { api } from './lib/api';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Navigation & State
  const [currentView, setView] = useState('dashboard');
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  
  // Search & Filter State
  const [filters, setFilters] = useState<any>({
    status: '',
    priority: '',
    workMode: '',
    jobType: '',
    search: ''
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [modalInitialStatus, setModalInitialStatus] = useState<string | null>(null);

  // Load applications
  const fetchApps = async () => {
    if (!user) return;
    setAppsLoading(true);
    try {
      const data = await api.applications.list(filters);
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [user, filters.status, filters.priority, filters.workMode, filters.jobType, filters.search]);

  // Edit/Add triggers
  const handleEditApplication = (id: string) => {
    setSelectedAppId(id);
    setModalInitialStatus(null);
    setIsModalOpen(true);
  };

  const handleAddApplication = (status: string | null = null) => {
    setSelectedAppId(null);
    setModalInitialStatus(status);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-slate-400 flex flex-col items-center justify-center select-none">
        <div className="h-8 w-8 border-4 border-t-blue-500 border-slate-800 rounded-full animate-spin mb-4"></div>
        <span>Establishing authentication context...</span>
      </div>
    );
  }

  // Redirect to Auth if not logged in
  if (!user) {
    return <Auth />;
  }

  // Translate view IDs to human titles
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Smart Dashboard';
      case 'board': return 'Notion Kanban Board';
      case 'list': return 'Structured Opportunities';
      case 'calendar': return 'Interactive Calendar';
      case 'ai-copilot': return 'AI Career Copilot';
      case 'settings': return 'System Settings';
      default: return 'CareerFlow';
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setView={setView} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <Header
          title={getHeaderTitle()}
          onQuickAdd={() => handleAddApplication()}
          searchValue={filters.search}
          onSearchChange={(val) => setFilters({ ...filters, search: val })}
        />

        {/* View Layout Switcher */}
        <main className="flex-1 flex flex-col min-h-0">
          {currentView === 'dashboard' && <Dashboard />}
          
          {currentView === 'board' && (
            <KanbanBoard
              applications={applications}
              onEditApplication={handleEditApplication}
              onAddApplicationInStatus={(status) => handleAddApplication(status)}
              refreshApplications={fetchApps}
            />
          )}

          {currentView === 'list' && (
            <ApplicationsList
              applications={applications}
              onEditApplication={handleEditApplication}
              refreshApplications={fetchApps}
              filters={filters}
              setFilters={setFilters}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView 
              onEditApplication={handleEditApplication} 
            />
          )}

          {currentView === 'ai-copilot' && <AICopilot />}

          {currentView === 'settings' && <Settings />}
        </main>

        {/* Floating Modal for Add/Edit Application */}
        <ApplicationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={fetchApps}
          applicationId={selectedAppId}
          initialStatus={modalInitialStatus}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
