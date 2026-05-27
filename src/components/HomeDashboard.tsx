import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, CheckSquare, 
  Flame, Sparkles, RefreshCw, Layers, ArrowUpRight, Compass, CompassIcon,
  Plus, X
} from 'lucide-react';
import { DatabaseState } from '../types';
import { showToast } from './Toast';

interface HomeDashboardProps {
  data: DatabaseState;
  onRefresh: () => void;
}

export default function HomeDashboard({ data, onRefresh }: HomeDashboardProps) {
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [activeModal, setActiveModal] = useState<'expense' | 'task' | 'reminder' | 'habit' | 'goal' | 'project' | null>(null);

  // States for forms
  const [expenseForm, setExpenseForm] = useState({ valor: '', categoria: 'Alimentação', descricao: '', data: new Date().toISOString().split('T')[0] });
  const [taskForm, setTaskForm] = useState({ titulo: '', prioridade: 'medium', prazo: new Date(Date.now() + 86400000).toISOString().split('T')[0] });
  const [reminderForm, setReminderForm] = useState({ titulo: '', data_hora: new Date(Date.now() + 3600000).toISOString().slice(0, 16) });
  const [habitForm, setHabitForm] = useState({ nome: '', frequencia: 'diaria' });
  const [goalForm, setGoalForm] = useState({ titulo: '', meta: '', prazo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
  const [projectForm, setProjectForm] = useState({ nome: '', descricao: '', status: 'planning' });

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
      body = { ...goalForm, meta: parseFloat(goalForm.meta) };
      if (!goalForm.titulo.trim() || !goalForm.meta || isNaN(parseFloat(goalForm.meta))) {
        showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
      }
    } else if (activeModal === 'project') {
      url = '/api/db/projects';
      body = projectForm;
      if (!projectForm.nome.trim()) {
        showToast('O nome é obrigatório.', 'error');
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
        showToast('Item criado com sucesso!', 'success');
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
        const errData = await res.json();
        showToast(`Erro ao criar: ${errData.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Falha ao conectar ao servidor: ${err.message}`, 'error');
    }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/insights');
      if (res.ok) {
        const json = await res.json();
        setInsights(json.insights);
      }
    } catch (err) {
      console.error('Falha ao buscar insights da persona:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [data.personas]); // Re-fetch whenever personas change!

  // Financial stats calculation
  const totalIncome = data.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.valor, 0);
  const netBalance = totalIncome - totalExpenses;

  // Active items
  const pendingTasks = data.tasks.filter(t => t.status === 'pending');
  const activeReminders = data.reminders.filter(r => r.status === 'active');
  const activeHabits = data.habits;

  // Render markdown helper
  const renderInsights = (text: string) => {
    if (!text) return 'Nenhum conselho computado ainda. Aguardando processamento...';
    // Simple line-by-line render of markdown symbols
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h4 key={idx} className="text-sm font-bold text-blue-300 mt-4 mb-2 tracking-wide font-mono uppercase">{line.replace('###', '').trim()}</h4>;
      }
      if (line.startsWith('##')) {
        return <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 tracking-wide font-mono">{line.replace('##', '').trim()}</h3>;
      }
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        return <div key={idx} className="text-xs text-gray-300 ml-2 my-2 border-l-2 border-blue-500 pl-3 py-0.5">{line}</div>;
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        return <li key={idx} className="text-xs text-gray-300 ml-4 my-1 list-disc">{line.replace(/^[-*]\s*/, '')}</li>;
      }
      return <p key={idx} className="text-xs text-gray-400 my-1 leading-relaxed">{line}</p>;
    });
  };

  const getPriorityBadgeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'high': return 'bg-red-950/50 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-950/50 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-950/50 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const activePersona = data.personas.find(p => p.ativa) || data.personas[0];

  return (
    <div className="space-y-6">
      {/* Header welcome row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#111318] border border-[#1d202a] rounded-xl shadow-lg">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-blue-500 uppercase">{data.userProfile.appName || 'LifeOS AI'} Executivo v1.02</span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Olá, {data.userProfile.nome || 'Cesaronesto'}.</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visão unificada das capturas classificadas e consolidação analítica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 font-mono uppercase block">Persona Ativa</span>
            <span className="text-xs bg-[#191d29] border border-[#2d3142] px-2.5 py-1 rounded text-blue-400 tracking-wide font-semibold inline-flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              {activePersona.nome}
            </span>
          </div>
          <button 
            onClick={onRefresh}
            className="p-2 border border-[#1e202a] hover:bg-[#202330] rounded-lg text-gray-400 hover:text-white transition duration-200 cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-[#111318] border border-[#1d202a] rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-400 font-mono uppercase tracking-wider mr-2">Ações Rápidas:</span>
        <button
          onClick={() => setActiveModal('expense')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <DollarSign className="w-3.5 h-3.5" />
          Registrar Despesa
        </button>
        <button
          onClick={() => setActiveModal('task')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Nova Tarefa
        </button>
        <button
          onClick={() => setActiveModal('reminder')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          Novo Lembrete
        </button>
        <button
          onClick={() => setActiveModal('habit')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5" />
          Novo Hábito
        </button>
        <button
          onClick={() => setActiveModal('goal')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </button>
        <button
          onClick={() => setActiveModal('project')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-semibold transition duration-200 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          Novo Projeto
        </button>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Quick financial balance */}
        <div className="p-5 bg-[#111318] border border-[#1e202a] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Balanço Líquido Mensal</span>
            <div className={`p-1.5 rounded-lg ${netBalance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {netBalance >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
          </div>
          <div className="my-4">
            <h3 className={`text-2xl font-bold font-mono tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Calculado em Tempo Real</span>
          </div>
          <div className="pt-3 border-t border-[#1a1c25] flex justify-between text-xs font-mono">
            <span className="text-gray-500">Entradas: <strong className="text-emerald-500">R$ {totalIncome.toFixed(0)}</strong></span>
            <span className="text-gray-500">Saídas: <strong className="text-red-500">R$ {totalExpenses.toFixed(0)}</strong></span>
          </div>
        </div>

        {/* Tasks progress indicator */}
        <div className="p-5 bg-[#111318] border border-[#1e202a] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Tarefas Ativas</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <CheckSquare className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="my-4">
            <h3 className="text-2xl font-bold font-mono text-white tracking-tight">
              {pendingTasks.length} <span className="text-sm font-normal text-gray-500">pendentes</span>
            </h3>
            <span className="text-[10px] text-gray-500 font-mono uppercase">De {data.tasks.length} totais</span>
          </div>
          <div className="w-full bg-[#1c1e28] rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${data.tasks.length ? ((data.tasks.filter(t => t.status==='completed').length) / data.tasks.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Habits focus */}
        <div className="p-5 bg-[#111318] border border-[#1e202a] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Consistência de Hábitos</span>
            <div className="p-1.5 rounded-lg bg-orange-500/10">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="my-4">
            <div className="flex gap-2 items-baseline">
              <h3 className="text-2xl font-bold font-mono text-orange-400 tracking-tight">
                {activeHabits.reduce((max, h) => h.streak > max ? h.streak : max, 0)}
              </h3>
              <span className="text-xs text-gray-400">dias de streak máximo</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Em {activeHabits.length} rotinas ativas</span>
          </div>
          <div className="pt-3 border-t border-[#1a1c25] flex gap-2 overflow-x-auto select-none">
            {activeHabits.slice(0, 3).map((h, i) => (
              <div key={i} className="text-[10px] bg-[#1a1d28] border border-[#2b2f3d] rounded px-2 py-0.5 text-gray-300 whitespace-nowrap">
                🔥 {h.nome.split(' ')[0]}: {h.streak}d
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Highlights & Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Persona Analytics - 3 Columns */}
        <div className="col-span-1 lg:col-span-3 bg-[#111318] border border-[#1e202a] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          {/* Decorative background circle */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          <div>
            <div className="flex items-center justify-between border-b border-[#1b1c25] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white tracking-wide">AVALIAÇÃO DA PERSONA ATIVA</h3>
              </div>
              <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/20">
                Cognição Ativa
              </span>
            </div>

            <div className="space-y-3 min-h-[220px]">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
                  <span className="text-xs font-mono text-gray-500">Aconselhando sob a ótica da persona ({activePersona.nome})...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {renderInsights(insights)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a1c25] text-[10px] text-gray-500 flex items-center gap-1 font-mono">
            <Compass className="w-3.5 h-3.5" />
            Análise atualizada com base em memórias, contexto e histórico integrado. Morador de: Brasil.
          </div>
        </div>

        {/* Right: Urgent Priorities & Schedule - 2 Columns */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          
          {/* Priorities card */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">Prioridades do Dia</h3>
            <div className="space-y-2.5 max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-600 font-mono">
                  Sua mente está livre. Sem pendências!
                </div>
              ) : (
                pendingTasks.slice(0, 4).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex justify-between items-center p-2.5 bg-[#0a0a0f] border border-[#1d1e28] rounded-lg text-xs hover:border-[#2d2e3c] transition duration-200"
                  >
                    <span className="text-gray-300 font-medium truncate pr-2">{task.titulo}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 ${getPriorityBadgeColor(task.prioridade)}`}>
                      {task.prioridade}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Incipient agenda Reminders */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider mb-3">Compromissos e Lembretes</h3>
            <div className="space-y-2.5 max-h-[170px] overflow-y-auto custom-scrollbar pr-1">
              {activeReminders.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-600 font-mono">
                  Lista de agenda limpa ou zerada.
                </div>
              ) : (
                activeReminders.slice(0, 3).map((rem) => (
                  <div 
                    key={rem.id} 
                    className="p-2.5 bg-[#0a0a0f] border border-[#1d1e28] rounded-lg text-xs"
                  >
                    <div className="text-gray-300 font-medium">{rem.titulo}</div>
                    <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                      ⏱️ {new Date(rem.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

      </div>
    </div>

      {/* Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111318] border border-[#1e202a] w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-slide-in">
            <button 
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 tracking-wide font-mono uppercase">
              {activeModal === 'expense' && 'Registrar Despesa'}
              {activeModal === 'task' && 'Criar Nova Tarefa'}
              {activeModal === 'reminder' && 'Criar Novo Lembrete'}
              {activeModal === 'habit' && 'Criar Novo Hábito'}
              {activeModal === 'goal' && 'Cadastrar Nova Meta'}
              {activeModal === 'project' && 'Iniciar Novo Projeto'}
            </h3>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {activeModal === 'expense' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Valor (R$)*</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={expenseForm.valor}
                      onChange={e => setExpenseForm({...expenseForm, valor: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Categoria</label>
                    <input 
                      type="text" 
                      value={expenseForm.categoria}
                      onChange={e => setExpenseForm({...expenseForm, categoria: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Descrição</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Almoço no Verde"
                      value={expenseForm.descricao}
                      onChange={e => setExpenseForm({...expenseForm, descricao: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Data</label>
                    <input 
                      type="date" 
                      value={expenseForm.data}
                      onChange={e => setExpenseForm({...expenseForm, data: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </>
              )}

              {activeModal === 'task' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Título da Tarefa*</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Revisar contrato"
                      value={taskForm.titulo}
                      onChange={e => setTaskForm({...taskForm, titulo: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Prioridade</label>
                    <select
                      value={taskForm.prioridade}
                      onChange={e => setTaskForm({...taskForm, prioridade: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Prazo</label>
                    <input 
                      type="date" 
                      value={taskForm.prazo}
                      onChange={e => setTaskForm({...taskForm, prazo: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </>
              )}

              {activeModal === 'reminder' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Título do Lembrete*</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Call com time"
                      value={reminderForm.titulo}
                      onChange={e => setReminderForm({...reminderForm, titulo: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Data & Hora*</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={reminderForm.data_hora}
                      onChange={e => setReminderForm({...reminderForm, data_hora: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </>
              )}

              {activeModal === 'habit' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Nome do Hábito*</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Ler papers técnicos"
                      value={habitForm.nome}
                      onChange={e => setHabitForm({...habitForm, nome: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Frequência</label>
                    <select
                      value={habitForm.frequencia}
                      onChange={e => setHabitForm({...habitForm, frequencia: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 transition"
                    >
                      <option value="diaria">Diária</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>
                </>
              )}

              {activeModal === 'goal' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Título da Meta*</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Lançar MVP"
                      value={goalForm.titulo}
                      onChange={e => setGoalForm({...goalForm, titulo: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Valor Alvo (Meta Numérica)*</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Ex: 10000"
                      value={goalForm.meta}
                      onChange={e => setGoalForm({...goalForm, meta: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Prazo Limite</label>
                    <input 
                      type="date" 
                      value={goalForm.prazo}
                      onChange={e => setGoalForm({...goalForm, prazo: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </>
              )}

              {activeModal === 'project' && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Nome do Projeto*</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Automator Pro"
                      value={projectForm.nome}
                      onChange={e => setProjectForm({...projectForm, nome: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Descrição</label>
                    <textarea 
                      placeholder="Breve descrição dos objetivos..."
                      value={projectForm.descricao}
                      onChange={e => setProjectForm({...projectForm, descricao: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 transition h-20 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Status Inicial</label>
                    <select
                      value={projectForm.status}
                      onChange={e => setProjectForm({...projectForm, status: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1d1e28] rounded-lg p-2.5 text-sm text-gray-100 focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="planning">Planejamento</option>
                      <option value="active">Ativo</option>
                      <option value="on_hold">Em Espera</option>
                    </select>
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2 bg-[#1a1c26] hover:bg-[#252836] border border-[#2d2f3d] rounded-lg text-xs font-semibold text-gray-300 transition duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition duration-200 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
