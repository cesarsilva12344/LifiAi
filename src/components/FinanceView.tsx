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
import MobillsView from './MobillsView';

interface FinanceViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function FinanceView({ data, onRefresh, theme = 'light' }: FinanceViewProps) {
  const [activeLedger, setActiveLedger] = useState<'all' | 'expense' | 'income'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [viewMode, setViewMode] = useState<'standard' | 'mobills'>('standard');

  // Filter incomes and expenses based on selected period
  const getFilteredItems = () => {
    const today = new Date();
    
    // Start of current week (Monday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
    startOfWeek.setHours(0,0,0,0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0,0,0,0);

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    startOfYear.setHours(0,0,0,0);

    const filterFunc = (itemDateStr: string) => {
      if (timeFilter === 'all') return true;
      const itemDate = new Date(itemDateStr + 'T12:00:00'); // avoid timezone shifts
      if (timeFilter === 'week') {
        return itemDate >= startOfWeek && itemDate <= today;
      }
      if (timeFilter === 'month') {
        return itemDate >= startOfMonth && itemDate <= today;
      }
      if (timeFilter === 'year') {
        return itemDate >= startOfYear && itemDate <= today;
      }
      return true;
    };

    return {
      income: data.income.filter(i => filterFunc(i.data)),
      expenses: data.expenses.filter(e => filterFunc(e.data))
    };
  };

  const filteredData = getFilteredItems();

  const totalIncome = filteredData.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = filteredData.expenses.reduce((sum, item) => sum + item.valor, 0);
  const totalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Preparing charts data
  const categoriesMap: { [key: string]: number } = {};
  filteredData.expenses.forEach(e => {
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
  const fullLedger = [
    ...filteredData.income.map(i => ({ ...i, type: 'income' as const })),
    ...filteredData.expenses.map(e => ({ ...e, type: 'expense' as const }))
  ].sort((a, b) => b.data.localeCompare(a.data));

  const filteredLedger = fullLedger.filter(item => {
    if (activeLedger === 'all') return true;
    return item.type === activeLedger;
  });

  // Dynamic colors for dark vs light premium
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1d202a] text-slate-100',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1c25]',
    formBg: 'bg-[#090a0d] border-[#1d202a]',
    rowBg: 'bg-[#090a0d] border-[#1d202a] hover:border-[#2a2c3c]',
    chartGrid: '#222532',
    tooltipBg: '#111318',
    tooltipBorder: '#232738',
    tooltipText: '#fff'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800',
    titleText: 'text-slate-800',
    subText: 'text-slate-500',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    formBg: 'bg-slate-50 border-slate-200',
    rowBg: 'bg-white border-slate-200 hover:border-slate-350',
    chartGrid: '#cbd5e1',
    tooltipBg: '#ffffff',
    tooltipBorder: '#cbd5e1',
    tooltipText: '#0f172a'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  if (viewMode === 'mobills') {
    return (
      <div className="space-y-6">
        <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${c.cardBg} shadow-sm`}>
          <div>
            <span className="text-[9px] font-mono font-black text-blue-500 tracking-wider uppercase">Contabilidade Consolidada</span>
            <h2 className={`text-lg font-black tracking-tight mt-0.5 ${c.titleText}`}>Lançamentos & Fluxo de Caixa</h2>
            <p className={`text-xs mt-0.5 ${c.subText}`}>Consulte o histórico transacional relacional, gerencie categorias e filtre por períodos.</p>
          </div>

          <div className="flex gap-0.5 rounded-xl p-0.5 select-none text-[11px] border bg-slate-500/5 border-slate-500/10 self-start md:self-auto">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                viewMode === 'standard' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Padrão
            </button>
            <button
              onClick={() => setViewMode('mobills')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                viewMode === 'mobills' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Visualização Mobills
            </button>
          </div>
        </div>

        <MobillsView data={data} onRefresh={onRefresh} theme={theme} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header period filter selector */}
      <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${c.cardBg} shadow-sm`}>
        <div>
          <span className="text-[9px] font-mono font-black text-blue-500 tracking-wider uppercase">Contabilidade Consolidada</span>
          <h2 className={`text-lg font-black tracking-tight mt-0.5 ${c.titleText}`}>Lançamentos & Fluxo de Caixa</h2>
          <p className={`text-xs mt-0.5 ${c.subText}`}>Consulte o histórico transacional relacional, gerencie categorias e filtre por períodos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* View Toggler */}
          <div className="flex gap-0.5 rounded-xl p-0.5 select-none text-[11px] border bg-slate-500/5 border-slate-500/10">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                viewMode === 'standard' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Padrão
            </button>
            <button
              onClick={() => setViewMode('mobills')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                viewMode === 'mobills' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Visualização Mobills
            </button>
          </div>

          {/* Period filter buttons */}
          <div className={`flex gap-1 rounded-xl p-0.5 select-none text-xs border ${
            theme === 'dark' ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'year', label: 'Ano' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTimeFilter(item.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                  timeFilter === item.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Financial high level metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Receitas Totais */}
        <div className={`p-5 rounded-xl border relative overflow-hidden transition-colors ${c.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${c.subText}`}>Reconhecimento de Receitas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ArrowUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-emerald-500">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className={`text-[9px] font-mono uppercase tracking-wide ${c.mutedText}`}>Faturamento Consolidado</span>
          </div>
        </div>

        {/* Despesas Totais */}
        <div className={`p-5 rounded-xl border relative overflow-hidden transition-colors ${c.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${c.subText}`}>Gastos Globais</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <ArrowDown className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-rose-500">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className={`text-[9px] font-mono uppercase tracking-wide ${c.mutedText}`}>Despesas Efetuadas</span>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className={`p-5 rounded-xl border relative overflow-hidden transition-colors ${c.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${c.subText}`}>Fluxo de Caixa Líquido</span>
            <div className={`p-1.5 rounded-lg ${totalBalance >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              <DollarSign className={`w-4 h-4 ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
            </div>
          </div>
          <div className="my-3">
            <h3 className={`text-2xl font-bold font-mono ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className={`text-[9px] font-mono uppercase tracking-wide ${c.mutedText}`}>Soma das Contas Ativas</span>
          </div>
        </div>

        {/* Taxa de Poupança */}
        <div className={`p-5 rounded-xl border relative overflow-hidden transition-colors ${c.cardBg}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${c.subText}`}>Fração de Lucro</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-bold font-mono text-blue-500">{savingsRate.toFixed(1)}%</h3>
            <span className={`text-[9px] font-mono uppercase tracking-wide ${c.mutedText}`}>Conversão de Faturamento</span>
          </div>
        </div>

      </div>

      {/* 2. Visual Recharts diagrams split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Dynamic monthly cashflow column chart */}
        <div className={`col-span-1 lg:col-span-3 rounded-xl p-5 border transition-colors ${c.cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-4 ${c.divider}`}>
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${c.titleText}`}>Fluxo Mensal: Previsto vs Consolidado</span>
            <span className={`text-[9px] font-mono ${c.subText}`}>Unidade: BRL</span>
          </div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={mainFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.chartGrid} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, color: c.tooltipText, borderRadius: '8px', fontSize: 11 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Receitas" />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} name="Despesas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses categorized donut structure */}
        <div className={`col-span-1 lg:col-span-2 rounded-xl p-5 border flex flex-col justify-between transition-colors ${c.cardBg}`}>
          <div>
            <div className={`border-b pb-3 mb-4 ${c.divider}`}>
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${c.titleText}`}>Gasto Alocado por Categoria</h3>
            </div>
            {chartDataByCategories.length === 0 ? (
              <div className={`py-20 text-center text-xs font-mono ${c.subText}`}>Sem despesas registradas</div>
            ) : (
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {chartDataByCategories.map((cat, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{cat.name}</span>
                      <span className={`font-mono ${c.subText}`}>R$ {cat.valor.toFixed(2)} ({((cat.valor / totalExpenses) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-1.5 rounded-full" 
                        style={{ width: `${(cat.valor / totalExpenses) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={`text-[10px] font-mono mt-4 pt-3 border-t ${c.divider} ${c.subText}`}>
            💡 CFO: Monitore custos e otimize o caixa.
          </div>
        </div>

      </div>

      {/* 2.5 Income Breakdown & Validation Analysis */}
      <div className={`rounded-xl p-5 border transition-all duration-200 ${c.cardBg}`}>
        <div className={`flex items-center justify-between border-b pb-3 mb-4 ${c.divider}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${c.titleText}`}>Distribuição de Receitas: Fixo vs Adicional</h3>
          </div>
          <span className={`text-[9px] font-mono ${c.subText}`}>Validação de Caixa Consolidado</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Table representing Fixed vs Variable Streams */}
          <div className="space-y-4">
            <h4 className={`text-xs font-bold uppercase font-mono tracking-wider ${c.subText}`}>Detalhamento dos Fluxos de Entrada</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className={`border-b ${c.divider} text-slate-450 font-mono`}>
                    <th className="py-2 pr-2 uppercase">Categoria</th>
                    <th className="py-2 px-2 uppercase">Tipo</th>
                    <th className="py-2 px-2 text-right uppercase">Previsto</th>
                    <th className="py-2 px-2 text-right uppercase">Realizado</th>
                    <th className="py-2 pl-2 text-right uppercase">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Salário Principal */}
                  <tr className={`border-b ${c.divider} hover:bg-slate-500/5 transition`}>
                    <td className="py-2.5 pr-2 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Salário CLT / Fixo</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-blue-500 uppercase font-bold text-[10px]">Fixo</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">R$ 8.500,00</td>
                    <td className={`py-2.5 px-2 text-right font-mono font-black ${c.titleText}`}>
                      R$ {filteredData.income.filter(i => i.categoria.toLowerCase() === 'salário').reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-slate-400">
                      {((filteredData.income.filter(i => i.categoria.toLowerCase() === 'salário').reduce((sum, item) => sum + item.valor, 0) / (totalIncome || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>

                  {/* Row 2: Consultorias e Freelance */}
                  <tr className={`border-b ${c.divider} hover:bg-slate-500/5 transition`}>
                    <td className="py-2.5 pr-2 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Consultoria / Freelance</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-emerald-500 uppercase font-bold text-[10px]">Adicional</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">R$ 5.000,00</td>
                    <td className={`py-2.5 px-2 text-right font-mono font-black ${c.titleText}`}>
                      R$ {filteredData.income.filter(i => ['consultoria', 'freelance', 'freelancer', 'mentoria'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-slate-400">
                      {((filteredData.income.filter(i => ['consultoria', 'freelance', 'freelancer', 'mentoria'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0) / (totalIncome || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>

                  {/* Row 3: Micro-SaaS e Dividendos */}
                  <tr className={`border-b ${c.divider} hover:bg-slate-500/5 transition`}>
                    <td className="py-2.5 pr-2 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Micro-SaaS / Dividendos</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-purple-500 uppercase font-bold text-[10px]">Adicional</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">R$ 2.000,00</td>
                    <td className={`py-2.5 px-2 text-right font-mono font-black ${c.titleText}`}>
                      R$ {filteredData.income.filter(i => ['saas', 'dividendos', 'micro-saas', 'rendimentos'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-slate-400">
                      {((filteredData.income.filter(i => ['saas', 'dividendos', 'micro-saas', 'rendimentos'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0) / (totalIncome || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>

                  {/* Row 4: Outros Recebimentos */}
                  <tr className={`border-b ${c.divider} hover:bg-slate-500/5 transition`}>
                    <td className="py-2.5 pr-2 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Outros Rendimentos</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-550 uppercase font-bold text-[10px]">Adicional</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-400">R$ 500,00</td>
                    <td className={`py-2.5 px-2 text-right font-mono font-black ${c.titleText}`}>
                      R$ {filteredData.income.filter(i => !['salário', 'consultoria', 'freelance', 'freelancer', 'saas', 'dividendos', 'micro-saas', 'rendimentos', 'mentoria'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-slate-405">
                      {((filteredData.income.filter(i => !['salário', 'consultoria', 'freelance', 'freelancer', 'saas', 'dividendos', 'micro-saas', 'rendimentos', 'mentoria'].includes(i.categoria.toLowerCase())).reduce((sum, item) => sum + item.valor, 0) / (totalIncome || 1)) * 100).toFixed(0)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick analysis comparison boxes */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase font-mono tracking-wider ${c.subText}`}>Alavancagem Financeira (CFO Panel)</h4>
              
              <div className={`p-4 rounded-xl border transition-colors duration-200 ${theme === 'dark' ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className={c.subText}>Total Fixo (Salário CLT):</span>
                  <span className={`font-mono font-bold ${c.titleText}`}>
                    R$ {filteredData.income.filter(i => i.categoria.toLowerCase() === 'salário').reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <span className={c.subText}>Total Dinheiro Adicional (Extras):</span>
                  <span className="font-mono font-bold text-emerald-500">
                    R$ {filteredData.income.filter(i => i.categoria.toLowerCase() !== 'salário').reduce((sum, item) => sum + item.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-lg border text-[11px] leading-relaxed transition-colors duration-200 ${theme === 'dark' ? 'bg-[#121c16] border-[#1a3821] text-emerald-400' : 'bg-emerald-50 border-emerald-250 text-emerald-700'}`}>
                <strong>📊 Proporção Dinâmica:</strong> Seu dinheiro adicional representa <strong className="font-mono font-black">{((filteredData.income.filter(i => i.categoria.toLowerCase() !== 'salário').reduce((sum, item) => sum + item.valor, 0) / (totalIncome || 1)) * 100).toFixed(0)}%</strong> de todas as receitas do mês. Essa forte diversificação garante uma blindagem e permite acelerar seus investimentos em novas ideias de software!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Structured ledger database lists */}
      <div className={`rounded-xl p-5 border transition-colors ${c.cardBg}`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 mb-4 ${c.divider}`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${c.titleText}`}>Histórico de Transações</h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              {filteredLedger.length} lançamentos
            </span>
          </div>
          <div className={`flex gap-1.5 rounded-lg p-0.5 select-none text-xs border ${
            theme === 'dark' ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveLedger('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                activeLedger === 'all' 
                  ? (theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 shadow-sm') 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveLedger('expense')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                activeLedger === 'expense' 
                  ? 'bg-rose-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-rose-500'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setActiveLedger('income')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                activeLedger === 'income' 
                  ? 'bg-emerald-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-emerald-500'
              }`}
            >
              Entradas
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {filteredLedger.length === 0 ? (
            <div className={`text-center py-12 text-xs font-mono ${c.subText}`}>Nenhum lançamento catalogado.</div>
          ) : (
            filteredLedger.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-3.5 border rounded-lg transition duration-200 ${c.rowBg}`}
              >
                <div className="flex items-center gap-3 truncate pr-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="truncate">
                    <p className={`text-xs font-bold truncate ${c.titleText}`}>{item.descricao}</p>
                    <span className={`text-[9px] font-mono tracking-wide lowercase ${c.subText}`}>{item.categoria} | data: {item.data}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 shrink-0">
                  <span className={`font-mono text-xs font-black ${item.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
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
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition duration-200 cursor-pointer"
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
