import { useState, useEffect, useCallback } from 'react';
import { Sidebar, ToastStack } from './components/Shell';
import { NewJobModal } from './components/NewJobModal';
import { DashboardPage } from './pages/DashboardPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { OutreachPage } from './pages/OutreachPage';
import { ShortlistPage } from './pages/ShortlistPage';
import { SettingsPage } from './pages/SettingsPage';
import { createJob } from './lib/api';

type View = 'dashboard' | 'shortlist' | 'outreach' | 'settings' | 'jobdetail';
type Theme = 'light' | 'dark';
interface Toast { id: number; message: string; }

export default function App() {
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'light'
  );
  const [view, setView] = useState<View>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastId = 0;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const onToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const onNav = useCallback((v: View) => {
    setView(v);
    if (v !== 'jobdetail') setSelectedJobId(null);
  }, []);

  const onOpenJob = useCallback((id: string) => {
    setSelectedJobId(id);
    setView('jobdetail');
  }, []);

  const handleNewJob = async ({ company, jd }: { company: string; jd: string }) => {
    try {
      setShowNewJob(false);
      const job = await createJob(company, jd);
      onToast(`Job created · scouting ${company}`);
      onOpenJob(job.id);
    } catch {
      onToast('Failed to create job — is the API running?');
    }
  };

  const sharedProps = { theme, setTheme, onNav, onToast };

  return (
    <div className="app">
      <Sidebar active={view} onNav={onNav} />
      <main className="main">
        {view === 'dashboard' && (
          <DashboardPage {...sharedProps} onOpenJob={onOpenJob} onNewJob={() => setShowNewJob(true)} />
        )}
        {view === 'jobdetail' && selectedJobId && (
          <JobDetailPage {...sharedProps} jobId={selectedJobId} onBack={() => setView('dashboard')} />
        )}
        {view === 'shortlist' && <ShortlistPage {...sharedProps} />}
        {view === 'outreach' && <OutreachPage {...sharedProps} />}
        {view === 'settings' && <SettingsPage {...sharedProps} />}
      </main>

      {showNewJob && <NewJobModal onClose={() => setShowNewJob(false)} onSubmit={handleNewJob} />}
      <ToastStack toasts={toasts} />
    </div>
  );
}
