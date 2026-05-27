import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, CheckSquare, 
  Flame, Sparkles, RefreshCw, Layers, ArrowUpRight, Compass,
  Plus, X, Heart, EyeOff, Play, Square, Landmark, CreditCard, ChevronRight, CheckCircle2, AlertCircle, MoreVertical
} from 'lucide-react';
import { DatabaseState } from '../types';
import { showToast } from './Toast';

interface HomeDashboardProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function HomeDashboard({ data, onRefresh, theme = 'light' }: HomeDashboardProps) {
  const [activeModal, setActiveModal] = useState<'expense' | 'task' | 'reminder' | 'habit' | 'goal' | 'project' | null>(null);

  // Zen Mode States
  const [zenMode, setZenMode] = useState(false);
  const [zenFocus, setZenFocus] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds

  // States for forms
  const [expenseForm, setExpenseForm] = useState({ valor: '', categoria: 'Alimentação', descricao: '', data: new Date().toISOString().split('T')[0] });
  const [taskForm, setTaskForm] = useState({ titulo: '', prioridade: 'medium', prazo: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
  const [reminderForm, setReminderForm] = useState({ titulo: '', data_hora: new Date(Date.now() + 3600000).toISOString().slice(0, 16) });
  const [habitForm, setHabitForm] = useState({ nome: '', frequencia: 'diaria' });
  const [goalForm, setGoalForm] = useState({ titulo: '', meta: '', prazo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
  const [projectForm, setProjectForm] = useState({ nome: '', descricao: '', status: 'planning' });

  // Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      showToast('Tempo esgotado! Excelente foco.', 'success');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartZen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zenFocus.trim()) return;
    setIsTimerRunning(true);
  };

  const handleStopZen = () => {
    setIsTimerRunning(false);
    setZenFocus('');
    setTimeLeft(3600);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    let body = {};
    
    if (activeModal === 'expense') {
      url = '/api/db/expenses/manual';
      body = { ...expenseForm, valor: parseFloat(expenseForm.valor) };
      if (!expenseForm.valor || isNaN(parseFloat(expenseForm.valor))) {
        showToast('Por favor, informe um valor válido.', 'error');
        return;
      }
    } else if (activeModal === 'task') {
      url = '/api/db/tasks';
      body = taskForm;
      if (!taskForm.titulo.trim()) {
        showToast('O título é obrigatório.', 'error');
        return;
      }
    } else if (activeModal === 'reminder') {
      url = '/api/db/reminders';
      body = reminderForm;
      if (!reminderForm.titulo.trim()) {
        showToast('O título é obrigatório.', 'error');
        return;
      }
    } else if (activeModal === 'habit') {
      url = '/api/db/habits';
      body = habitForm;
      if (!habitForm.nome.trim()) {
        showToast('O nome é obrigatório.', 'error');
        return;
      }
    } else if (activeModal === 'goal') {
      url = '/api/db/goals';
      body = { ...goalForm, meta: parseFloat(goalForm.meta), progresso: 0 };
      if (!goalForm.titulo.trim() || isNaN(parseFloat(goalForm.meta))) {
        showToast('Preencha os campos corretamente.', 'error');
        return;
      }
    } else if (activeModal === 'project') {
      url = '/api/db/projects';
      body = { ...projectForm, progresso: 0, cliente: 'Iniciativas Gerais' };
      if (!projectForm.nome.trim()) {
        showToast('O nome do projeto é obrigatório.', 'error');
        return;
      }
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast('Lançamento inserido com sucesso!', 'success');
        setActiveModal(null);
        
        // Reset forms
        setExpenseForm({ valor: '', categoria: 'Alimentação', descricao: '', data: new Date().toISOString().split('T')[0] });
        setTaskForm({ titulo: '', prioridade: 'medium', prazo: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
        setReminderForm({ titulo: '', data_hora: new Date(Date.now() + 3600000).toISOString().slice(0, 16) });
        setHabitForm({ nome: '', frequencia: 'diaria' });
        setGoalForm({ titulo: '', meta: '', prazo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
        setProjectForm({ nome: '', descricao: '', status: 'planning' });

        onRefresh();
      } else {
        showToast('Erro ao gravar dados no servidor.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na conexão com o backend.', 'error');
    }
  };

  // Financial stats calculation
  const totalIncome = data.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.valor, 0);
  const netBalance = totalIncome - totalExpenses;

  // Credit card dynamic calculation (defaulting to 35% of expenses if no specific credit card categories)
  const creditCardExpenses = data.expenses
    .filter(e => e.categoria.toLowerCase().includes('cartão') || e.categoria.toLowerCase().includes('crédito') || e.descricao.toLowerCase().includes('nubank') || e.descricao.toLowerCase().includes('picpay'))
    .reduce((sum, item) => sum + item.valor, 0);
  const creditCardBill = creditCardExpenses || (totalExpenses * 0.35);

  // Grouped and sorted combined transaction list
  const fullLedger = [
    ...data.income.map(i => ({ ...i, type: 'income' as const })),
    ...data.expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.data.localeCompare(a.data));

  // Determine current active month/year based on local time
  const currentMonthYear = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);

  // Color variables for dark vs light premium compatibility
  const darkColors = {
    cardBg: 'glass-card-dark text-slate-100 shadow-md',
    titleText: 'text-white',
    subText: 'text-slate-400',
    divider: 'border-slate-800',
    inputBg: 'bg-[#0b0e14] border-[#1f2637] text-white',
    ledgerHeader: 'glass-card-dark text-white',
    rowBg: 'bg-[#0c0f16]/60 border-[#1c2333]/80 hover:border-[#2f3a54] transition-colors',
    subtotalBg: 'bg-blue-950/20 text-[#5288c1] border-blue-900/30',
    textColorPrimary: 'text-slate-200',
    textColorSecondary: 'text-slate-400'
  };

  const lightColors = {
    cardBg: 'glass-card-light text-slate-800 shadow-sm',
    titleText: 'text-slate-800',
    subText: 'text-slate-500',
    divider: 'border-slate-100',
    inputBg: 'bg-slate-50/85 border-slate-200/80 text-slate-850',
    ledgerHeader: 'glass-card-light text-slate-900',
    rowBg: 'bg-white border-slate-200/80 hover:border-blue-300 transition-colors',
    subtotalBg: 'bg-slate-100/85 text-slate-600 border-slate-200/80',
    textColorPrimary: 'text-slate-900',
    textColorSecondary: 'text-slate-500'
  };

  const c = theme === 'dark' ? darkColors : lightColors;
  const activePersona = data.personas.find(p => p.ativa) || data.personas[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      
      {/* 1. Welcoming Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border shadow-sm transition-colors ${c.cardBg}`}>
        <div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-blue-600 uppercase">
            {data.userProfile.appName || 'LifeOS AI'} Executivo v1.02
          </span>
          <h2 className={`text-xl font-bold tracking-tight mt-0.5 ${c.titleText}`}>Olá, César.</h2>
          <p className={`text-xs mt-0.5 ${c.subText}`}>Visão unificada das capturas classificadas e consolidação financeira.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Persona Ativa</span>
            <span className="text-xs bg-blue-50 border border-blue-200 px-2.5 py-1 rounded text-blue-600 tracking-wide font-semibold inline-flex items-center gap-1.5 mt-0.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              {activePersona.nome}
            </span>
          </div>

          {/* Zen Mode Toggle */}
          <button 
            onClick={() => setZenMode(!zenMode)} 
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition select-none cursor-pointer flex items-center gap-1.5 ${
              zenMode 
                ? 'bg-purple-50 text-purple-600 border-purple-250 shadow-sm' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-350'
            }`}
          >
            🧘 {zenMode ? 'Zen: ON' : 'Zen Mode'}
          </button>

          <button 
            onClick={onRefresh}
            className={`p-2 border rounded-lg transition duration-200 cursor-pointer ${
              theme === 'dark' ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700'
            }`}
            title="Recarregar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. ZEN MODE OVERLAY VIEW */}
      <AnimatePresence mode="wait">
        {zenMode ? (
          <motion.div
            key="zen"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`border rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] space-y-6 relative overflow-hidden transition-colors ${c.cardBg} glow-purple`}
          >
            <div className="absolute w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>

            <div className="text-center space-y-2 z-10">
              <span className="text-[10px] font-mono tracking-widest text-purple-500 uppercase font-bold">Foco Profundo Ativo</span>
              <h3 className={`text-xl font-bold tracking-tight ${c.titleText}`}>Espaço Livre de Distrações</h3>
              <p className={`text-xs max-w-sm mx-auto leading-relaxed ${c.subText}`}>
                Todas as métricas financeiras, checklists e notificações do dashboard foram ocultados temporariamente.
              </p>
            </div>

            {!isTimerRunning ? (
              <form onSubmit={handleStartZen} className="w-full max-w-sm space-y-3 z-10 text-center">
                <input 
                  type="text" 
                  required
                  placeholder="Qual é a sua única prioridade para os próximos 60 minutos?"
                  value={zenFocus}
                  onChange={e => setZenFocus(e.target.value)}
                  className={`w-full text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-medium transition text-center ${c.inputBg}`}
                />
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl px-6 py-2.5 transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Bloco de Foco (1h)
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-4 z-10">
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* Background Track Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      className="stroke-slate-100 dark:stroke-[#1d2230]/60 fill-none"
                      strokeWidth="5"
                    />
                    {/* Animated Purple Progress Circle */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="60"
                      className="stroke-purple-600 dark:stroke-purple-500 fill-none"
                      strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 60}
                      animate={{ strokeDashoffset: (2 * Math.PI * 60) - (timeLeft / 3600) * (2 * Math.PI * 60) }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Text in center */}
                  <span className="absolute text-3xl font-black font-mono text-purple-600 dark:text-purple-400 tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="text-center max-w-xs space-y-1">
                  <span className={`text-[10px] uppercase font-mono tracking-wider block ${c.subText}`}>Seu único objetivo:</span>
                  <p className={`text-xs font-bold font-sans italic tracking-wide break-words ${c.titleText}`}>
                    "{zenFocus}"
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={handleStopZen}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5 mx-auto transition"
                >
                  <Square className="w-3.5 h-3.5" /> Concluir Foco
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* 3. Quick Actions Bar */}
            <div className={`border rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-sm transition-colors ${c.cardBg}`}>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mr-2">Ações Rápidas:</span>
              <button
                onClick={() => setActiveModal('expense')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Registrar Despesa
              </button>
              <button
                onClick={() => setActiveModal('task')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                Nova Tarefa
              </button>
              <button
                onClick={() => setActiveModal('reminder')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                Novo Lembrete
              </button>
              <button
                onClick={() => setActiveModal('habit')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <Flame className="w-3.5 h-3.5" />
                Novo Hábito
              </button>
              <button
                onClick={() => setActiveModal('goal')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Meta
              </button>
              <button
                onClick={() => setActiveModal('project')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                Novo Projeto
              </button>
            </div>

            {/* 4. MOBILLS METRICS HEADER ROW (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Saldo Atual */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer ${c.cardBg} glow-blue`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <Landmark className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block leading-tight">Saldo atual</span>
                    <h3 className={`text-base font-black font-mono mt-0.5 tracking-tight ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
              </motion.div>

              {/* Receitas */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer ${c.cardBg} glow-emerald`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <TrendingUp className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block leading-tight">Receitas</span>
                    <h3 className={`text-base font-black font-mono mt-0.5 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
              </motion.div>

              {/* Despesas */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer ${c.cardBg} glow-purple`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <TrendingDown className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block leading-tight">Despesas</span>
                    <h3 className={`text-base font-black font-mono mt-0.5 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
              </motion.div>

              {/* Cartão de Crédito */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer ${c.cardBg} glow-blue`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-inner">
                    <CreditCard className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block leading-tight">Cartão de crédito</span>
                    <h3 className={`text-base font-black font-mono mt-0.5 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                      R$ {creditCardBill.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
              </motion.div>

            </div>

            {/* 5. MOBILLS STYLE TRANSACTION LEDGER (Calendário mensal e fechamentos) */}
            <div className={`border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg}`}>
              
              {/* Header com mês / ano picker */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <h3 className={`text-sm font-bold tracking-wide uppercase ${c.titleText}`}>Lançamentos do Mês</h3>
                  <p className={`text-[10px] font-mono ${c.textColorSecondary}`}>Frequência de conciliação diária integrada</p>
                </div>
                
                {/* Month navigation slider */}
                <div className="flex items-center bg-slate-50 dark:bg-[#090a0d] border border-slate-200 dark:border-slate-800 p-0.5 rounded-full shadow-inner select-none font-sans">
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition">
                    &lt;
                  </button>
                  <span className="px-6 text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wide font-mono uppercase">
                    {formattedMonth}
                  </span>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition">
                    &gt;
                  </button>
                </div>
              </div>

              {/* List Table items */}
              {fullLedger.length === 0 ? (
                <div className="py-20 text-center text-xs font-mono text-slate-400">
                  Nenhuma transação efetuada em {formattedMonth}. Use a barra de ações rápidas para cadastrar!
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Table Header labels */}
                  <div className="grid grid-cols-12 gap-3 px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 dark:border-slate-900 pb-2">
                    <div className="col-span-1 flex items-center justify-center">Situação</div>
                    <div className="col-span-2">Data</div>
                    <div className="col-span-3">Descrição</div>
                    <div className="col-span-2">Categoria</div>
                    <div className="col-span-2">Conta / Destino</div>
                    <div className="col-span-2 text-right">Valor</div>
                  </div>

                  {/* Combined transaction entries grouped dynamically */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      let cumulativeBalance = netBalance;
                      // Sort items ascending for calculating running balances, then reverse for rendering descending!
                      const runningBalanceItems = [...fullLedger].sort((a, b) => a.data.localeCompare(b.data));
                      const runningBalances: { [key: string]: number } = {};
                      
                      let balanceTracker = 0;
                      runningBalanceItems.forEach((item) => {
                        if (item.type === 'income') {
                          balanceTracker += item.valor;
                        } else {
                          balanceTracker -= item.valor;
                        }
                        runningBalances[item.id] = balanceTracker;
                      });

                      // Render items descending
                      return fullLedger.map((item, idx, arr) => {
                        const isIncome = item.type === 'income';
                        const formattedDate = new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'short' });
                        
                        // Map fake bank / account tag names dynamically to fit Mobills screenshot aesthetics
                        let accountTag = 'Carteira';
                        if (isIncome) {
                          accountTag = 'Salário';
                        } else if (item.categoria.toLowerCase().includes('alimentação') || item.categoria.toLowerCase().includes('mercado')) {
                          accountTag = 'Santander - C.C.';
                        } else if (item.categoria.toLowerCase().includes('transporte') || item.categoria.toLowerCase().includes('uber')) {
                          accountTag = 'Itaú - C.C.';
                        } else if (item.categoria.toLowerCase().includes('academia') || item.categoria.toLowerCase().includes('saúde')) {
                          accountTag = 'Picpay';
                        }

                        // Check if we should render a day subtotal marker block
                        // We render a subtotal pill if the next transaction in the list is on a different date (or this is the last item)
                        const isLastOfToday = idx === arr.length - 1 || arr[idx + 1].data !== item.data;
                        const dayBalance = runningBalances[item.id] || 0;

                        return (
                          <div key={item.id} className="pt-3 pb-3">
                            <div className="grid grid-cols-12 gap-3 px-3 py-1 items-center text-xs">
                              
                              {/* Checkbox + Status */}
                              <div className="col-span-1 flex items-center justify-center gap-1.5">
                                {isIncome ? (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <Landmark className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 animate-pulse" />
                                  </div>
                                )}
                              </div>

                              {/* Date */}
                              <div className={`col-span-2 font-mono ${c.textColorSecondary}`}>{formattedDate}</div>

                              {/* Description */}
                              <div className={`col-span-3 font-bold truncate ${c.textColorPrimary}`}>{item.descricao}</div>

                              {/* Category Badging */}
                              <div className="col-span-2">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isIncome 
                                    ? 'bg-emerald-50/80 text-emerald-600 border-emerald-150/80' 
                                    : 'bg-rose-50/80 text-rose-600 border-rose-150/80'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  {item.categoria}
                                </span>
                              </div>

                              {/* Account tag */}
                              <div className={`col-span-2 font-medium truncate ${c.textColorSecondary}`}>{accountTag}</div>

                              {/* Value color coded */}
                              <div className={`col-span-2 text-right font-black font-mono text-[12px] ${
                                isIncome ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                                {isIncome ? '+' : '-'} R$ {item.valor.toFixed(2)}
                              </div>

                            </div>

                            {/* 5.1 Center-aligned Day Balance Subtotal Tag (Mobills style) */}
                            {isLastOfToday && (
                              <div className="flex justify-center mt-3 pt-2">
                                <span className={`text-[10px] font-mono font-bold px-4 py-1.5 rounded-full border shadow-inner transition-colors ${c.subtotalBg}`}>
                                  Saldo do Final do Dia: <strong>R$ {dayBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                                </span>
                              </div>
                            )}

                          </div>
                        );
                      });
                    })()}
                  </div>

                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Quick Action Modal dialogues */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border ${
                theme === 'dark' 
                  ? 'glass-card-dark text-slate-200 border-slate-700/80 shadow-2xl' 
                  : 'bg-white border-slate-200/80 text-slate-850 shadow-xl'
              }`}
            >
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="text-xs font-bold mb-4 tracking-wide font-mono uppercase">
                {activeModal === 'expense' && 'Registrar Despesa'}
                {activeModal === 'task' && 'Criar Nova Tarefa'}
                {activeModal === 'reminder' && 'Criar Novo Lembrete'}
                {activeModal === 'habit' && 'Criar Novo Hábito'}
                {activeModal === 'goal' && 'Cadastrar Nova Meta'}
                {activeModal === 'project' && 'Iniciar Novo Projeto'}
              </h3>

              <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
                {activeModal === 'expense' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Valor (R$)*</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={expenseForm.valor}
                        onChange={e => setExpenseForm({...expenseForm, valor: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Categoria</label>
                      <input 
                        type="text" 
                        value={expenseForm.categoria}
                        onChange={e => setExpenseForm({...expenseForm, categoria: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Descrição</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Almoço no Verde"
                        value={expenseForm.descricao}
                        onChange={e => setExpenseForm({...expenseForm, descricao: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Data</label>
                      <input 
                        type="date" 
                        value={expenseForm.data}
                        onChange={e => setExpenseForm({...expenseForm, data: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-mono"
                      />
                    </div>
                  </>
                )}

                {activeModal === 'task' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Título da Tarefa*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Revisar contrato"
                        value={taskForm.titulo}
                        onChange={e => setTaskForm({...taskForm, titulo: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Prioridade</label>
                      <select
                        value={taskForm.prioridade}
                        onChange={e => setTaskForm({...taskForm, prioridade: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-850 dark:text-slate-800 focus:outline-none transition"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Prazo</label>
                      <input 
                        type="date" 
                        value={taskForm.prazo}
                        onChange={e => setTaskForm({...taskForm, prazo: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                      />
                    </div>
                  </>
                )}

                {activeModal === 'reminder' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Título do Lembrete*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Call com time"
                        value={reminderForm.titulo}
                        onChange={e => setReminderForm({...reminderForm, titulo: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Data & Hora*</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={reminderForm.data_hora}
                        onChange={e => setReminderForm({...reminderForm, data_hora: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-mono"
                      />
                    </div>
                  </>
                )}

                {activeModal === 'habit' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome do Hábito*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Ler papers técnicos"
                        value={habitForm.nome}
                        onChange={e => setHabitForm({...habitForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-orange-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Frequência</label>
                      <select
                        value={habitForm.frequencia}
                        onChange={e => setHabitForm({...habitForm, frequencia: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-orange-500 rounded-lg p-2.5 text-slate-850 dark:text-slate-800 focus:outline-none transition"
                      >
                        <option value="diaria">Diária</option>
                        <option value="semanal">Semanal</option>
                      </select>
                    </div>
                  </>
                )}

                {activeModal === 'goal' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Título da Meta*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Lançar MVP"
                        value={goalForm.titulo}
                        onChange={e => setGoalForm({...goalForm, titulo: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Valor Alvo (Meta Numérica)*</label>
                      <input 
                        type="number" 
                        required
                        placeholder="Ex: 10000"
                        value={goalForm.meta}
                        onChange={e => setGoalForm({...goalForm, meta: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Prazo Limite</label>
                      <input 
                        type="date" 
                        value={goalForm.prazo}
                        onChange={e => setGoalForm({...goalForm, prazo: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-amber-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition font-mono"
                      />
                    </div>
                  </>
                )}

                {activeModal === 'project' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome do Projeto*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Automator Pro"
                        value={projectForm.nome}
                        onChange={e => setProjectForm({...projectForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-purple-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Descrição</label>
                      <textarea 
                        placeholder="Breve descrição dos objetivos..."
                        value={projectForm.descricao}
                        onChange={e => setProjectForm({...projectForm, descricao: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-purple-500 rounded-lg p-2.5 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition h-20 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Status Inicial</label>
                      <select
                        value={projectForm.status}
                        onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-purple-500 rounded-lg p-2.5 text-slate-850 dark:text-slate-800 focus:outline-none transition"
                      >
                        <option value="planning">Planejamento</option>
                        <option value="active">Ativo</option>
                        <option value="on_hold">Em Espera</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="pt-2 flex gap-3 font-mono font-bold uppercase tracking-wide">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-650 dark:text-slate-300 transition duration-200 cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition duration-200 cursor-pointer text-center font-bold"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
