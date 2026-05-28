import React from 'react';
import { AlertOctagon, TrendingDown, Clock, AlertTriangle, Play, Flame, Layers } from 'lucide-react';
import { DatabaseState } from '../types';

interface WarModeProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function WarModeOverlay({ data, onRefresh, theme = 'light' }: WarModeProps) {
  const totalIncome = data.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.valor, 0);
  const net = totalIncome - totalExpenses;

  // Urgent pending tasks (high priority)
  const urgentTasks = data.tasks.filter(t => t.status === 'pending' && t.prioridade === 'high');

  // Debts about to expire or overdue (ABERTA or ATRASADA)
  const criticalDebts = data.debts.filter(d => d.status === 'ABERTA' || d.status === 'ATRASADA' || d.status === 'PARCIAL');

  // Leakage calculations (categories where real > planned budget, or >= 80% planned)
  const budgetsList = data.budgets || [];
  const expensesList = data.expenses || [];
  
  const leakages = budgetsList.map(b => {
    const realizado = expensesList
      .filter(e => e.categoria.toLowerCase() === b.category_id.toLowerCase() && new Date(e.data + 'T12:00:00').getMonth() + 1 === b.mes && new Date(e.data + 'T12:00:00').getFullYear() === b.ano)
      .reduce((sum, e) => sum + e.valor, 0);
    
    const percent = b.valor_planejado > 0 ? (realizado / b.valor_planejado) * 100 : 0;
    return {
      category: b.category_id,
      planejado: b.valor_planejado,
      realizado,
      percent,
      isLeakage: percent >= 80
    };
  }).filter(l => l.isLeakage);

  const isDark = theme === 'dark';
  const c = isDark 
    ? 'bg-zinc-950 border-red-950 text-red-100 shadow-2xl'
    : 'bg-[#faf8f8] border-red-200 text-slate-800 shadow-xl';

  return (
    <div className={`p-6 border-2 rounded-3xl space-y-6 transition duration-300 relative overflow-hidden ${c} border-red-900/50 dark:border-red-900/40`}>
      {/* Visual background alert glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-red-650/5 rounded-full blur-3xl animate-pulse"></div>

      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-900/20 pb-4">
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-6 h-6 text-red-500 animate-bounce" />
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">Energy State: WAR MODE</span>
            <h2 className="text-lg font-black tracking-tight text-red-500 uppercase mt-0.5">Painel de Sobrevivência e Foco de Combate</h2>
          </div>
        </div>

        <div className="px-3.5 py-1 bg-red-950/20 border border-red-900/30 rounded-lg text-[10px] font-mono font-black text-red-400 uppercase tracking-widest animate-pulse">
          Alavancagem Máxima
        </div>
      </div>

      {/* 2. Three Critical Columns Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Financial Leakages & Overspend Alerts */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-red-950/10 pb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Alertas de Vazamento de Caixa</span>
          </div>

          {leakages.length === 0 ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-900/20 rounded-xl text-[10px] font-mono text-center text-emerald-400 leading-snug">
              ✓ NENHUM VAZAMENTO DE CAIXA: Gastos em todas as categorias estão abaixo de 80% do planejado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {leakages.map((l, i) => (
                <div key={i} className="p-3 bg-red-950/10 border border-red-900/20 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-black">
                    <span className="uppercase text-red-400">{l.category}</span>
                    <span className="text-red-500">{l.percent.toFixed(0)}% Consumido</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, l.percent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>Planejado: R$ {l.planejado.toFixed(2)}</span>
                    <span className="font-bold text-red-400">Realizado: R$ {l.realizado.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Compact Debt Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-red-950/10 pb-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Cronograma de Amortização</span>
          </div>

          {criticalDebts.length === 0 ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-900/20 rounded-xl text-[10px] font-mono text-center text-emerald-400 leading-snug">
              ✓ DÍVIDAS CASADAS: Zero faturas atrasadas ou credores ativas em aberto no momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {criticalDebts.map((d) => {
                const isOverdue = new Date(d.vencimento + 'T12:00:00') < new Date();
                return (
                  <div key={d.id} className="p-3 bg-red-950/10 border border-red-900/20 rounded-xl text-[10px] leading-relaxed flex flex-col justify-between">
                    <div className="flex justify-between font-bold border-b border-red-900/10 pb-1 mb-1">
                      <span className="truncate max-w-[120px]">{d.descricao}</span>
                      <span className={isOverdue ? 'text-red-500 animate-pulse font-black' : 'text-slate-400'}>
                        {isOverdue ? '⚠️ ATRASADA' : '📅 A VENCER'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-400 leading-none">
                      <span>Credor: {d.credor}</span>
                      <span>Vecto: {new Date(d.vencimento + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'short' })}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="font-mono text-xs font-black text-red-400">R$ {d.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="bg-red-500/10 text-red-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border border-red-500/20">{d.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Compact Urgent Kanban Board */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-red-950/10 pb-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Checklist de Combate Urgente</span>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="p-4 bg-emerald-500/5 border border-emerald-900/20 rounded-xl text-[10px] font-mono text-center text-emerald-400 leading-snug">
              ✓ TÁTICA LIMPA: Nenhuma tarefa de prioridade alta pendente no radar estratégico.
            </div>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map((t) => (
                <div key={t.id} className="p-3 bg-[#111318]/60 dark:bg-red-950/10 border border-red-900/20 rounded-xl text-[10px] leading-relaxed flex flex-col justify-between hover:border-red-500 transition duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    <span className="font-bold truncate text-slate-200 dark:text-red-100">{t.titulo}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[9px] font-mono text-slate-400">
                    <span>Prioridade: <strong className="text-red-500 font-bold uppercase">ALTA</strong></span>
                    <span>Prazo: {new Date(t.prazo + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
