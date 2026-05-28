import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, Clock, DollarSign, Layers, Flame, BrainCircuit, User, 
  HelpCircle, AlertTriangle, Calendar, Award, Wind, Sliders, Zap, Heart
} from 'lucide-react';
import { useLifeOSStore } from '../lib/store';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telegramOpen: boolean;
  setTelegramOpen: (open: boolean) => void;
  appName: string;
  theme?: 'light' | 'dark';
}

export default function Sidebar({ activeTab, setActiveTab, telegramOpen, setTelegramOpen, appName, theme = 'light' }: SidebarProps) {
  const [botStatus, setBotStatus] = React.useState<any>(null);
  const { mode, toggleMode, activePersona } = useLifeOSStore();

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/telegram/status');
        if (res.ok) setBotStatus(await res.json());
      } catch (_) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'calendar', label: 'Google Agenda', icon: <Calendar className="w-4 h-4" /> },
    { id: 'finances', label: 'Finanças', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'projects', label: 'Projetos', icon: <Layers className="w-4 h-4" /> },
    { id: 'goals', label: 'Hábitos & Metas', icon: <Flame className="w-4 h-4" /> },
    { id: 'decisions', label: 'Decisões', icon: <Wind className="w-4 h-4" /> },
    { id: 'meditation', label: 'Mindfulness', icon: <Heart className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulador', icon: <Sliders className="w-4 h-4" /> },
    { id: 'memory', label: 'Memória Inteligente', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'profile', label: 'Personas & Perfil', icon: <User className="w-4 h-4" /> },
  ];

  const isDark = theme === 'dark' || mode === 'war' || mode === 'zen';

  return (
    <div className={`w-64 flex flex-col justify-between h-full transition duration-300 ${
      isDark 
        ? 'bg-[#0d0e11] border-r border-slate-800 text-gray-400' 
        : 'bg-white border-r border-slate-200 text-slate-600'
    }`}>
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {/* Branding Logo */}
        <div className={`p-6 border-b flex items-center justify-between transition ${
          isDark ? 'border-slate-850' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
              className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-mono text-xs font-bold text-white shadow-md"
            >
              L
            </motion.div>
            <span className={`font-mono text-sm font-bold tracking-widest uppercase transition ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>{appName}</span>
          </div>
          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wide transition ${
            isDark 
              ? 'text-blue-400 bg-blue-950/40 border border-blue-800/25' 
              : 'text-blue-650 bg-blue-50 border border-blue-200'
          }`}>
            v1.1
          </span>
        </div>

        {/* Premium Life Score Widget */}
        <div className={`mx-4 mt-5 p-4 rounded-2xl border transition ${
          isDark 
            ? 'bg-[#090a0d] border-slate-800/80 shadow-md' 
            : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Life Score Unificado</span>
            <span className="text-emerald-500 font-bold tracking-wide flex items-center gap-0.5">
              ▲ 2.4%
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className={`text-lg font-black font-mono leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>
                82.5
              </h3>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-1 font-semibold leading-none">Status: High Performance</span>
            </div>
          </div>
        </div>

        {/* Operational Modes Control */}
        <div className="px-4 mt-5 space-y-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-450 uppercase block pl-1">Modos de Energia</span>
          <button 
            onClick={toggleMode}
            className={`w-full py-2 px-3 text-[11px] font-mono font-bold uppercase rounded-xl border flex items-center justify-between cursor-pointer transition shadow-sm ${
              mode === 'zen' 
                ? 'bg-stone-800 border-stone-700 text-stone-200 shadow-stone-900/50' 
                : mode === 'war'
                  ? 'bg-red-950/20 border-red-900/30 text-red-400 shadow-red-900/10'
                  : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:border-slate-350'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${mode === 'war' ? 'text-red-500 animate-pulse' : mode === 'zen' ? 'text-stone-400' : 'text-amber-500'}`} />
              Modo: {mode}
            </span>
            <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alternar</span>
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1">
          <span className={`text-[9px] font-bold tracking-widest uppercase block px-3 mb-2.5 transition ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Menu Operacional
          </span>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs rounded-lg font-medium relative cursor-pointer select-none transition-colors duration-200 ${
                  isActive
                    ? isDark
                      ? 'text-blue-400 font-bold'
                      : 'text-blue-600 font-bold'
                    : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {/* Sliding active pill indicator behind label */}
                {isActive && (
                  <motion.span
                    layoutId="activeTabPill"
                    className={`absolute inset-0 rounded-lg -z-10 border ${
                      isDark
                        ? 'bg-blue-600/10 border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]'
                        : 'bg-blue-50/80 border-blue-100 shadow-sm'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-blue-500' : 'group-hover:scale-105'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bot status indicator */}
      <div className={`px-4 py-2.5 mx-4 mb-4 rounded-lg flex items-center justify-between text-[10px] font-mono transition border ${
        isDark
          ? 'bg-slate-900/40 border-slate-800 text-slate-500'
          : 'bg-slate-50 border-slate-200 text-slate-400'
      }`}>
        <span>Telegram Bot:</span>
        <div className="flex items-center gap-1.5">
          <motion.div 
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`w-2 h-2 rounded-full ${
              botStatus?.configured 
                ? 'bg-emerald-500' 
                : botStatus?.hasToken 
                  ? 'bg-amber-500' 
                  : 'bg-slate-400'
            }`}
          />
          <span className={`font-bold transition ${
            isDark ? 'text-slate-350' : 'text-slate-700'
          }`}>
            {botStatus?.configured 
              ? 'ATIVO' 
              : botStatus?.hasToken 
                ? 'SEM CHAT ID' 
                : 'DESATIVADO'}
          </span>
        </div>
      </div>

      {/* Footer controls */}
      <div className={`p-4 border-t space-y-2 transition ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        {/* Telegram operator drawer toggle */}
        <button
          onClick={() => setTelegramOpen(!telegramOpen)}
          className={`w-full text-xs font-mono py-2 rounded-lg border flex items-center justify-center gap-2 font-bold cursor-pointer transition select-none ${
            isDark
              ? telegramOpen
                ? 'bg-blue-950/20 text-blue-450 border-blue-900/30 hover:border-blue-500'
                : 'bg-slate-800/40 text-slate-300 border-slate-750 hover:text-white hover:border-slate-500'
              : telegramOpen 
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:text-slate-900 hover:border-slate-350'
          }`}
        >
          <span>💬 Operator: {telegramOpen ? 'Visible' : 'Hidden'}</span>
        </button>

        <div className={`text-[10px] font-mono text-center flex items-center justify-center gap-1.5 transition ${
          isDark ? 'text-slate-650' : 'text-slate-400'
        }`}>
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span>Desktop Optimized</span>
        </div>
      </div>
    </div>
  );
}
