import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, DollarSign, Settings, AlertTriangle, Award, Sliders, Zap
} from 'lucide-react';
import { useLifeOSStore } from '../lib/store';
import { DatabaseState } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telegramOpen: boolean;
  setTelegramOpen: (open: boolean) => void;
  appName: string;
  theme?: 'light' | 'dark';
  data?: DatabaseState | null;
}

export default function Sidebar({ activeTab, setActiveTab, telegramOpen, setTelegramOpen, appName, theme = 'light', data }: SidebarProps) {
  const { mode, toggleMode } = useLifeOSStore();

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
  if (totalIncome > 0) {
    if (savingsRate > 40) {
      financialScore = Math.min(100, 80 + (savingsRate - 40) * 0.3);
      statusText = 'Superávit / Alta Performance';
    } else if (savingsRate > 20) {
      financialScore = 70 + (savingsRate - 20) * 0.5;
      statusText = 'Saúde Estável';
    } else if (savingsRate > 0) {
      financialScore = 50 + savingsRate;
      statusText = 'Poupança Mínima';
    } else {
      financialScore = Math.max(0, 50 + savingsRate);
      statusText = 'Deficit / Atenção Urgente';
    }
  }

  return (
    <div className={`w-64 md:flex hidden flex-col justify-between h-full transition duration-300 ${
      isDark 
        ? 'bg-[#0d0e11] border-r border-slate-800 text-gray-400' 
        : 'bg-white border-r border-slate-200 text-slate-600'
    }`}>
      <div className="overflow-y-auto custom-scrollbar flex-1">
        {/* Branding Logo */}
        <div className={`p-6 border-b flex items-center justify-between transition ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2 group cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.4 }}
              className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-mono text-xs font-bold text-white shadow-md"
            >
              C
            </motion.div>
            <span className={`font-mono text-sm font-bold tracking-widest uppercase transition ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>{appName} CFO</span>
          </div>
          <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-wide transition ${
            isDark 
              ? 'text-blue-400 bg-blue-950/40 border border-blue-800/25' 
              : 'text-blue-650 bg-blue-50 border border-blue-200'
          }`}>
            PRO
          </span>
        </div>

        {/* Premium CFO Health Score Widget */}
        <div className={`mx-4 mt-5 p-4 rounded-2xl border transition ${
          isDark 
            ? 'bg-[#090a0d] border-slate-800/80 shadow-md' 
            : 'bg-slate-50 border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>CFO Health Score</span>
            <span className={`font-bold tracking-wide flex items-center gap-0.5 ${savingsRate >= 20 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {savingsRate >= 0 ? `▲ ${savingsRate.toFixed(1)}%` : `▼ ${Math.abs(savingsRate).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className={`text-lg font-black font-mono leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {financialScore.toFixed(1)}
              </h3>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-1 font-semibold leading-none">
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Operational Modes Control */}
        <div className="px-4 mt-5 space-y-2">
          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-450 uppercase block pl-1">CFO Energia</span>
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
              Filtro: {mode === 'war' ? 'Modo Crise' : 'Modo Padrão'}
            </span>
            <span className="text-[8px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Alternar</span>
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1">
          <span className={`text-[9px] font-bold tracking-widest uppercase block px-3 mb-2.5 transition ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Menu CFO
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

      {/* Footer controls */}
      <div className={`p-4 border-t space-y-2 transition ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div className={`text-[10px] font-mono text-center flex items-center justify-center gap-1.5 transition ${
          isDark ? 'text-slate-655' : 'text-slate-400'
        }`}>
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span>Contabilidade Consolidada</span>
        </div>
      </div>
    </div>
  );
}
