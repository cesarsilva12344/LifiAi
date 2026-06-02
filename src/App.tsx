import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopNavbar from './components/TopNavbar';
import TelegramEmulator from './components/TelegramEmulator';
import HomeDashboard from './components/HomeDashboard';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import ProjectView from './components/ProjectView';
import GoalsHabitsView from './components/GoalsHabitsView';
import MemoryView from './components/MemoryView';
import ProfileView from './components/ProfileView';
import ToastContainer, { showToast } from './components/Toast';
import { DatabaseState } from './types';
import { Sparkles, Terminal, ShieldAlert, Sun, Moon, LayoutGrid, DollarSign, Sliders, Settings } from 'lucide-react';

import DecisionJournalView from './components/DecisionJournalView';
import SimulatorView from './components/SimulatorView';
import MeditationPlayer from './components/MeditationPlayer';

import QuickCaptureBar from './components/QuickCaptureBar';
import { useLifeOSStore } from './lib/store';
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [database, setDatabase] = useState<DatabaseState | null>(null);;
  const [loading, setLoading] = useState(true);
  const { mode, setMode } = useLifeOSStore();

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
      case 'finances':
        return <FinanceView data={database} onRefresh={fetchState} theme={theme} />;
      case 'simulator':
        return <SimulatorView theme={theme} />;
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
    <div className={`min-h-screen flex flex-col h-screen overflow-hidden font-sans antialiased transition duration-200 ${
      theme === 'dark' ? 'bg-[#090a0d] text-gray-100' : 'bg-[#f4f6fa] text-slate-800'
    }`}>
      
      {/* 1. Premium Horizontal Top Navbar (Desktop only) */}
      <div className="hidden md:block">
        <TopNavbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          appName={database?.userProfile.appName || 'LifeOS AI'}
          theme={theme}
          toggleTheme={toggleTheme}
          data={database}
          telegramOpen={telegramOpen}
          setTelegramOpen={setTelegramOpen}
        />
      </div>

      {/* 2. Middle Central Content Section */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar transition duration-200 ${
        theme === 'dark' ? 'bg-[#090a0d]' : 'bg-[#f4f6fa]'
      }`}>
        {/* Universal Top Nav Indicator (Mobile only) */}
        <div className={`px-4 py-3 border-b flex md:hidden items-center justify-between shadow-sm flex-shrink-0 transition duration-200 ${
          theme === 'dark' ? 'bg-[#0d0e11] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center gap-1.5">
            <h1 className={`text-xs md:text-sm font-bold uppercase tracking-wide ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}>
              {database?.userProfile.appName || 'LifeOS'} Workspace
            </h1>
            <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-300'}>/</span>
            <span className={`text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>{activeTab}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition select-none ${
                theme === 'dark' 
                  ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:border-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-350'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">Light Premium</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 md:w-3.5 h-3 md:h-3.5" /> <span className="hidden sm:inline">Dark Premium</span>
                </>
              )}
            </button>

            <div className={`hidden md:flex items-center gap-4 text-[10px] font-mono ${
              theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Server: <strong className="text-emerald-600 font-mono">ONLINE</strong></span>
              <span>Estúdio: <strong className="text-blue-600 font-mono">SANDBOX-DRAFT</strong></span>
            </div>
          </div>
        </div>

        {/* Inner Content Pane Scroll */}
        <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto focus:outline-none overflow-x-hidden space-y-6">


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

      {/* Mobile Bottom Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 h-16 border-t md:hidden flex items-center justify-around z-50 px-2 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0d0e11] border-slate-800 text-gray-400' : 'bg-white border-slate-200 text-slate-650'
      }`}>
        {[
          { id: 'dashboard', label: 'Dash', icon: <LayoutGrid className="w-5 h-5" /> },
          { id: 'finances', label: 'Fluxo', icon: <DollarSign className="w-5 h-5" /> },
          { id: 'simulator', label: 'What-If', icon: <Sliders className="w-5 h-5" /> },
          { id: 'profile', label: 'Ajustes', icon: <Settings className="w-5 h-5" /> },
        ].map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer select-none transition-colors duration-150 ${
                isActive 
                  ? theme === 'dark' ? 'text-blue-400 font-bold' : 'text-blue-600 font-bold'
                  : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-50' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight font-semibold uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>



      {/* 4. Premium Telegram Chat Drawer (Slide-out Glassmorphic) */}
      <AnimatePresence>
        {telegramOpen && database && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTelegramOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 cursor-pointer"
            />
            {/* Drawer Body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl border-l flex flex-col transition-colors duration-200 ${
                theme === 'dark' 
                  ? 'bg-[#0d0e12]/95 backdrop-blur-lg border-slate-800/80 text-white' 
                  : 'bg-white/95 backdrop-blur-lg border-slate-200/80 text-slate-800'
              }`}
            >
              <TelegramEmulator onDataRefresh={fetchState} theme={theme} onClose={() => setTelegramOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Global Toast Notifications */}
      <ToastContainer />

      {/* 6. Global Web Speech / Zero-Fricção Quick Capture Bar */}
      <QuickCaptureBar onDataRefresh={fetchState} theme={theme} />

    </div>
  );
}
