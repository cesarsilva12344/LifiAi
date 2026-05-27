import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Sparkles, Terminal, ShieldAlert, Sun, Moon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [telegramOpen, setTelegramOpen] = useState(true);
  const [database, setDatabase] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Theme state (Dark vs Light Premium)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('lifeos_theme') as 'dark' | 'light') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('lifeos_theme', nextTheme);
  };

  // Synchronize document dark class with active theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
        return <HomeDashboard data={database} onRefresh={fetchState} theme={theme} />;
      case 'timeline':
        return <TimelineView data={database} onRefresh={fetchState} theme={theme} />;
      case 'calendar':
        return <CalendarView data={database} onRefresh={fetchState} theme={theme} />;
      case 'finances':
        return <FinanceView data={database} onRefresh={fetchState} theme={theme} />;
      case 'projects':
        return <ProjectView data={database} onRefresh={fetchState} theme={theme} />;
      case 'goals':
        return <GoalsHabitsView data={database} onRefresh={fetchState} theme={theme} />;
      case 'memory':
        return <MemoryView data={database} onRefresh={fetchState} theme={theme} />;
      case 'profile':
        return <ProfileView data={database} onRefresh={fetchState} theme={theme} />;
      default:
        return <HomeDashboard data={database} onRefresh={fetchState} theme={theme} />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 transition duration-200 ${
        theme === 'dark' ? 'bg-[#090a0d] text-slate-400' : 'bg-[#f4f6fa] text-slate-500'
      }`}>
        <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
          theme === 'dark' ? 'border-t-blue-500 border-slate-800' : 'border-t-blue-600 border-slate-300'
        }`}></div>
        <p className="text-xs font-mono tracking-widest uppercase">Inicializando LifeOS AI v1.0...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex h-screen overflow-hidden font-sans antialiased transition duration-200 ${
      theme === 'dark' ? 'bg-[#090a0d] text-gray-100' : 'bg-[#f4f6fa] text-slate-800'
    }`}>
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        telegramOpen={telegramOpen} 
        setTelegramOpen={setTelegramOpen} 
        appName={database?.userProfile.appName || 'LifeOS AI'}
        theme={theme}
      />

      {/* 2. Middle Central Content Section */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar transition duration-200 ${
        theme === 'dark' ? 'bg-[#090a0d]' : 'bg-[#f4f6fa]'
      }`}>
        {/* Universal Top Nav Indicator */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shadow-sm flex-shrink-0 transition duration-200 ${
          theme === 'dark' ? 'bg-[#0d0e11] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-1.5">
            <h1 className={`text-sm font-bold uppercase tracking-wide ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {database?.userProfile.appName || 'LifeOS'} Workspace
            </h1>
            <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}>/</span>
            <span className={`text-xs font-mono font-bold uppercase tracking-widest ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>{activeTab}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition select-none ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:border-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-350'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5" /> Light Premium
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Dark Premium
                </>
              )}
            </button>

            <div className={`flex items-center gap-4 text-[10px] font-mono ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Server: <strong className="text-emerald-600 font-mono">ONLINE</strong></span>
              <span>Estúdio: <strong className="text-blue-600 font-mono">SANDBOX-DRAFT</strong></span>
            </div>
          </div>
        </div>

        {/* Inner Content Pane Scroll */}
        <div className="p-6 max-w-7xl w-full mx-auto focus:outline-none overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Right Telegram Capture Sandbox Emulator */}
      {telegramOpen && (
        <div className="w-[360px] h-full flex-shrink-0 flex flex-col">
          <TelegramEmulator onDataRefresh={fetchState} theme={theme} />
        </div>
      )}

      {/* 4. Global Toast Notifications */}
      <ToastContainer />

    </div>
  );
}
