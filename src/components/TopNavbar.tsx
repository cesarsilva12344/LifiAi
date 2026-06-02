import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, DollarSign, Settings, Sliders, Sun, Moon, Zap, Award, AlertTriangle, ShieldAlert, Send
} from 'lucide-react';
import { useLifeOSStore } from '../lib/store';
import { DatabaseState } from '../types';

interface TopNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  appName: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  data: DatabaseState | null;
  telegramOpen: boolean;
  setTelegramOpen: (open: boolean) => void;
}

export default function TopNavbar({ 
  activeTab, 
  setActiveTab, 
  appName, 
  theme, 
  toggleTheme, 
  data,
  telegramOpen,
  setTelegramOpen
}: TopNavbarProps) {
  const { mode, toggleMode } = useLifeOSStore();
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard CFO', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'finances', label: 'Lançamentos & Fluxo', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulador What-If', icon: <Sliders className="w-4 h-4" /> },
    { id: 'profile', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  const isDark = theme === 'dark' || mode === 'war' || mode === 'zen';

  // Calculate Savings Rate / CFO Health Score
  const totalIncome = data?.income?.reduce((sum, item) => sum + item.valor, 0) || 0;
  const totalExpenses = data?.expenses?.reduce((sum, item) => sum + item.valor, 0) || 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  
  // Dynamic Score formula
  let financialScore = 50;
  let statusText = 'Equilíbrio Frágil';
  let statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  let scoreGlow = 'rgba(245, 158, 11, 0.15)';

  if (totalIncome > 0) {
    if (savingsRate > 40) {
      financialScore = Math.min(100, 80 + (savingsRate - 40) * 0.3);
      statusText = 'Superávit / Alta Performance';
      statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      scoreGlow = 'rgba(16, 185, 129, 0.2)';
    } else if (savingsRate > 20) {
      financialScore = 70 + (savingsRate - 20) * 0.5;
      statusText = 'Saúde Estável';
      statusColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      scoreGlow = 'rgba(59, 130, 246, 0.2)';
    } else if (savingsRate > 0) {
      financialScore = 50 + savingsRate;
      statusText = 'Poupança Mínima';
      statusColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      scoreGlow = 'rgba(234, 179, 8, 0.15)';
    } else {
      financialScore = Math.max(0, 50 + savingsRate);
      statusText = 'Deficit / Atenção Urgente';
      statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      scoreGlow = 'rgba(244, 63, 94, 0.25)';
    }
  }

  return (
    <div className={`w-full h-16 border-b flex items-center justify-between px-6 z-50 flex-shrink-0 transition-all duration-300 ${
      isDark 
        ? 'bg-[#0d0e11]/90 backdrop-blur-md border-slate-800 text-gray-250' 
        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-700'
    }`}>
      
      {/* 1. Brand Logo Area (Left) */}
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ scale: 1.08, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
          onClick={() => setActiveTab('dashboard')}
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-mono text-sm font-bold text-white shadow-md cursor-pointer select-none"
        >
          M
        </motion.div>
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xs font-black tracking-widest uppercase transition-colors ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>
              {appName}
            </span>
            <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wide transition-colors ${
              isDark 
                ? 'text-blue-400 bg-blue-950/40 border border-blue-800/25' 
                : 'text-blue-650 bg-blue-50 border border-blue-200'
            }`}>
              PRO
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest leading-none mt-0.5">CFO Executive</span>
        </div>
      </div>

      {/* 2. Horizontal Navigation Menu Items (Center - Hidden on Mobile) */}
      <div className="hidden md:flex items-center gap-1.5 bg-[#090a0d]/5 dark:bg-black/25 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg font-bold relative cursor-pointer select-none transition-colors duration-200 ${
                isActive
                  ? isDark
                    ? 'text-blue-400 font-bold'
                    : 'text-blue-600 font-bold'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {/* Sliding pill indicator */}
              {isActive && (
                <motion.span
                  layoutId="topActiveTabPill"
                  className={`absolute inset-0 rounded-lg -z-10 border ${
                    isDark
                      ? 'bg-blue-600/10 border-blue-500/20 shadow-[0_0_12px_-2px_rgba(59,130,246,0.15)]'
                      : 'bg-blue-50 border-blue-100 shadow-sm'
                  }`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110 text-blue-500' : ''}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Controls & Widgets Area (Right) */}
      <div className="flex items-center gap-3">
        
        {/* CFO Health Score Pill Badge (Interactive Tooltip on Hover) */}
        <div 
          className="relative"
          onMouseEnter={() => setShowScoreDetails(true)}
          onMouseLeave={() => setShowScoreDetails(false)}
          onClick={() => setShowScoreDetails(!showScoreDetails)}
        >
          <div 
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-sm cursor-pointer select-none transition duration-200 ${statusColor}`}
            style={{ boxShadow: `0 4px 12px -3px ${scoreGlow}` }}
          >
            <Award className="w-4 h-4 animate-pulse shrink-0 text-current" />
            <span>Score: {financialScore.toFixed(1)}</span>
          </div>

          {/* Tooltip Overlay */}
          <AnimatePresence>
            {showScoreDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute right-0 top-11 w-64 p-4 rounded-xl border shadow-xl z-50 text-xs font-sans space-y-2.5 transition-colors leading-relaxed ${
                  isDark ? 'bg-zinc-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex justify-between items-center border-b pb-1.5 dark:border-slate-800">
                  <span className="font-bold text-[10px] font-mono text-slate-400 uppercase tracking-widest">CFO Health Metrics</span>
                  <span className={`font-bold font-mono text-[10px] ${savingsRate >= 20 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {savingsRate >= 0 ? `▲ ${savingsRate.toFixed(1)}%` : `▼ ${Math.abs(savingsRate).toFixed(1)}%`}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Status Financeiro</p>
                  <p className="font-black text-sm uppercase tracking-wide text-blue-500 dark:text-blue-400 mt-0.5">{statusText}</p>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-1">
                  <span>Receitas: R$ {totalIncome.toLocaleString('pt-BR')}</span>
                  <span>Despesas: R$ {totalExpenses.toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-[9px] leading-relaxed text-slate-450 border-t pt-1.5 dark:border-slate-800">
                  Sua pontuação financeira (CFO Score) baseia-se na sua taxa de poupança atual.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CFO Energia Toggle Switcher Button */}
        <button 
          onClick={toggleMode}
          className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition select-none ${
            mode === 'zen' 
              ? 'bg-stone-800/80 border-stone-750 text-stone-250 hover:border-stone-500' 
              : mode === 'war'
                ? 'bg-red-950/40 border-red-900/40 text-red-400 hover:border-red-650'
                : isDark 
                  ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:border-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100 hover:border-slate-350'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${mode === 'war' ? 'text-red-500 animate-pulse' : mode === 'zen' ? 'text-stone-400' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">
            {mode === 'war' ? 'Crise' : mode === 'zen' ? 'Zen' : 'Padrão'}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer transition select-none ${
            isDark 
              ? 'bg-slate-800/85 border-slate-700 text-amber-400 hover:border-slate-500' 
              : 'bg-slate-50 border-slate-200 text-slate-655 hover:bg-slate-100 hover:border-slate-350'
          }`}
          title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Telegram Chat Drawer Toggle Button */}
        <button 
          onClick={() => setTelegramOpen(!telegramOpen)}
          className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer transition select-none ${
            telegramOpen 
              ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20' 
              : isDark 
                ? 'bg-slate-800/85 border-slate-700 text-blue-400 hover:border-slate-500 hover:text-blue-300' 
                : 'bg-slate-50 border-slate-200 text-blue-600 hover:bg-slate-100 hover:border-slate-350'
          }`}
          title="Abrir Emulador do Telegram"
        >
          <Send className="w-3.5 h-3.5 -rotate-45 relative right-[1px]" />
          <span className="hidden lg:inline ml-1.5 text-[10px]">Telegram</span>
        </button>

        {/* Server Online Indicator (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 pl-1.5 border-l border-slate-850">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">LIVE</span>
        </div>

      </div>

    </div>
  );
}
