import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TelegramEmulator from './components/TelegramEmulator';
import HomeDashboard from './components/HomeDashboard';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import ProjectView from './components/ProjectView';
import GoalsHabitsView from './components/GoalsHabitsView';
import MemoryView from './components/MemoryView';
import ProfileView from './components/ProfileView';
import ToastContainer from './components/Toast';
import { DatabaseState } from './types';
import { Sparkles, Terminal, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [telegramOpen, setTelegramOpen] = useState(true);
  const [database, setDatabase] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch full database state from Express Server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        setDatabase(data);
      }
    } catch (err) {
      console.error('Falha ao tentar resgatar banco de dados no frontend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const renderActiveTab = () => {
    if (!database) return null;
    switch (activeTab) {
      case 'dashboard':
        return <HomeDashboard data={database} onRefresh={fetchState} />;
      case 'timeline':
        return <TimelineView data={database} onRefresh={fetchState} />;
      case 'calendar':
        return <CalendarView data={database} onRefresh={fetchState} />;
      case 'finances':
        return <FinanceView data={database} onRefresh={fetchState} />;
      case 'projects':
        return <ProjectView data={database} onRefresh={fetchState} />;
      case 'goals':
        return <GoalsHabitsView data={database} onRefresh={fetchState} />;
      case 'memory':
        return <MemoryView data={database} onRefresh={fetchState} />;
      case 'profile':
        return <ProfileView data={database} onRefresh={fetchState} />;
      default:
        return <HomeDashboard data={database} onRefresh={fetchState} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0d] flex flex-col items-center justify-center gap-4 text-gray-400">
        <div className="w-8 h-8 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
        <p className="text-xs font-mono tracking-widest uppercase">Inicializando LifeOS AI v1.0...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0d] text-gray-100 flex h-screen overflow-hidden font-sans antialiased">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        telegramOpen={telegramOpen} 
        setTelegramOpen={setTelegramOpen} 
        appName={database?.userProfile.appName || 'LifeOS AI'}
      />

      {/* 2. Middle Central Content Section */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#090a0d] overflow-y-auto custom-scrollbar">
        {/* Universal Top Nav Indicator */}
        <div className="px-6 py-4 bg-[#0d0e11] border-b border-[#1a1c23] flex items-center justify-between shadow flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-white tracking-wide uppercase">
              {database?.userProfile.appName || 'LifeOS'} Workspace
            </h1>
            <span className="text-gray-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">{activeTab}</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
            <span>Server: <strong className="text-emerald-400 font-mono">ONLINE</strong></span>
            <span>Estúdio: <strong className="text-blue-400 font-mono">SANDBOX-DRAFT</strong></span>
          </div>
        </div>

        {/* Inner Content Pane Scroll */}
        <div className="p-6 max-w-7xl w-full mx-auto focus:outline-none">
          {renderActiveTab()}
        </div>
      </div>

      {/* 3. Right Telegram Capture Sandbox Emulator */}
      {telegramOpen && (
        <div className="w-[360px] h-full flex-shrink-0 flex flex-col">
          <TelegramEmulator onDataRefresh={fetchState} />
        </div>
      )}

      {/* 4. Global Toast Notifications */}
      <ToastContainer />

    </div>
  );
}
