import React, { useState } from 'react';
import { Flame, Target, CheckCircle2, Circle, Trophy, Calendar, Sparkles, TrendingUp, Trash2, Plus } from 'lucide-react';
import { DatabaseState, Habit, Goal } from '../types';
import { showToast } from './Toast';

interface GoalsHabitsViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function GoalsHabitsView({ data, onRefresh, theme = 'light' }: GoalsHabitsViewProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form states
  const [newHabitNome, setNewHabitNome] = useState('');
  const [newHabitFreq, setNewHabitFreq] = useState('diaria');

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalMeta, setNewGoalMeta] = useState('');
  const [newGoalPrazo, setNewGoalPrazo] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  const handleHabitCheck = async (id: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/db/habits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date: todayStr })
      });
      if (res.ok) {
        showToast('Progresso do hábito computado!', 'success');
        onRefresh();
      } else {
        showToast('Erro ao computar hábito.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitNome.trim()) return;
    try {
      const res = await fetch('/api/db/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newHabitNome, frequencia: newHabitFreq, streak: 0, history: [] })
      });
      if (res.ok) {
        showToast('Novo hábito adicionado!', 'success');
        setNewHabitNome('');
        onRefresh();
      } else {
        showToast('Erro ao criar hábito.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (confirm('Deseja realmente excluir este hábito?')) {
      try {
        const res = await fetch(`/api/db/habits/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Hábito excluído com sucesso!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao excluir hábito.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha: ${err.message}`, 'error');
      }
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const metaNum = parseFloat(newGoalMeta);
    if (!newGoalTitle.trim() || isNaN(metaNum)) {
      showToast('Por favor, informe valores válidos.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/db/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newGoalTitle, meta: metaNum, prazo: newGoalPrazo })
      });
      if (res.ok) {
        showToast('Meta cadastrada com sucesso!', 'success');
        setNewGoalTitle('');
        setNewGoalMeta('');
        onRefresh();
      } else {
        showToast('Erro ao cadastrar meta.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Deseja realmente excluir esta meta?')) {
      try {
        const res = await fetch(`/api/db/goals/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Meta excluída!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao excluir meta.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha: ${err.message}`, 'error');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic theme variables for Light / Dark Premium consistency
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1e202a] text-slate-100',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1c25]',
    formBg: 'bg-[#090a0d] border-[#1d202a] text-white',
    inputBg: 'bg-[#090a0d] border-[#202330] text-white placeholder-gray-650',
    listBg: 'bg-[#090a0d] border-[#1f212a] hover:border-[#2b2e3e] text-slate-300',
    habitCardBg: 'bg-[#090a0d] border-[#1f212a]',
    badgeBg: 'bg-[#1a1d28] border-[#2b2f3d]',
    inputText: 'text-white'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800',
    titleText: 'text-slate-800',
    subText: 'text-slate-500',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    formBg: 'bg-slate-50 border-slate-200 text-slate-800',
    inputBg: 'bg-slate-50 border-slate-200 text-slate-850 placeholder-slate-400',
    listBg: 'bg-white border-slate-200 hover:border-slate-350 text-slate-700',
    habitCardBg: 'bg-white border-slate-200',
    badgeBg: 'bg-slate-100 border-slate-200',
    inputText: 'text-slate-800'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="space-y-6">
      
      {/* 1. Habits Subsection */}
      <div className={`border rounded-xl p-6 shadow-sm transition-colors ${c.cardBg}`}>
        <div className={`flex border-b pb-3 mb-4 items-center justify-between ${c.divider}`}>
          <div className="flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
            <h3 className={`text-sm font-bold tracking-wide ${c.titleText}`}>ROTINAS & HÁBITOS</h3>
          </div>
          <span className={`text-[10px] font-mono uppercase ${c.subText}`}>Hoje: **{todayStr}**</span>
        </div>

        {/* Inline Create Habit Form */}
        <form onSubmit={handleCreateHabit} className={`flex flex-wrap gap-2.5 mb-5 max-w-lg p-3 rounded-xl items-center border transition-colors ${c.formBg}`}>
          <input
            type="text"
            required
            placeholder="Novo hábito (ex: Academia)"
            value={newHabitNome}
            onChange={e => setNewHabitNome(e.target.value)}
            className={`flex-1 min-w-[150px] bg-transparent text-xs border-b focus:border-orange-500 focus:outline-none py-1 px-1.5 transition-colors ${
              theme === 'dark' ? 'border-[#2d2f3d] text-white' : 'border-slate-200 text-slate-850'
            }`}
          />
          <select
            value={newHabitFreq}
            onChange={e => setNewHabitFreq(e.target.value)}
            className={`text-xs border rounded p-1.5 cursor-pointer focus:outline-none transition-colors ${
              theme === 'dark' ? 'bg-[#090a0d] text-gray-300 border-[#2d2f3d]' : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            <option value="diaria" className={theme === 'dark' ? 'bg-[#111318] text-white' : 'bg-white text-slate-850'}>Diário</option>
            <option value="semanal" className={theme === 'dark' ? 'bg-[#111318] text-white' : 'bg-white text-slate-850'}>Semanal</option>
          </select>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm select-none"
          >
            Adicionar
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.habits.map((habit) => {
            const isCompletedToday = habit.history.includes(todayStr);

            return (
              <div 
                key={habit.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition duration-200 ${
                  isCompletedToday 
                    ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-500/20 text-emerald-850') 
                    : `${c.habitCardBg} hover:border-slate-350`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <h4 className={`text-xs font-bold truncate ${isCompletedToday ? 'text-emerald-600' : c.titleText}`}>{habit.nome}</h4>
                    <span className={`text-[9px] font-mono uppercase block mt-0.5 ${c.subText}`}>Frequência: {habit.frequencia}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      disabled={updatingId === habit.id}
                      onClick={() => handleHabitCheck(habit.id)}
                      className={`p-1 rounded cursor-pointer transition select-none ${
                        theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                      }`}
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      ) : (
                        <Circle className={`w-4.5 h-4.5 ${
                          theme === 'dark' ? 'text-slate-600 hover:text-orange-400' : 'text-slate-400 hover:text-orange-500'
                        }`} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer transition"
                      title="Excluir hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Habit Streaks and Calendar visualization summary */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-150 dark:border-slate-800/60">
                  <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono text-orange-500 font-bold uppercase border ${c.badgeBg}`}>
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    {habit.streak} dias
                  </div>
                  <div className={`text-[9px] font-mono scale-95 origin-left ${c.subText}`}>
                    Histórico ativo
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Goals Subsections */}
      <div className={`border rounded-xl p-6 shadow-sm transition-colors ${c.cardBg}`}>
        <div className={`flex border-b pb-3 mb-4 items-center gap-2 ${c.divider}`}>
          <Target className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
          <h3 className={`text-sm font-bold tracking-wide ${c.titleText}`}>METAS DE SUCESSO</h3>
        </div>

        {/* Inline Create Goal Form */}
        <form onSubmit={handleCreateGoal} className={`grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-5 max-w-3xl p-4 rounded-xl items-end border transition-colors ${c.formBg}`}>
          <div>
            <label className={`block text-[9px] font-mono uppercase mb-1 ${c.subText}`}>Título da Meta*</label>
            <input
              type="text"
              required
              placeholder="Ex: Lançar SaaS"
              value={newGoalTitle}
              onChange={e => setNewGoalTitle(e.target.value)}
              className={`w-full bg-transparent text-xs border-b focus:border-blue-400 focus:outline-none py-1 px-1.5 transition-colors ${
                theme === 'dark' ? 'border-[#2d2f3d] text-white' : 'border-slate-200 text-slate-850'
              }`}
            />
          </div>
          <div>
            <label className={`block text-[9px] font-mono uppercase mb-1 ${c.subText}`}>Alvo Numérico*</label>
            <input
              type="number"
              required
              placeholder="Ex: 10000"
              value={newGoalMeta}
              onChange={e => setNewGoalMeta(e.target.value)}
              className={`w-full bg-transparent text-xs border-b focus:border-blue-400 focus:outline-none py-1 px-1.5 transition-colors ${
                theme === 'dark' ? 'border-[#2d2f3d] text-white font-mono' : 'border-slate-200 text-slate-850 font-mono font-semibold'
              }`}
            />
          </div>
          <div>
            <label className={`block text-[9px] font-mono uppercase mb-1 ${c.subText}`}>Prazo Limite*</label>
            <input
              type="date"
              required
              value={newGoalPrazo}
              onChange={e => setNewGoalPrazo(e.target.value)}
              className={`w-full bg-transparent text-xs border-b focus:border-blue-400 focus:outline-none py-1 px-1.5 cursor-pointer transition-colors ${
                theme === 'dark' ? 'border-[#2d2f3d] text-white font-mono' : 'border-slate-200 text-slate-850 font-mono font-semibold'
              }`}
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm select-none uppercase tracking-wide"
          >
            Cadastrar Meta
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.goals.map((goal) => {
            const percentage = Math.min(100, Math.max(0, Math.round((goal.progresso / goal.meta) * 100)));
            const formattedLimitDate = new Date(goal.prazo + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'short' });

            return (
              <div 
                key={goal.id}
                className={`p-5 rounded-xl border space-y-4 transition-colors ${
                  theme === 'dark' ? 'bg-[#090a0d] border-[#1f212a]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`text-xs font-bold ${c.titleText}`}>{goal.titulo}</h4>
                    <span className={`text-[9px] font-mono block mt-1 ${c.subText}`}>Prazo Final: <strong>{formattedLimitDate}</strong></span>
                  </div>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer transition"
                    title="Excluir meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className={c.subText}>Progresso: <strong className={c.titleText}>{goal.progresso}</strong> de {goal.meta}</span>
                    <span className="text-blue-500 font-bold">{percentage}%</span>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="w-full rounded-full h-2 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500 shadow-md"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
