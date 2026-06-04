import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Plus, X, Landmark, 
  CreditCard, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, 
  Sliders, ChevronLeft, Award, HelpCircle, Tag as TagIcon, Trash2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { DatabaseState, Expense, Income, Category, Account, Tag, CreditCard as CreditCardType } from '../types';
import { showToast } from './Toast';

interface HomeDashboardProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function HomeDashboard({ data, onRefresh, theme = 'light' }: HomeDashboardProps) {
  // Active modal controls
  const [activeModal, setActiveModal] = useState<'expense' | 'income' | 'card' | 'category' | 'account' | 'tag' | null>(null);

  // Forms state
  const [expenseForm, setExpenseForm] = useState({
    valor: '',
    descricao: '',
    categoria_id: '',
    tipo_pagamento: 'conta', // 'conta' | 'cartao'
    conta_id: '',
    cartao_id: '',
    data: new Date().toISOString().split('T')[0],
    tag_ids: [] as string[]
  });

  const [incomeForm, setIncomeForm] = useState({
    valor: '',
    descricao: '',
    categoria_id: '',
    conta_id: '',
    data: new Date().toISOString().split('T')[0],
    tag_ids: [] as string[]
  });

  const [cardForm, setCardForm] = useState({
    nome: '',
    limite: '',
    dia_fechamento: '10',
    dia_vencimento: '17',
    cor: '#8b5cf6'
  });

  const [categoryForm, setCategoryForm] = useState({
    nome: '',
    tipo: 'despesa', // 'receita' | 'despesa'
    cor: '#3b82f6'
  });

  const [accountForm, setAccountForm] = useState({
    nome: '',
    tipo: 'corrente', // 'carteira' | 'corrente' | 'poupança' | 'investimento'
    saldo_inicial: '',
    cor: '#3b82f6'
  });

  const [tagForm, setTagForm] = useState({
    nome: '',
    cor: '#64748b'
  });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Period filter state for dashboard figures and calendar range highlight
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'year' | 'custom-month'>('month');
  const [filterMonthDate, setFilterMonthDate] = useState<Date>(new Date());

  // Active sub-management panel tab
  const [activeManagerTab, setActiveManagerTab] = useState<'categories' | 'accounts' | 'tags'>('categories');

  // Relational Helpers
  const categories = data.categories || [];
  const accounts = data.accounts || [];
  const tags = data.tags || [];
  const creditCards = data.creditCards || [];

  // Helper to filter items based on the active period (Semana, Mês, Ano, Tudo)
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
      if (timeFilter === 'custom-month') {
        return itemDate.getMonth() === filterMonthDate.getMonth() && itemDate.getFullYear() === filterMonthDate.getFullYear();
      }
      if (timeFilter === 'year') {
        return itemDate >= startOfYear && itemDate <= today;
      }
      return true;
    };

    return {
      income: data.income.filter(i => filterFunc(i.data)),
      expenses: data.expenses.filter(e => filterFunc(e.data)),
      cardExpenses: data.cardExpenses?.filter(ce => filterFunc(ce.data)) || []
    };
  };

  const filteredData = getFilteredItems();

  // Financial metrics calculations (dynamic reactive to active timeFilter)
  const totalBalance = accounts.reduce((sum, item) => sum + Number(item.saldo_atual), 0);
  const totalIncome = filteredData.income.reduce((sum, item) => sum + item.valor, 0);
  const totalExpenses = filteredData.expenses.reduce((sum, item) => sum + item.valor, 0);
  
  // Calculate total credit card bill dynamically
  const totalCardExpenses = filteredData.cardExpenses.reduce((sum, item) => sum + item.valor, 0);

  // Custom colors for premium dark vs light styling
  const c = theme === 'dark' ? {
    cardBg: 'glass-card-dark text-slate-100 shadow-md',
    titleText: 'text-white',
    subText: 'text-slate-400',
    divider: 'border-slate-800',
    inputBg: 'bg-[#0b0e14] border-[#1f2637] text-white',
    rowBg: 'bg-[#0c0f16]/60 border-[#1c2333]/80 hover:border-[#2f3a54] transition-colors',
    subtotalBg: 'bg-blue-950/20 text-[#5288c1] border-blue-900/30'
  } : {
    cardBg: 'glass-card-light text-slate-800 shadow-sm',
    titleText: 'text-slate-800',
    subText: 'text-slate-505',
    divider: 'border-slate-100',
    inputBg: 'bg-slate-50/85 border-slate-200/80 text-slate-800',
    rowBg: 'bg-white border-slate-200/80 hover:border-blue-300 transition-colors',
    subtotalBg: 'bg-slate-100/85 text-slate-650 border-slate-200/80'
  };

  // Submit operations
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    let body: any = {};

    try {
      if (activeModal === 'expense') {
        const cat = categories.find(ct => ct.id === expenseForm.categoria_id);
        
        if (expenseForm.tipo_pagamento === 'cartao') {
          url = '/api/db/card-expenses';
          body = {
            cartao_id: expenseForm.cartao_id,
            valor: parseFloat(expenseForm.valor),
            categoria: cat ? cat.nome : 'Outros',
            descricao: expenseForm.descricao || 'Despesa no Cartão',
            data: expenseForm.data,
            parcelas: 1,
            quitada: false
          };
          if (!body.cartao_id) {
            showToast('Selecione um cartão de crédito.', 'error');
            return;
          }
        } else {
          url = '/api/db/expenses/manual';
          body = {
            valor: parseFloat(expenseForm.valor),
            descricao: expenseForm.descricao || 'Despesa comum',
            categoria: cat ? cat.nome : 'Outros',
            categoria_id: expenseForm.categoria_id,
            conta_id: expenseForm.conta_id,
            data: expenseForm.data,
            tag_ids: expenseForm.tag_ids,
            quitada: true
          };
          if (!body.conta_id) {
            showToast('Selecione uma conta bancária.', 'error');
            return;
          }
        }

        if (!expenseForm.valor || isNaN(parseFloat(expenseForm.valor))) {
          showToast('Preencha um valor válido.', 'error');
          return;
        }
      } 
      
      else if (activeModal === 'income') {
        url = '/api/db/income/manual';
        const cat = categories.find(ct => ct.id === incomeForm.categoria_id);
        body = {
          valor: parseFloat(incomeForm.valor),
          descricao: incomeForm.descricao || 'Receita',
          categoria: cat ? cat.nome : 'Receitas',
          categoria_id: incomeForm.categoria_id,
          conta_id: incomeForm.conta_id,
          data: incomeForm.data,
          tag_ids: incomeForm.tag_ids,
          quitada: true
        };

        if (!incomeForm.valor || isNaN(parseFloat(incomeForm.valor)) || !incomeForm.conta_id) {
          showToast('Preencha os campos obrigatórios.', 'error');
          return;
        }
      } 
      
      else if (activeModal === 'card') {
        url = '/api/db/credit-cards';
        body = {
          nome: cardForm.nome,
          limite: parseFloat(cardForm.limite),
          dia_fechamento: parseInt(cardForm.dia_fechamento),
          dia_vencimento: parseInt(cardForm.dia_vencimento),
          cor: cardForm.cor
        };

        if (!cardForm.nome || isNaN(parseFloat(cardForm.limite))) {
          showToast('Preencha o nome e limite do cartão.', 'error');
          return;
        }
      } 
      
      else if (activeModal === 'category') {
        url = '/api/db/categories';
        body = {
          nome: categoryForm.nome,
          tipo: categoryForm.tipo,
          cor: categoryForm.cor
        };
        if (!categoryForm.nome) {
          showToast('Preencha o nome da categoria.', 'error');
          return;
        }
      } 
      
      else if (activeModal === 'account') {
        url = '/api/db/accounts';
        body = {
          nome: accountForm.nome,
          tipo: accountForm.tipo,
          saldo_inicial: parseFloat(accountForm.saldo_inicial) || 0,
          cor: accountForm.cor
        };
        if (!accountForm.nome) {
          showToast('Preencha o nome da conta.', 'error');
          return;
        }
      } 
      
      else if (activeModal === 'tag') {
        url = '/api/db/tags';
        body = {
          nome: tagForm.nome,
          cor: tagForm.cor
        };
        if (!tagForm.nome) {
          showToast('Preencha o nome da tag.', 'error');
          return;
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        showToast('Gravado com sucesso no banco relacional!', 'success');
        setActiveModal(null);
        
        // Reset forms
        setExpenseForm({ valor: '', descricao: '', categoria_id: '', tipo_pagamento: 'conta', conta_id: '', cartao_id: '', data: new Date().toISOString().split('T')[0], tag_ids: [] });
        setIncomeForm({ valor: '', descricao: '', categoria_id: '', conta_id: '', data: new Date().toISOString().split('T')[0], tag_ids: [] });
        setCardForm({ nome: '', limite: '', dia_fechamento: '10', dia_vencimento: '17', cor: '#8b5cf6' });
        setCategoryForm({ nome: '', tipo: 'despesa', cor: '#3b82f6' });
        setAccountForm({ nome: '', tipo: 'corrente', saldo_inicial: '', cor: '#3b82f6' });
        setTagForm({ nome: '', cor: '#64748b' });

        onRefresh();
      } else {
        const errData = await res.json();
        showToast(`Erro do servidor: ${errData.error}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Falha na comunicação relacional com o servidor.', 'error');
    }
  };

  // Generic deletion helper
  const handleDeleteRelation = async (collection: string, id: string) => {
    if (confirm('Deseja realmente excluir este registro? Todas as relações associadas serão preservadas ou revertidas.')) {
      try {
        const res = await fetch(`/api/db/${collection}/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast('Registro removido com sucesso!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao remover registro.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha: ${err.message}`, 'error');
      }
    }
  };

  // Generate Calendar Days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Present month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentDate);

  const getDayDotColors = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    const events = [];

    // Despesas
    const dayExpenses = data.expenses.filter(e => e.data === dayStr);
    // Receitas
    const dayIncome = data.income.filter(i => i.data === dayStr);
    // Salaries
    const daySalaries = data.salaries?.filter(s => s.data_prevista === dayStr) || [];
    // Debts
    const dayDebts = data.debts?.filter(d => d.vencimento === dayStr) || [];
    // Card Expenses
    const dayCardExpenses = data.cardExpenses?.filter(c => c.data === dayStr) || [];

    if (dayIncome.length > 0 || daySalaries.length > 0) events.push('bg-emerald-500');
    if (dayExpenses.length > 0 || dayDebts.length > 0 || dayCardExpenses.length > 0) events.push('bg-rose-500');

    return events;
  };

  const handleDayClick = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    setSelectedDayStr(dayStr);
    const dayFormatted = day.toLocaleDateString('pt-BR', { dateStyle: 'long' });

    const dayExpenses = data.expenses.filter(e => e.data === dayStr).map(e => ({ ...e, type: 'Despesa' }));
    const dayIncome = data.income.filter(i => i.data === dayStr).map(i => ({ ...i, type: 'Receita' }));
    const daySalaries = (data.salaries || []).filter(s => s.data_prevista === dayStr).map(s => ({ ...s, valor: s.valor, descricao: `Faturamento/Salário: ${s.descricao}`, type: 'Salário Agendado' }));
    const dayDebts = (data.debts || []).filter(d => d.vencimento === dayStr).map(d => ({ ...d, valor: d.saldo_atual, descricao: `Dívida: ${d.descricao} para ${d.credor}`, type: 'Dívida a Vencer' }));
    const dayCardExpenses = (data.cardExpenses || []).filter(c => c.data === dayStr).map(c => ({ ...c, type: 'Despesa Cartão' }));

    const merged = [...dayIncome, ...dayExpenses, ...daySalaries, ...dayDebts, ...dayCardExpenses];
    setSelectedDayEvents(merged);
  };

  // Projeção Preditiva a 6 Meses
  const generatePredictions = () => {
    const predictions = [];
    let cumulative = totalBalance;
    const avgMonthlyIncome = totalIncome || 8500;
    const avgMonthlyExpense = totalExpenses || 4500;
    
    // Installments card
    const cardCommitments = data.cardExpenses?.filter(ce => !ce.quitada).reduce((sum, ce) => sum + ce.valor, 0) || 0;

    const baseMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIdx = new Date().getMonth();

    for (let i = 1; i <= 6; i++) {
      const idx = (currentMonthIdx + i) % 12;
      // Linear model: Balance + Income - Expenses - Card bills due
      const cardImpact = i === 1 ? cardCommitments : cardCommitments * Math.max(0, 1 - (i * 0.2));
      cumulative = cumulative + avgMonthlyIncome - avgMonthlyExpense - (cardImpact / 3);
      
      predictions.push({
        month: baseMonths[idx],
        'Saldo Previsto': parseFloat(cumulative.toFixed(2))
      });
    }
    return predictions;
  };

  const predictionData = generatePredictions();

  // Multi-select tags toggle
  const toggleFormTag = (tagId: string, formType: 'expense' | 'income') => {
    if (formType === 'expense') {
      const active = expenseForm.tag_ids.includes(tagId);
      const next = active 
        ? expenseForm.tag_ids.filter(id => id !== tagId)
        : [...expenseForm.tag_ids, tagId];
      setExpenseForm({ ...expenseForm, tag_ids: next });
    } else {
      const active = incomeForm.tag_ids.includes(tagId);
      const next = active 
        ? incomeForm.tag_ids.filter(id => id !== tagId)
        : [...incomeForm.tag_ids, tagId];
      setIncomeForm({ ...incomeForm, tag_ids: next });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 pb-12"
    >
      {/* 1. HEADER INTEGRADO */}
      <div className={`p-6 rounded-2xl border shadow-md flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-300 ${c.cardBg}`}>
        <div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-500 uppercase">
            Mobills CFO Pro v1.50
          </span>
          <h2 className={`text-xl font-bold tracking-tight mt-1 ${c.titleText}`}>Painel de Controle Financeiro</h2>
          <p className={`text-xs mt-1 ${c.subText}`}>Gerencie contas, cartões e categorias com relacionamentos de integridade no banco de dados.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveModal('expense')}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" /> Registrar Saída
          </button>
          <button
            onClick={() => setActiveModal('income')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Registrar Entrada
          </button>
          <button 
            onClick={onRefresh}
            className="p-2 border border-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Recarregar saldos"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SELETOR DE PERÍODO GLOBAL (Corporate Modern) */}
      <div className={`p-4 rounded-2xl border transition-colors shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${c.cardBg}`}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
          <span className="text-xs font-bold font-mono uppercase text-slate-400">Escopo CFO Ativo:</span>
          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/10">
            {timeFilter === 'week' && 'Esta Semana'}
            {timeFilter === 'month' && 'Este Mês'}
            {timeFilter === 'custom-month' && filterMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            {timeFilter === 'year' && 'Este Ano'}
            {timeFilter === 'all' && 'Todo o Histórico'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Month Navigator (Calendar Filter) */}
          {(timeFilter === 'month' || timeFilter === 'custom-month') && (
            <div className={`flex items-center gap-1 rounded-xl p-0.5 border text-xs select-none ${
              theme === 'dark' ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-100 border-slate-200'
            }`}>
              <button 
                type="button"
                onClick={() => {
                  const newDate = new Date(filterMonthDate.getFullYear(), filterMonthDate.getMonth() - 1, 1);
                  setFilterMonthDate(newDate);
                  setTimeFilter('custom-month');
                }}
                className="p-1 hover:bg-slate-500/15 rounded-lg cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              </button>
              
              <span className="px-2 font-mono font-bold text-purple-500 uppercase text-[10px]">
                {filterMonthDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
              
              <button 
                type="button"
                onClick={() => {
                  const newDate = new Date(filterMonthDate.getFullYear(), filterMonthDate.getMonth() + 1, 1);
                  setFilterMonthDate(newDate);
                  setTimeFilter('custom-month');
                }}
                className="p-1 hover:bg-slate-500/15 rounded-lg cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}

          <div className={`flex gap-1 rounded-xl p-0.5 select-none text-[11px] border ${
            theme === 'dark' ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-100 border-slate-200'
          }`}>
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'week', label: 'Semana' },
              { id: 'month', label: 'Mês' },
              { id: 'year', label: 'Ano' },
            ].map((item) => {
              const isActive = timeFilter === item.id || (item.id === 'month' && timeFilter === 'custom-month');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'month') {
                      setFilterMonthDate(new Date()); // reset to current month
                    }
                    setTimeFilter(item.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer select-none ${
                    isActive 
                      ? theme === 'dark' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-blue-600 shadow-sm border border-slate-200/50' 
                      : theme === 'dark' 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. DADOS CONSOLIDADOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Saldo Líquido */}
        <div className={`p-5 rounded-2xl border transition-colors ${c.cardBg} shadow-sm border-l-4 border-l-blue-500`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase ${c.subText}`}>Saldo Disponível</span>
            <Landmark className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className={`text-xl font-black font-mono mt-2 tracking-tight ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[9px] text-slate-450 block mt-1">Soma das contas correntes</span>
        </div>

        {/* Receitas */}
        <div className={`p-5 rounded-2xl border transition-colors ${c.cardBg} shadow-sm border-l-4 border-l-emerald-500`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase ${c.subText}`}>Faturamento Total</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-xl font-black font-mono mt-2 tracking-tight text-emerald-500">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[9px] text-slate-450 block mt-1">Ganhos catalogados no mês</span>
        </div>

        {/* Despesas */}
        <div className={`p-5 rounded-2xl border transition-colors ${c.cardBg} shadow-sm border-l-4 border-l-rose-500`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase ${c.subText}`}>Despesas Pix/Débito</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-xl font-black font-mono mt-2 tracking-tight text-rose-500">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[9px] text-slate-450 block mt-1">Saídas deduzidas de saldo</span>
        </div>

        {/* Fatura total */}
        <div className={`p-5 rounded-2xl border transition-colors ${c.cardBg} shadow-sm border-l-4 border-l-purple-500`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase ${c.subText}`}>Faturas Acumuladas</span>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-xl font-black font-mono mt-2 tracking-tight text-purple-500">
            R$ {totalCardExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[9px] text-slate-450 block mt-1">Limite utilizado no cartão</span>
        </div>
      </div>

      {/* 3. CREDIT CARDS GRID (Nubank, XP) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Seus Cartões de Crédito Relacionados</h4>
          <button
            onClick={() => setActiveModal('card')}
            className="px-2.5 py-1 border border-slate-350 hover:bg-slate-150 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-800"
          >
            <Plus className="w-3 h-3" /> Adicionar Cartão
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditCards.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs font-mono text-slate-400">
              Nenhum cartão de crédito registrado.
            </div>
          ) : (
            creditCards.map((card: CreditCardType) => {
              // Calculate limit consumed per card
              const consumed = data.cardExpenses
                ?.filter(ce => ce.cartao_id === card.id && !ce.quitada)
                .reduce((sum, ce) => sum + ce.valor, 0) || 0;
              const remaining = card.limite - consumed;
              const percent = Math.min(100, (consumed / card.limite) * 100);

              const cardColor = card.cor || '#8b5cf6';
              const cardInlineStyle = {
                background: `linear-gradient(135deg, ${cardColor} 0%, #080c14 100%)`,
                borderColor: `${cardColor}40`,
                boxShadow: `0 12px 24px -10px ${cardColor}60`
              };

              return (
                <motion.div
                  key={card.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-5 rounded-2xl border relative overflow-hidden shadow-lg transition duration-300 flex flex-col justify-between min-h-[170px] text-white"
                  style={cardInlineStyle}
                >
                  {/* Digital metallic chip highlight */}
                  <div className="absolute top-5 right-5 w-8 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-md opacity-45 shadow-inner"></div>

                  <div>
                    <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">Cartão Digital CFO</span>
                    <h4 className="text-sm font-bold tracking-tight text-white mt-1">{card.nome}</h4>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="opacity-75">Limite Utilizado</span>
                      <span className="font-mono font-bold text-white">R$ {consumed.toFixed(2)}</span>
                    </div>
                    {/* Limit progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-1.5 rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: cardColor }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] opacity-75">
                      <span>Restam R$ {remaining.toFixed(2)}</span>
                      <span>Total: R$ {card.limite.toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/10 text-[9px] font-mono opacity-80">
                    <span>Fechamento: Dia {card.dia_fechamento}</span>
                    <span>Vencimento: Dia {card.dia_vencimento}</span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRelation('credit-cards', card.id); }}
                    className="absolute top-3 left-3 opacity-0 hover:opacity-100 p-1 text-red-400 hover:bg-red-950/20 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. CALENDÁRIO FINANCEIRO INTERATIVO ("dcalendar") & TENDÊNCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendário Mensal */}
        <div className={`lg:col-span-3 p-5 rounded-2xl border transition-colors ${c.cardBg} shadow-md`}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Calendário CFO & Vencimentos</h4>
              <p className="text-[9px] text-slate-400 font-mono">Monitore faturas, dividendos e recebimentos</p>
            </div>

            <div className="flex items-center gap-2 select-none">
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              </button>
              <span className="text-xs font-mono font-bold uppercase text-purple-500">
                {currentDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
              <button 
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(w => (
              <span key={w} className="font-bold text-slate-450 uppercase py-1">{w}</span>
            ))}

            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="py-2.5"></div>;

              const isToday = new Date().toDateString() === day.toDateString();
              const dots = getDayDotColors(day);

              // Check if this day is within the active filter range
              const isDayInActiveFilter = (() => {
                if (timeFilter === 'all') return true;
                const today = new Date();
                
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diff);
                startOfWeek.setHours(0,0,0,0);

                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                startOfMonth.setHours(0,0,0,0);

                const startOfYear = new Date(today.getFullYear(), 0, 1);
                startOfYear.setHours(0,0,0,0);

                const dayToCheck = new Date(day);
                dayToCheck.setHours(12, 0, 0, 0); // avoid timezone shifts
                
                if (timeFilter === 'week') {
                  return dayToCheck >= startOfWeek && dayToCheck <= today;
                }
                if (timeFilter === 'month') {
                  return dayToCheck >= startOfMonth && dayToCheck <= today;
                }
                if (timeFilter === 'year') {
                  return dayToCheck >= startOfYear && dayToCheck <= today;
                }
                return true;
              })();

              const isSelected = selectedDayStr === day.toISOString().split('T')[0];

              let dayStyle = 'bg-slate-500/5 hover:bg-slate-500/10 border-transparent';
              
              if (isToday) {
                dayStyle = 'bg-blue-600 border-blue-500 text-white font-bold shadow-md shadow-blue-500/20';
              } else if (isSelected) {
                dayStyle = theme === 'dark' 
                  ? 'bg-purple-950 border-purple-550 text-purple-400 font-bold shadow-md shadow-purple-500/20'
                  : 'bg-purple-50 border-purple-300 text-purple-750 font-bold';
              } else if (!isDayInActiveFilter) {
                dayStyle = 'opacity-30 bg-transparent border-transparent hover:opacity-55 hover:bg-slate-500/5';
              } else {
                dayStyle = theme === 'dark'
                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-300 hover:bg-blue-950/30 border-blue-900/50'
                  : 'bg-blue-50/40 border-blue-200/50 text-slate-800 hover:bg-blue-50/65';
              }

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`py-2.5 rounded-xl border flex flex-col items-center justify-between cursor-pointer select-none transition min-h-[46px] ${dayStyle}`}
                >
                  <span className="font-mono text-xs">{day.getDate()}</span>
                  
                  {/* Dynamic dots for activities/payments */}
                  <div className="flex gap-0.5 mt-1">
                    {dots.map((dot, dIdx) => (
                      <span key={dIdx} className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Popover Event List */}
          <AnimatePresence>
            {selectedDayEvents && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-purple-500">Fluxos de {selectedDayStr}:</span>
                  <button 
                    onClick={() => setSelectedDayEvents(null)}
                    className="text-[9px] font-bold uppercase font-mono text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

                {selectedDayEvents.length === 0 ? (
                  <p className="text-[11px] font-mono text-slate-400">Nenhum vencimento ou pagamento cadastrado para este dia.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedDayEvents.map((evt, idx) => {
                      const isIncome = evt.type === 'Receita' || evt.type === 'Salário Agendado';
                      return (
                        <div key={idx} className="flex justify-between items-center p-2 border border-slate-500/10 rounded-lg bg-slate-500/5 text-xs">
                          <div>
                            <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded mr-2 ${isIncome ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {evt.type}
                            </span>
                            <span className="font-bold">{evt.descricao}</span>
                          </div>
                          <span className={`font-mono font-black ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                            R$ {evt.valor.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6-Month Predictive Projections */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between transition-colors ${c.cardBg} shadow-md`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider">Tendência de Saldo (6 Meses)</h4>
              <span className="text-[9px] font-mono text-slate-450">BRL (Estimado)</span>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
              Algoritmo preditivo baseado na sua taxa de poupança atual. Projeta custos fixos e contratos parcelados.
            </p>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={predictionData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#eee'} />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={9} />
                  <YAxis stroke="#6b7280" fontSize={9} />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, backgroundColor: theme === 'dark' ? '#111' : '#fff' }} />
                  <Area type="monotone" dataKey="Saldo Previsto" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-500/10 mt-3">
            💡 <strong>Previsão de Caixa:</strong> Mantenha uma taxa de poupança acima de 25% para expandir a projeção de forma saudável.
          </div>
        </div>
      </div>

      {/* 5. DYNAMIC STRUCTURED RELATIONSHIPS MANAGER (Contas, Categorias e Tags) */}
      <div className={`p-5 rounded-2xl border shadow-md transition-colors ${c.cardBg}`}>
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveManagerTab('categories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer ${activeManagerTab === 'categories' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Categorias ({categories.length})
            </button>
            <button
              onClick={() => setActiveManagerTab('accounts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer ${activeManagerTab === 'accounts' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Contas Bancárias ({accounts.length})
            </button>
            <button
              onClick={() => setActiveManagerTab('tags')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition select-none cursor-pointer ${activeManagerTab === 'tags' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}
            >
              Tags ({tags.length})
            </button>
          </div>

          <div>
            {activeManagerTab === 'categories' && (
              <button onClick={() => setActiveModal('category')} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm">
                <Plus className="w-3 h-3" /> Nova Categoria
              </button>
            )}
            {activeManagerTab === 'accounts' && (
              <button onClick={() => setActiveModal('account')} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm">
                <Plus className="w-3 h-3" /> Nova Conta
              </button>
            )}
            {activeManagerTab === 'tags' && (
              <button onClick={() => setActiveModal('tag')} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm">
                <Plus className="w-3 h-3" /> Nova Tag
              </button>
            )}
          </div>
        </div>

        {/* Manager Contents */}
        <div className="min-h-[140px]">
          {/* Categories Tab Content */}
          {activeManagerTab === 'categories' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {categories.map((cat: Category) => (
                <div 
                  key={cat.id} 
                  className="p-3 border border-slate-500/10 rounded-xl bg-slate-500/5 flex items-center justify-between transition hover:border-slate-500/30"
                >
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.cor }}></span>
                    <span className="truncate">{cat.nome}</span>
                  </span>
                  <button 
                    onClick={() => handleDeleteRelation('categories', cat.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-500/10 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Accounts Tab Content */}
          {activeManagerTab === 'accounts' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {accounts.map((acc: Account) => (
                <div 
                  key={acc.id} 
                  className="p-4 border border-slate-500/10 rounded-xl bg-slate-500/5 flex flex-col justify-between transition hover:border-slate-500/30 min-h-[90px] relative group"
                >
                  <div>
                    <span className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.cor }}></span>
                      {acc.nome}
                    </span>
                    <span className="text-[9px] uppercase font-mono text-slate-400 block mt-0.5">{acc.tipo}</span>
                  </div>
                  <h4 className="text-sm font-black font-mono text-slate-700 dark:text-slate-200 mt-2">
                    R$ {acc.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h4>

                  <button 
                    onClick={() => handleDeleteRelation('accounts', acc.id)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-500/10 transition opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tags Tab Content */}
          {activeManagerTab === 'tags' && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: Tag) => (
                <span 
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-500/15 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${tag.cor}10`, color: tag.cor, borderColor: `${tag.cor}30` }}
                >
                  <TagIcon className="w-3 h-3" />
                  {tag.nome}
                  <button 
                    onClick={() => handleDeleteRelation('tags', tag.id)}
                    className="hover:bg-slate-500/20 rounded-full p-0.5 cursor-pointer ml-1 text-slate-400 hover:text-slate-800"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. SYSTEM MODAL DIALOGUES (RELATIONAL REGISTER FORMS) */}
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
                theme === 'dark' ? 'glass-card-dark text-slate-200 border-slate-700/80 shadow-2xl' : 'bg-white border-slate-200/80 text-slate-800 shadow-xl'
              }`}
            >
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-xs font-bold mb-4 tracking-wide font-mono uppercase text-blue-500">
                {activeModal === 'expense' && 'Registrar Saída / Despesa'}
                {activeModal === 'income' && 'Registrar Entrada / Receita'}
                {activeModal === 'card' && 'Cadastrar Cartão de Crédito'}
                {activeModal === 'category' && 'Cadastrar Nova Categoria'}
                {activeModal === 'account' && 'Criar Nova Conta Bancária'}
                {activeModal === 'tag' && 'Criar Nova Tag'}
              </h3>

              <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
                {/* 6.1 REGISTER EXPENSE */}
                {activeModal === 'expense' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Valor (R$)*</label>
                      <input 
                        type="number" step="0.01" required placeholder="0.00"
                        value={expenseForm.valor}
                        onChange={e => setExpenseForm({...expenseForm, valor: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 transition font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Descrição</label>
                      <input 
                        type="text" placeholder="Ex: Almoço Executivo"
                        value={expenseForm.descricao}
                        onChange={e => setExpenseForm({...expenseForm, descricao: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </div>
                    
                    {/* Payment Method Selector */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Método de Pagamento</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setExpenseForm({ ...expenseForm, tipo_pagamento: 'conta' })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            expenseForm.tipo_pagamento === 'conta' 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-250 text-slate-500'
                          }`}
                        >
                          Conta Bancária
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpenseForm({ ...expenseForm, tipo_pagamento: 'cartao' })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            expenseForm.tipo_pagamento === 'cartao' 
                              ? 'bg-purple-500 text-white border-purple-500' 
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-250 text-slate-500'
                          }`}
                        >
                          Cartão de Crédito
                        </button>
                      </div>
                    </div>

                    {expenseForm.tipo_pagamento === 'conta' ? (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Conta Origem*</label>
                        <select
                          required
                          value={expenseForm.conta_id}
                          onChange={e => setExpenseForm({ ...expenseForm, conta_id: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="">Selecione a Conta</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.nome} (Saldo: R$ {acc.saldo_atual})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Cartão Destino*</label>
                        <select
                          required
                          value={expenseForm.cartao_id}
                          onChange={e => setExpenseForm({ ...expenseForm, cartao_id: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="">Selecione o Cartão</option>
                          {creditCards.map(card => (
                            <option key={card.id} value={card.id}>{card.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Categoria*</label>
                        <select
                          required
                          value={expenseForm.categoria_id}
                          onChange={e => setExpenseForm({ ...expenseForm, categoria_id: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="">Selecione...</option>
                          {categories.filter(c => c.tipo === 'despesa').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Data</label>
                        <input 
                          type="date"
                          value={expenseForm.data}
                          onChange={e => setExpenseForm({...expenseForm, data: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-rose-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 transition font-mono"
                        />
                      </div>
                    </div>

                    {/* Tag picker checklist */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Tags Relacionadas</label>
                      <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto border border-slate-500/10 p-2 rounded-lg">
                        {tags.map(tag => {
                          const isSelected = expenseForm.tag_ids.includes(tag.id);
                          return (
                            <button
                              type="button"
                              key={tag.id}
                              onClick={() => toggleFormTag(tag.id, 'expense')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer select-none ${
                                isSelected 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-slate-50/20 text-slate-500 border-slate-300'
                              }`}
                            >
                              {tag.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 6.2 REGISTER INCOME */}
                {activeModal === 'income' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Valor (R$)*</label>
                      <input 
                        type="number" step="0.01" required placeholder="0.00"
                        value={incomeForm.valor}
                        onChange={e => setIncomeForm({...incomeForm, valor: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-mono font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Descrição</label>
                      <input 
                        type="text" placeholder="Ex: Faturamento Consultoria"
                        value={incomeForm.descricao}
                        onChange={e => setIncomeForm({...incomeForm, descricao: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Conta Destino*</label>
                      <select
                        required
                        value={incomeForm.conta_id}
                        onChange={e => setIncomeForm({ ...incomeForm, conta_id: e.target.value })}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                      >
                        <option value="">Selecione...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.nome} (Saldo: R$ {acc.saldo_atual})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Categoria*</label>
                        <select
                          required
                          value={incomeForm.categoria_id}
                          onChange={e => setIncomeForm({ ...incomeForm, categoria_id: e.target.value })}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="">Selecione...</option>
                          {categories.filter(c => c.tipo === 'receita').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Data</label>
                        <input 
                          type="date"
                          value={incomeForm.data}
                          onChange={e => setIncomeForm({...incomeForm, data: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-emerald-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Tags Relacionadas</label>
                      <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto border border-slate-500/10 p-2 rounded-lg">
                        {tags.map(tag => {
                          const isSelected = incomeForm.tag_ids.includes(tag.id);
                          return (
                            <button
                              type="button"
                              key={tag.id}
                              onClick={() => toggleFormTag(tag.id, 'income')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer select-none ${
                                isSelected 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : 'bg-slate-50/20 text-slate-500 border-slate-300'
                              }`}
                            >
                              {tag.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 6.3 REGISTER CREDIT CARD */}
                {activeModal === 'card' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome do Cartão*</label>
                      <input 
                        type="text" required placeholder="Ex: Nubank Ultravioleta"
                        value={cardForm.nome}
                        onChange={e => setCardForm({...cardForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Limite Total (R$)*</label>
                      <input 
                        type="number" required placeholder="0"
                        value={cardForm.limite}
                        onChange={e => setCardForm({...cardForm, limite: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Dia Fechamento*</label>
                        <input 
                          type="number" min={1} max={31} required
                          value={cardForm.dia_fechamento}
                          onChange={e => setCardForm({...cardForm, dia_fechamento: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Dia Vencimento*</label>
                        <input 
                          type="number" min={1} max={31} required
                          value={cardForm.dia_vencimento}
                          onChange={e => setCardForm({...cardForm, dia_vencimento: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Cor do Cartão / Banco*</label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {[
                          { name: 'Nubank (Roxo)', color: '#8b5cf6' },
                          { name: 'Inter (Laranja)', color: '#f97316' },
                          { name: 'PicPay (Verde)', color: '#10b981' },
                          { name: 'XP (Preto/Dourado)', color: '#1e293b' },
                          { name: 'Itaú (Azul)', color: '#2563eb' },
                          { name: 'Santander (Vermelho)', color: '#ef4444' },
                          { name: 'Banco do Brasil (Amarelo)', color: '#eab308' },
                          { name: 'Neon (Ciano)', color: '#14b8a6' },
                        ].map((preset) => (
                          <button
                            key={preset.color}
                            type="button"
                            onClick={() => setCardForm({ ...cardForm, cor: preset.color })}
                            className="w-6 h-6 rounded-full border transition cursor-pointer flex items-center justify-center relative"
                            style={{ backgroundColor: preset.color, borderColor: cardForm.cor === preset.color ? '#ffffff' : 'transparent' }}
                            title={preset.name}
                          >
                            {cardForm.cor === preset.color && (
                              <span className="w-2 h-2 rounded-full bg-white shadow-sm animate-pulse"></span>
                            )}
                          </button>
                        ))}
                        <input
                          type="color"
                          value={cardForm.cor || '#8b5cf6'}
                          onChange={e => setCardForm({ ...cardForm, cor: e.target.value })}
                          className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer bg-transparent"
                          title="Cor personalizada"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 6.4 CREATE CATEGORY */}
                {activeModal === 'category' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome da Categoria*</label>
                      <input 
                        type="text" required placeholder="Ex: Supermercado"
                        value={categoryForm.nome}
                        onChange={e => setCategoryForm({...categoryForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Tipo*</label>
                        <select
                          required
                          value={categoryForm.tipo}
                          onChange={e => setCategoryForm({...categoryForm, tipo: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="despesa">Saída / Despesa</option>
                          <option value="receita">Entrada / Receita</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Cor (Hex)*</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="color"
                            value={categoryForm.cor}
                            onChange={e => setCategoryForm({...categoryForm, cor: e.target.value})}
                            className="w-8 h-8 rounded-lg cursor-pointer border-transparent"
                          />
                          <input 
                            type="text" required placeholder="#3b82f6"
                            value={categoryForm.cor}
                            onChange={e => setCategoryForm({...categoryForm, cor: e.target.value})}
                            className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 6.5 CREATE ACCOUNT */}
                {activeModal === 'account' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome da Conta*</label>
                      <input 
                        type="text" required placeholder="Ex: Banco do Brasil C.C."
                        value={accountForm.nome}
                        onChange={e => setAccountForm({...accountForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Tipo*</label>
                        <select
                          required
                          value={accountForm.tipo}
                          onChange={e => setAccountForm({...accountForm, tipo: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-slate-800 focus:outline-none transition"
                        >
                          <option value="corrente">Conta Corrente</option>
                          <option value="carteira">Carteira / Dinheiro</option>
                          <option value="poupança">Poupança</option>
                          <option value="investimento">Investimentos</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Saldo Inicial (R$)</label>
                        <input 
                          type="number" step="0.01" placeholder="0.00"
                          value={accountForm.saldo_inicial}
                          onChange={e => setAccountForm({...accountForm, saldo_inicial: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Cor Representativa</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color"
                          value={accountForm.cor}
                          onChange={e => setAccountForm({...accountForm, cor: e.target.value})}
                          className="w-8 h-8 rounded-lg cursor-pointer border-transparent"
                        />
                        <input 
                          type="text" placeholder="#3b82f6"
                          value={accountForm.cor}
                          onChange={e => setAccountForm({...accountForm, cor: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 6.6 CREATE TAG */}
                {activeModal === 'tag' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Nome da Tag*</label>
                      <input 
                        type="text" required placeholder="Ex: ViagemEUA"
                        value={tagForm.nome}
                        onChange={e => setTagForm({...tagForm, nome: e.target.value})}
                        className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-semibold">Cor (Hex)*</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color"
                          value={tagForm.cor}
                          onChange={e => setTagForm({...tagForm, cor: e.target.value})}
                          className="w-8 h-8 rounded-lg cursor-pointer border-transparent"
                        />
                        <input 
                          type="text" required placeholder="#64748b"
                          value={tagForm.cor}
                          onChange={e => setTagForm({...tagForm, cor: e.target.value})}
                          className="w-full bg-slate-50/50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Modal actions */}
                <div className="pt-4 flex gap-3 font-mono font-bold uppercase tracking-wider text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-250 dark:border-slate-700 rounded-xl text-slate-650 dark:text-slate-350 transition duration-200 cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition duration-200 cursor-pointer text-center"
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
