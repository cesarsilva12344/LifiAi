import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ArrowDown, ArrowUp, 
  Calendar, CheckCircle, RefreshCw, Layers, Trash2 
} from 'lucide-react';
import { DatabaseState, Expense, Income } from '../types';
import { showToast } from './Toast';

interface FinanceViewProps {
  data: DatabaseState;
  onRefresh: () => void;
}

export default function FinanceView({ data, onRefresh }: FinanceViewProps) {
  const [activeLedger, setActiveLedger] = useState<'all' | 'expense' | 'income'>('all');

  const totalIncome = data.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.valor, 0);
  const totalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Preparing charts data
  // Let's create a visual list aggregating by date or by categories
  const categoriesMap: { [key: string]: number } = {};
  data.expenses.forEach(e => {
    categoriesMap[e.categoria] = (categoriesMap[e.categoria] || 0) + e.valor;
  });

  const chartDataByCategories = Object.keys(categoriesMap).map(key => ({
    name: key,
    valor: categoriesMap[key]
  }));

  // General monthly bar chart representation
  const mainFlowChartData = [
    { name: 'Previsto', Receitas: totalIncome * 1.1, Despesas: totalExpenses * 0.9 },
    { name: 'Consolidado', Receitas: totalIncome, Despesas: totalExpenses }
  ];

  // Combined ledger listing sorted by date descending
  const fullLedger: Array<{ id: string; type: 'income' | 'expense'; valor: number; categoria: string; descricao: string; data: string }> = [
    ...data.income.map(i => ({ ...i, type: 'income' as const })),
    ...data.expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.data.localeCompare(a.data));

  const filteredLedger = fullLedger.filter(item => {
    if (activeLedger === 'all') return true;
    return item.type === activeLedger;
  });

  return (
    <div className="space-y-6">
      {/* Financial high level metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Receitas Totais */}
        <div className="p-5 bg-[#111318] border border-[#1d202a] rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Reconhecimento de Receitas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">Faturamento Consolidado</span>
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="p-5 bg-[#111318] border border-[#1d202a] rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Gastos Globais</span>
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <ArrowDown className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-red-500">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">Despesas Efetuadas</span>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="p-5 bg-[#111318] border border-[#1d202a] rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Fluxo de Caixa Líquido</span>
            <div className={`p-1.5 rounded-lg ${totalBalance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <DollarSign className={`w-4 h-4 ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
          </div>
          <div className="my-3">
            <h3 className={`text-2xl font-bold font-mono ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">Soma das Contas Ativas</span>
          </div>
        </div>

        {/* Taxa de Poupança */}
        <div className="p-5 bg-[#111318] border border-[#1d202a] rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Fração de Lucro</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-blue-400">{savingsRate.toFixed(1)}%</h3>
            <span className="text-[9px] text-gray-500 font-mono uppercase tracking-wide">Conversão de Faturamento</span>
          </div>
        </div>

      </div>

      {/* Visual Recharts diagrams split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Dynamic monthly cashflow column chart */}
        <div className="col-span-1 lg:col-span-3 bg-[#111318] border border-[#1e202a] rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-[#1b1c25] pb-3 mb-4">
            <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Fluxo Mensal: Previsto vs Consolidado</span>
            <span className="text-[9px] font-mono text-gray-500">Unidade: Real (BRL)</span>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mainFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222532" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} fontStyle="mono" />
                <YAxis stroke="#6b7280" fontSize={11} fontStyle="mono" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111318', border: '1px solid #232738', color: '#fff', borderRadius: '8px', fontSize: 11 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, fontStyle: 'mono' }} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Receitas" />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses categorized donut structure */}
        <div className="col-span-1 lg:col-span-2 bg-[#111318] border border-[#1e202a] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1b1c25] pb-3 mb-4">
              <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Gasto Alocado por Categoria</h3>
            </div>
            {chartDataByCategories.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-600 font-mono">Sem gastos registrados</div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {chartDataByCategories.map((cat, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-gray-300">
                      <span className="font-medium">{cat.name}</span>
                      <span className="font-mono text-gray-400">R$ {cat.valor.toFixed(2)} ({((cat.valor / totalExpenses) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-[#1c1e28] rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full" 
                        style={{ width: `${(cat.valor / totalExpenses) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-4 pt-3 border-t border-[#1a1c25]">
            💡 Conselho do CFO: Foque em desocupar assinaturas ativas que não geram ROI diário.
          </div>
        </div>

      </div>

      {/* Structured ledger database lists */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1b1c25] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Histórico de Transações</h3>
            <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 font-mono px-2 py-0.5 rounded-full">
              {filteredLedger.length} lançamentos
            </span>
          </div>
          <div className="flex gap-1.5 bg-[#090a0d] border border-[#1d202a] rounded-lg p-0.5 select-none text-xs">
            <button
              onClick={() => setActiveLedger('all')}
              className={`px-3 py-1 rounded font-medium ${activeLedger === 'all' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveLedger('expense')}
              className={`px-3 py-1 rounded font-medium ${activeLedger === 'expense' ? 'bg-red-950/40 text-red-400' : 'text-gray-500 hover:text-white'}`}
            >
              Saídas
            </button>
            <button
              onClick={() => setActiveLedger('income')}
              className={`px-3 py-1 rounded font-medium ${activeLedger === 'income' ? 'bg-emerald-950/40 text-emerald-400' : 'text-gray-500 hover:text-white'}`}
            >
              Entradas
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-600 font-mono">Nenhum lançamento catalogado.</div>
          ) : (
            filteredLedger.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-[#090a0d] border border-[#1d202a] hover:border-[#2a2c3c] rounded-lg transition duration-200"
              >
                <div className="flex items-center gap-3 truncate pr-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="truncate">
                    <p className="text-xs text-gray-200 font-medium truncate">{item.descricao}</p>
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide lowercase">{item.categoria} | data: {item.data}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 shrink-0">
                  <span className={`font-mono text-xs font-bold ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.type === 'income' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                  </span>
                  <button
                    onClick={async () => {
                      if (confirm('Deseja realmente excluir este lançamento?')) {
                        try {
                          const collection = item.type === 'income' ? 'income' : 'expenses';
                          const res = await fetch(`/api/db/${collection}/${item.id}`, {
                            method: 'DELETE'
                          });
                          if (res.ok) {
                            showToast('Lançamento excluído!', 'success');
                            onRefresh();
                          } else {
                            showToast('Erro ao excluir lançamento.', 'error');
                          }
                        } catch (err: any) {
                          showToast(`Falha: ${err.message}`, 'error');
                        }
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition duration-200 cursor-pointer"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
