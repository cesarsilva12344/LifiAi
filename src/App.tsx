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
import ToastContainer, { showToast } from './components/Toast';
import { DatabaseState } from './types';
import { Sparkles, Terminal, ShieldAlert, Sun, Moon } from 'lucide-react';

import DecisionJournalView from './components/DecisionJournalView';
import SimulatorView from './components/SimulatorView';
import MeditationPlayer from './components/MeditationPlayer';
import WarModeOverlay from './components/WarModeOverlay';
import QuickCaptureBar from './components/QuickCaptureBar';
import { useLifeOSStore } from './lib/store';

// Concentric circle breathing guide + Pomodoro countdown for Zen Mode
function ZenTimerAndBreather({ theme }: { theme: 'light' | 'dark' }) {
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [breathCycle, setBreathCycle] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
        setBreathCycle(c => (c + 1) % 14); // 4s inhale, 4s hold, 6s exhale (14s total)
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      showToast('Bloco de foco concluído! Excelente trabalho.', 'success');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Breathing guidance text & styling
  let breathingAction = 'Respire fundo';
  let breatheScale = 'scale-95 bg-sky-500/10 border-sky-500/25';
  if (isRunning) {
    if (breathCycle < 4) {
      breathingAction = 'Inspire lentamente...';
      breatheScale = 'scale-110 bg-sky-500/20 border-sky-400/40 shadow-[0_0_35px_rgba(14,165,233,0.15)] duration-[4000ms]';
    } else if (breathCycle < 8) {
      breathingAction = 'Segure...';
      breatheScale = 'scale-110 bg-amber-500/15 border-amber-400/30 shadow-[0_0_35px_rgba(245,158,11,0.1)] duration-1000';
    } else {
      breathingAction = 'Solte o ar...';
      breatheScale = 'scale-95 bg-sky-500/5 border-sky-500/10 duration-[6000ms]';
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center space-y-6">
      
      {/* Visual expanding circle */}
      <div className="relative flex items-center justify-center w-52 h-52">
        <div className={`w-40 h-40 rounded-full flex flex-col items-center justify-center border transition-all ease-in-out ${breatheScale}`}>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase leading-none">Breathing</span>
          <span className="text-[11px] font-bold text-sky-500 dark:text-purple-400 mt-2 font-sans text-center max-w-[110px] leading-tight">
            {breathingAction}
          </span>
        </div>
      </div>

      {/* Clock display */}
      <div className="space-y-1">
        <div className={`text-4xl font-mono font-black tracking-widest leading-none ${isDark ? 'text-white' : 'text-stone-850'}`}>
          {formatTime(timeLeft)}
        </div>
        <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">Tempo Restante (Pomodoro)</span>
      </div>

      {/* Play/Pause Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-6 py-2 rounded-xl text-xs font-bold cursor-pointer transition select-none shadow-md ${
            isRunning 
              ? 'bg-amber-600 hover:bg-amber-500 text-white' 
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {isRunning ? 'Pausar' : 'Focar'}
        </button>
        <button
          onClick={() => { setIsRunning(false); setTimeLeft(1500); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer select-none ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' 
              : 'bg-white border-stone-205 text-stone-600 hover:bg-stone-50'
          }`}
        >
          Reiniciar
        </button>
      </div>

    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [telegramOpen, setTelegramOpen] = useState(true);
  const [database, setDatabase] = useState<DatabaseState | null>(null);
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
      case 'decisions':
        return <DecisionJournalView data={database} onRefresh={fetchState} theme={theme} />;
      case 'meditation':
        return <MeditationPlayer onSessionLogged={fetchState} theme={theme} />;
      case 'simulator':
        return <SimulatorView theme={theme} />;
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

  if (mode === 'zen') {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-200 ${
        theme === 'dark' ? 'bg-[#060709] text-stone-100' : 'bg-stone-50 text-stone-800'
      }`}>
        <div className="absolute w-[450px] h-[450px] bg-sky-500/5 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Header */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-sky-500 dark:text-purple-400">
              Zen Mode Active
            </span>
          </div>
          <button
            onClick={() => setMode('default')}
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded-xl border transition cursor-pointer select-none ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                : 'bg-white border-stone-200 text-stone-650 hover:bg-stone-100 hover:border-stone-300'
            }`}
          >
            ← Sair do Zen
          </button>
        </div>

        {/* Main focus element */}
        <div className="w-full max-w-xl space-y-8 text-center flex flex-col items-center">
          <div className="space-y-1 w-full max-w-sm">
            <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">Foco Principal</span>
            {database && database.tasks.filter(t => t.status === 'pending').length > 0 ? (
              <div className={`p-4 rounded-2xl border text-xs font-bold transition shadow-sm ${
                theme === 'dark' ? 'bg-stone-900/60 border-stone-800 text-stone-200' : 'bg-white border-stone-200 text-stone-750'
              }`}>
                🎯 {database.tasks.filter(t => t.status === 'pending')[0].titulo}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Qual é a sua única prioridade para este bloco?"
                className={`w-full text-center text-xs rounded-xl px-4 py-3 border focus:outline-none transition ${
                  theme === 'dark' 
                    ? 'bg-stone-950/60 border-stone-800 text-white placeholder-stone-600 focus:border-purple-500' 
                    : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400 focus:border-indigo-500'
                }`}
              />
            )}
          </div>

          <ZenTimerAndBreather theme={theme} />
        </div>

        {/* Floating Quick Capture Bar at the bottom */}
        <QuickCaptureBar onDataRefresh={fetchState} theme={theme} />
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
        <div className="p-6 max-w-7xl w-full mx-auto focus:outline-none overflow-x-hidden space-y-6">
          {mode === 'war' && database && (
            <WarModeOverlay data={database} onRefresh={fetchState} theme={theme} />
          )}

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

      {/* 5. Global Web Speech / Zero-Fricção Quick Capture Bar */}
      <QuickCaptureBar onDataRefresh={fetchState} theme={theme} />

    </div>
  );
}
