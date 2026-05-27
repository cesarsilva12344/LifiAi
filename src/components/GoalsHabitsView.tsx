import React, { useState } from 'react';
import { Flame, Target, CheckCircle2, Circle, Trophy, Calendar, Sparkles, TrendingUp, Trash2 } from 'lucide-react';
import { DatabaseState, Habit, Goal } from '../types';
import { showToast } from './Toast';

interface GoalsHabitsViewProps {
  data: DatabaseState;
  onRefresh: () => void;
}

export default function GoalsHabitsView({ data, onRefresh }: GoalsHabitsViewProps) {
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
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao dar check-in em hábito:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGoalSliderProgress = async (id: string, val: string) => {
    try {
      const res = await fetch('/api/db/goals/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, progresso: val })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao salvar progresso de meta:', err);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitNome.trim()) return;
    try {
      const res = await fetch('/api/db/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newHabitNome, frequencia: newHabitFreq })
      });
      if (res.ok) {
        showToast('Hábito criado com sucesso!', 'success');
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
          showToast('Hábito excluído!', 'success');
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
    if (!newGoalTitle.trim() || isNaN(metaNum)) return;
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

  const todayStr = '2026-05-26';

  return (
    <div className="space-y-6">
      
      {/* Habits Subsection */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6">
        <div className="flex border-b border-[#1b1c25] pb-3 mb-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-orange-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white tracking-wide">ROUTINES & HABIT TRACKING</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase">Hoje: **{todayStr}**</span>
        </div>

        {/* Inline Create Habit Form */}
        <form onSubmit={handleCreateHabit} className="flex flex-wrap gap-2.5 mb-5 max-w-lg bg-[#090a0d] p-3 border border-[#1d202a] rounded-xl items-center">
          <input
            type="text"
            required
            placeholder="Novo hábito (ex: Academia)"
            value={newHabitNome}
            onChange={e => setNewHabitNome(e.target.value)}
            className="flex-1 min-w-[150px] bg-transparent text-xs text-white border-b border-[#2d2f3d] focus:border-orange-400 focus:outline-none py-1 px-1.5"
          />
          <select
            value={newHabitFreq}
            onChange={e => setNewHabitFreq(e.target.value)}
            className="bg-[#090a0d] text-xs text-gray-300 border border-[#2d2f3d] rounded p-1 cursor-pointer focus:outline-none"
          >
            <option value="diaria">Diário</option>
            <option value="semanal">Semanal</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold transition cursor-pointer"
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
                    ? 'bg-emerald-950/20 border-emerald-500/20' 
                    : 'bg-[#090a0d] border-[#1f212a] hover:border-[#2b2e3e]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <h4 className="text-xs font-semibold text-white truncate">{habit.nome}</h4>
                    <span className="text-[9px] text-gray-500 font-mono uppercase block mt-0.5">Frequência: {habit.frequencia}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      disabled={updatingId === habit.id}
                      onClick={() => handleHabitCheck(habit.id)}
                      className="p-1 hover:bg-[#1a1d29] rounded cursor-pointer transition select-none"
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-gray-600 hover:text-orange-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition"
                      title="Excluir hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Habit Streaks and Calendar visualization summary */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#1d1f2a]/60">
                  <div className="flex items-center gap-1 bg-[#1a1d28] border border-[#2b2f3d] px-2 py-0.5 rounded text-[10px] font-mono text-orange-400 font-semibold uppercase">
                    <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    {habit.streak} dias
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono scale-95 origin-left">
                    Histórico consolidado
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals Subsections */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6">
        <div className="flex border-b border-[#1b1c25] pb-3 mb-4 items-center gap-2">
          <Target className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white tracking-wide">METAS DE ALTO STATUS</h3>
        </div>

        {/* Inline Create Goal Form */}
        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mb-5 max-w-3xl bg-[#090a0d] p-4 border border-[#1d202a] rounded-xl items-end">
          <div>
            <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Título da Meta*</label>
            <input
              type="text"
              required
              placeholder="Ex: Lançar SaaS"
              value={newGoalTitle}
              onChange={e => setNewGoalTitle(e.target.value)}
              className="w-full bg-[#090a0d] text-xs text-white border-b border-[#2d2f3d] focus:border-blue-400 focus:outline-none py-1 px-1.5"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Alvo Numérico*</label>
            <input
              type="number"
              required
              placeholder="Ex: 5000"
              value={newGoalMeta}
              onChange={e => setNewGoalMeta(e.target.value)}
              className="w-full bg-[#090a0d] text-xs text-white border-b border-[#2d2f3d] focus:border-blue-400 focus:outline-none py-1 px-1.5"
            />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-500 uppercase mb-1">Prazo*</label>
            <input
              type="date"
              required
              value={newGoalPrazo}
              onChange={e => setNewGoalPrazo(e.target.value)}
              className="w-full bg-[#090a0d] text-xs text-white border-b border-[#2d2f3d] focus:border-blue-400 focus:outline-none py-1 px-1.5 cursor-pointer"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition cursor-pointer"
          >
            Cadastrar Meta
          </button>
        </form>

        <div className="space-y-5">
          {data.goals.map((goal) => {
            const pct = Math.min(100, Math.max(0, (goal.progresso / goal.meta) * 100));

            return (
              <div 
                key={goal.id}
                className="p-5 bg-[#090a0d] border border-[#1f212a] rounded-xl shadow space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{goal.titulo}</h4>
                    <span className="text-[9px] text-gray-500 font-mono block mt-0.5">Prazo Estimado: {goal.prazo}</span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3.5">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Alvo de Meta</span>
                      <strong className="text-xs font-semibold text-white font-mono">
                        {goal.progresso.toLocaleString()} / {goal.meta.toLocaleString()} ({pct.toFixed(0)}%)
                      </strong>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded cursor-pointer transition"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Range progress Slider physically updating state on Release */}
                <div className="space-y-1.5 pt-1">
                  <input 
                    type="range"
                    min="0"
                    max={goal.meta}
                    value={goal.progresso}
                    onChange={(e) => handleGoalSliderProgress(goal.id, e.target.value)}
                    className="w-full bg-[#1b1c26] h-1.5 rounded-lg appearance-none cursor-ew-resize accent-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono uppercase">
                    <span>Ajustar progresso na barra</span>
                    <span>Sincronizado</span>
                  </div>
                </div>

                <div className="w-full bg-[#1c1e28] rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
