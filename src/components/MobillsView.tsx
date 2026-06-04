import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, ArrowDown, ArrowUp, 
  Calendar, CheckCircle, RefreshCw, Layers, Trash2, Landmark, 
  CreditCard, ChevronRight, CheckCircle2, AlertCircle, Sliders, 
  ChevronLeft, Award, HelpCircle, Tag as TagIcon, Plus, X, Settings,
  Check, ArrowRightLeft
} from 'lucide-react';
import { DatabaseState, Expense, Income, Account, CreditCard as CreditCardType, Goal, Category } from '../types';
import { showToast } from './Toast';

interface MobillsViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function MobillsView({ data, onRefresh, theme = 'light' }: MobillsViewProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'contas' | 'transacoes' | 'cartoes' | 'objetivos' | 'relatorios' | 'configuracoes'>('contas');
  
  // Sub-tabs for Credit Cards
  const [cardFilter, setCardFilter] = useState<'abertas' | 'fechadas'>('abertas');
  
  // Sub-tabs for Goals
  const [goalFilter, setGoalFilter] = useState<'andamento' | 'concluidos'>('andamento');

  // Sub-tabs for Reports
  const [reportType, setReportType] = useState<'categoria' | 'diario' | 'balanco'>('categoria');

  // Month selector state (defaults to June 2026)
  const [selectedMonth, setSelectedMonth] = useState(5); // June (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);

  const PORTUGUESE_MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleToggleStatus = async (tx: any) => {
    let url = '';
    if (tx.txType === 'income') {
      url = `/api/db/income/${tx.id}`;
    } else if (tx.txType === 'expense') {
      url = `/api/db/expenses/${tx.id}`;
    } else if (tx.txType === 'cardInvoice') {
      url = `/api/db/card-expenses/${tx.id}`;
    }

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quitada: !tx.quitada })
      });
      if (res.ok) {
        showToast('Situação atualizada!', 'success');
        onRefresh();
      } else {
        showToast('Erro ao atualizar situação.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      showToast('Importando dados da planilha...', 'info');
      try {
        const res = await fetch('/api/db/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText: text })
        });
        if (res.ok) {
          const data = await res.json();
          showToast(`Importação concluída! ${data.totalImported} itens processados.`, 'success');
          onRefresh();
        } else {
          showToast('Erro ao importar planilha. Verifique a formatação.', 'error');
        }
      } catch (err: any) {
        showToast(`Erro na comunicação: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState<Account | null>(null);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showNewTxModal, setShowNewTxModal] = useState<'expense' | 'income' | null>(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    nome: '',
    tipo: 'corrente' as Account['tipo'],
    saldo_inicial: '',
    cor: '#3b82f6'
  });

  const [goalForm, setGoalForm] = useState({
    titulo: '',
    meta: '',
    prazo: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
  });

  const [txForm, setTxForm] = useState({
    valor: '',
    descricao: '',
    categoria: '',
    conta_id: '',
    cartao_id: '',
    data: new Date().toISOString().split('T')[0],
    isCard: false
  });

  // Load configuration for dashboard widgets from userProfile.preferencias
  // We use this string array to save the customized toggled checklist
  const visibleWidgets = data.userProfile.preferencias || [];

  // Save visibility checkboxes
  const handleToggleWidget = async (widgetId: string) => {
    let updatedList = [...visibleWidgets];
    if (updatedList.includes(widgetId)) {
      updatedList = updatedList.filter(id => id !== widgetId);
    } else {
      updatedList.push(widgetId);
    }

    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferencias: updatedList })
      });
      if (res.ok) {
        showToast('Configurações salvas no perfil!', 'success');
        onRefresh();
      } else {
        showToast('Erro ao atualizar configurações.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  // ----------------------------------------------------
  // FINANCIAL CALCULATIONS & DATA COMPILING
  // ----------------------------------------------------
  const accounts = data.accounts || [];
  const creditCards = data.creditCards || [];
  const expenses = data.expenses || [];
  const income = data.income || [];
  const cardExpenses = data.cardExpenses || [];
  const goals = data.goals || [];

  // Saldo Atual Consolidado
  const currentTotalBalance = accounts.reduce((sum, acc) => sum + Number(acc.saldo_atual), 0);

  // Incomes / Expenses pending calculations
  const pendingIncomes = income.filter(i => !i.quitada).reduce((s, i) => s + i.valor, 0);
  const pendingExpenses = expenses.filter(e => !e.quitada).reduce((s, e) => s + e.valor, 0);
  
  // Credit cards active balance
  const activeCardsFaturaTotal = cardExpenses.filter(ce => !ce.quitada).reduce((s, ce) => s + ce.valor, 0);

  // Saldo Previsto (Calculado a partir do Saldo Atual + Receitas Pendentes - Despesas Pendentes - Faturas Abertas)
  const predictedTotalBalance = currentTotalBalance + pendingIncomes - pendingExpenses - activeCardsFaturaTotal;

  // Reusable styling classes
  const isDark = theme === 'dark';
  const c = isDark ? {
    cardBg: 'bg-[#111318] border-[#1d202a] text-slate-100',
    titleText: 'text-white',
    subText: 'text-slate-400',
    divider: 'border-[#1b1c25]',
    formBg: 'bg-[#090a0d] border-[#1d202a]',
    inputBg: 'bg-[#0b0e14] border-[#1f2637] text-white',
    rowBg: 'bg-[#090a0d] border-[#1d202a] hover:border-[#2a2c3c] transition-all',
    modalBg: 'bg-[#111318] border-[#1e2230]',
    accentColor: '#8b5cf6',
  } : {
    cardBg: 'bg-white border-slate-200 text-slate-800',
    titleText: 'text-slate-800',
    subText: 'text-slate-500',
    divider: 'border-slate-100',
    formBg: 'bg-slate-50 border-slate-200',
    inputBg: 'bg-slate-50/85 border-slate-250 text-slate-800',
    rowBg: 'bg-white border-slate-200 hover:border-slate-350 transition-all',
    modalBg: 'bg-white border-slate-200',
    accentColor: '#6366f1',
  };

  // Submit functions
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.nome.trim()) return showToast('Nome da conta é obrigatório.', 'error');
    
    try {
      const res = await fetch('/api/db/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: accountForm.nome,
          tipo: accountForm.tipo,
          saldo_inicial: parseFloat(accountForm.saldo_inicial) || 0,
          cor: accountForm.cor
        })
      });
      if (res.ok) {
        showToast('Conta criada com sucesso!', 'success');
        setAccountForm({ nome: '', tipo: 'corrente', saldo_inicial: '', cor: '#3b82f6' });
        setShowNewAccountModal(false);
        onRefresh();
      } else {
        showToast('Falha ao criar conta.', 'error');
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message}`, 'error');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.titulo.trim() || !goalForm.meta) return showToast('Título e Meta são obrigatórios.', 'error');

    try {
      const res = await fetch('/api/db/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: goalForm.titulo,
          meta: parseFloat(goalForm.meta),
          prazo: goalForm.prazo
        })
      });
      if (res.ok) {
        showToast('Objetivo cadastrado com sucesso!', 'success');
        setGoalForm({ titulo: '', meta: '', prazo: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0] });
        setShowNewGoalModal(false);
        onRefresh();
      } else {
        showToast('Falha ao registrar objetivo.', 'error');
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message}`, 'error');
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.valor || isNaN(parseFloat(txForm.valor))) return showToast('Valor válido é obrigatório.', 'error');

    let url = '/api/db/expenses/manual';
    let body: any = {
      valor: parseFloat(txForm.valor),
      descricao: txForm.descricao || (showNewTxModal === 'expense' ? 'Despesa' : 'Receita'),
      categoria: txForm.categoria || 'Geral',
      data: txForm.data,
      quitada: true
    };

    if (showNewTxModal === 'income') {
      url = '/api/db/income/manual';
      body.conta_id = txForm.conta_id || accounts[0]?.id;
    } else {
      if (txForm.isCard) {
        url = '/api/db/card-expenses';
        body.cartao_id = txForm.cartao_id || creditCards[0]?.id;
        body.quitada = false;
        body.parcelas = 1;
        if (!body.cartao_id) return showToast('Cadastre um cartão de crédito primeiro.', 'error');
      } else {
        body.conta_id = txForm.conta_id || accounts[0]?.id;
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
        setTxForm({ valor: '', descricao: '', categoria: '', conta_id: '', cartao_id: '', data: new Date().toISOString().split('T')[0], isCard: false });
        setShowNewTxModal(null);
        onRefresh();
      } else {
        showToast('Erro ao registrar lançamento.', 'error');
      }
    } catch (err: any) {
      showToast(`Erro: ${err.message}`, 'error');
    }
  };

  const handlePayCardBill = async (cardId: string) => {
    // Pay fatura = marks all unpaid card expenses of this card as paid, and optionally deducts the amount from an account
    const unpaidExpenses = cardExpenses.filter(ce => ce.cartao_id === cardId && !ce.quitada);
    if (unpaidExpenses.length === 0) return showToast('Esta fatura já está zerada.', 'info');

    const totalValue = unpaidExpenses.reduce((s, ce) => s + ce.valor, 0);
    const firstAccount = accounts[0];

    if (!firstAccount) return showToast('Nenhuma conta disponível para debitar o pagamento.', 'error');

    if (confirm(`Deseja pagar a fatura de R$ ${totalValue.toFixed(2)} debitando da conta "${firstAccount.nome}"?`)) {
      try {
        // 1. Mark each card expense as paid
        for (const ce of unpaidExpenses) {
          await fetch(`/api/db/card-expenses/${ce.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quitada: true })
          });
        }
        
        // 2. Create a checking account expense of category "Fatura" to represent the actual payment debit
        await fetch('/api/db/expenses/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valor: totalValue,
            categoria: 'Assinaturas',
            descricao: `Pagamento Fatura ${creditCards.find(c => c.id === cardId)?.nome || 'Cartão'}`,
            conta_id: firstAccount.id,
            quitada: true
          })
        });

        showToast('Fatura paga e saldo da conta atualizado!', 'success');
        onRefresh();
      } catch (err: any) {
        showToast(`Erro no pagamento: ${err.message}`, 'error');
      }
    }
  };

  const handleDeleteEntity = async (collection: string, id: string) => {
    if (confirm('Deseja realmente remover este item?')) {
      try {
        const res = await fetch(`/api/db/${collection}/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Registro excluído!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao excluir.', 'error');
        }
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & View Toggle (already handled in FinanceView, but this is the container wrapper) */}
      <div className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 ${c.cardBg} shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/10 text-violet-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-violet-500 font-mono">Modo Executivo</span>
              <h2 className={`text-lg font-black tracking-tight mt-0.5 ${c.titleText}`}>Visualização Mobills PRO</h2>
              <p className={`text-xs ${c.subText}`}>Navegação em abas, extratos diários, faturas e controle de visibilidade de cartões.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowNewTxModal('expense')}
              className="px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingDown className="w-3.5 h-3.5" /> Nova Despesa
            </button>
            <button
              onClick={() => setShowNewTxModal('income')}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Nova Receita
            </button>
          </div>
        </div>

        {/* Dynamic Horizontal Subnavigation */}
        <div className={`flex flex-wrap gap-1 mt-5 pt-4 border-t ${c.divider} text-xs font-bold`}>
          {[
            { id: 'contas', label: '🏦 Contas' },
            { id: 'transacoes', label: '📝 Transações' },
            { id: 'cartoes', label: '💳 Cartões' },
            { id: 'objetivos', label: '🎯 Objetivos' },
            { id: 'relatorios', label: '📊 Relatórios' },
            { id: 'configuracoes', label: '⚙️ Configurações' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition cursor-pointer select-none ${
                activeTab === tab.id 
                  ? 'bg-violet-600 text-white shadow-md' 
                  : `text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-500/5`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dynamic Content Render based on ActiveTab */}
      <div className="transition-all duration-300">
        
        {/* ====================================================
            TAB: CONTAS
            ==================================================== */}
        {activeTab === 'contas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-black uppercase tracking-wider ${c.titleText}`}>Minhas Contas</h3>
                <button
                  onClick={() => setShowNewAccountModal(true)}
                  className="px-2.5 py-1.5 border border-slate-350 hover:bg-slate-500/5 rounded-xl text-[10px] font-black transition flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <Plus className="w-3 h-3" /> Nova Conta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.length === 0 ? (
                  <div className={`col-span-2 p-12 text-center text-xs font-mono border rounded-2xl ${c.cardBg}`}>
                    Nenhuma conta bancária registrada no sistema.
                  </div>
                ) : (
                  accounts.map((acc: Account) => {
                    const accExpenses = expenses.filter(e => e.conta_id === acc.id);
                    const accIncomes = income.filter(i => i.conta_id === acc.id);
                    
                    return (
                      <div
                        key={acc.id}
                        onClick={() => setShowAccountModal(acc)}
                        className={`p-5 rounded-2xl border cursor-pointer select-none transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden ${c.cardBg}`}
                        style={{ borderLeft: `5px solid ${acc.cor || '#3b82f6'}` }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">{acc.tipo}</span>
                            <h4 className="text-sm font-bold tracking-tight mt-0.5">{acc.nome}</h4>
                          </div>
                          <span className="text-slate-400 group-hover:text-violet-500 transition">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>

                        <div className="mt-4">
                          <span className="text-[10px] opacity-75 block">Saldo Atual</span>
                          <span className={`text-lg font-black font-mono ${Number(acc.saldo_atual) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            R$ {Number(acc.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntity('accounts', acc.id);
                            }}
                            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border transition-colors shadow-md space-y-5 ${c.cardBg}`}>
                <div className={`border-b pb-3 ${c.divider}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider">Resumo Consolidado</h4>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <span className="text-[10px] uppercase font-bold text-blue-500 font-mono block">Saldo Atual Total</span>
                    <h3 className={`text-xl font-black font-mono mt-1 ${currentTotalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      R$ {currentTotalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-violet-500 font-mono block">Saldo Previsto Final do Mês</span>
                      <div className="relative group">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 w-48 p-2 rounded bg-slate-900 text-white text-[9px] leading-tight font-medium opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 shadow-lg">
                          Calculado como: Saldo Atual + Receitas Pendentes - Despesas Pendentes - Faturas em Aberto.
                        </div>
                      </div>
                    </div>
                    <h3 className={`text-xl font-black font-mono mt-1 ${predictedTotalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      R$ {predictedTotalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-slate-500/10">
                    <span className="opacity-75">Receitas a Confirmar:</span>
                    <span className="font-mono font-bold text-emerald-500">+R$ {pendingIncomes.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-slate-500/10">
                    <span className="opacity-75">Despesas a Pagar:</span>
                    <span className="font-mono font-bold text-rose-500">-R$ {pendingExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5">
                    <span className="opacity-75">Faturas de Cartão Abertas:</span>
                    <span className="font-mono font-bold text-purple-500">-R$ {activeCardsFaturaTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-500/10 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">Open Finance Ativo & Seguro</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB: TRANSAÇÕES (Extrato Mensal com Filtro de Meses e Faturas)
            ==================================================== */}
        {activeTab === 'transacoes' && (() => {
          const monthFilterStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
          
          // Dynamic Monthly Calculations
          const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.saldo_atual), 0);
          
          const monthIncomes = income.filter(i => i.data.startsWith(monthFilterStr));
          const totalReceitas = monthIncomes.reduce((sum, i) => sum + i.valor, 0);
          
          const monthExpenses = expenses.filter(e => e.data.startsWith(monthFilterStr) && !e.descricao.toLowerCase().startsWith('pagamento fatura'));
          const monthCardInvoices = cardExpenses.filter(ce => ce.data.startsWith(monthFilterStr));
          const totalDespesas = monthExpenses.reduce((sum, e) => sum + e.valor, 0) + monthCardInvoices.reduce((sum, ce) => sum + ce.valor, 0);
          
          const balancoMensal = totalReceitas - totalDespesas;
          
          // Combine all month items
          const monthTxs = [
            ...monthIncomes.map(i => ({ ...i, txType: 'income' as const, quitada: i.quitada ?? true })),
            ...monthExpenses.map(e => ({ ...e, txType: 'expense' as const, quitada: e.quitada ?? true })),
            ...monthCardInvoices.map(ce => ({ ...ce, txType: 'cardInvoice' as const, quitada: ce.quitada ?? true, conta_id: undefined }))
          ].sort((a, b) => b.data.localeCompare(a.data));

          return (
            <div className={`p-5 rounded-2xl border transition-colors shadow-md ${c.cardBg}`}>
              
              {/* Header section with CSV upload & new buttons */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 mb-5">
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${c.titleText}`}>Extrato Detalhado</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Movimentações consolidadas de {PORTUGUESE_MONTHS[selectedMonth]} {selectedYear}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs items-center">
                  {/* CSV Upload Button */}
                  <label className="px-3 py-1.5 border border-dashed border-violet-500 hover:bg-violet-500/5 rounded-xl transition font-bold text-violet-500 cursor-pointer flex items-center gap-1.5 select-none">
                    <Upload className="w-3.5 h-3.5" />
                    Subir Planilha CSV
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setShowNewTxModal('expense')}
                    className="px-2.5 py-1.5 border border-slate-350 hover:bg-slate-500/5 rounded-xl transition font-bold text-rose-500 cursor-pointer"
                  >
                    - Nova Despesa
                  </button>
                  <button
                    onClick={() => setShowNewTxModal('income')}
                    className="px-2.5 py-1.5 border border-slate-350 hover:bg-slate-500/5 rounded-xl transition font-bold text-emerald-500 cursor-pointer"
                  >
                    + Nova Receita
                  </button>
                </div>
              </div>

              {/* Month Navigator */}
              <div className="flex items-center justify-center gap-4 my-2">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1.5 rounded-xl border border-slate-500/10 hover:bg-slate-500/5 text-violet-600 transition select-none cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-5 py-1.5 rounded-full bg-violet-600/5 border border-violet-600/15 font-black text-xs text-violet-600 tracking-wide select-none font-mono">
                  {PORTUGUESE_MONTHS[selectedMonth]} {selectedYear}
                </div>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1.5 rounded-xl border border-slate-500/10 hover:bg-slate-500/5 text-violet-600 transition select-none cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
                {/* Card 1: Saldo atual */}
                <div className={`p-4 rounded-xl border ${c.cardBg} flex items-center gap-3.5 shadow-sm`}>
                  <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-500">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Saldo atual</span>
                    <span className={`text-sm font-black font-mono ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Card 2: Receitas */}
                <div className={`p-4 rounded-xl border ${c.cardBg} flex items-center gap-3.5 shadow-sm`}>
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-500">
                    <ArrowUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Receitas</span>
                    <span className="text-sm font-black font-mono text-emerald-500">
                      R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Card 3: Despesas */}
                <div className={`p-4 rounded-xl border ${c.cardBg} flex items-center gap-3.5 shadow-sm`}>
                  <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-500">
                    <ArrowDown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Despesas</span>
                    <span className="text-sm font-black font-mono text-rose-500">
                      R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Card 4: Balanço Mensal */}
                <div className={`p-4 rounded-xl border ${c.cardBg} flex items-center gap-3.5 shadow-sm`}>
                  <div className={`p-2.5 rounded-lg ${balancoMensal >= 0 ? 'bg-teal-500/15 text-teal-500' : 'bg-rose-500/15 text-rose-500'}`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Balanço mensal</span>
                    <span className={`text-sm font-black font-mono ${balancoMensal >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                      R$ {balancoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-500/10 shadow-sm mt-4">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${c.divider} bg-slate-500/5 text-slate-500 font-mono font-bold uppercase tracking-wider`}>
                      <th className="py-3 px-4 w-12 text-center">Situação</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Conta/Cartão</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-500/5">
                    {monthTxs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-mono font-bold">
                          Nenhuma transação cadastrada para este mês.
                        </td>
                      </tr>
                    ) : (
                      monthTxs.map((tx: any) => {
                        const isIncome = tx.txType === 'income';
                        const isCard = tx.txType === 'cardInvoice';
                        const isOverdue = !tx.quitada && new Date(tx.data + 'T12:00:00') <= new Date();

                        let accountLabel = 'Outros';
                        if (isCard) {
                          accountLabel = creditCards.find(cc => cc.id === tx.cartao_id)?.nome || 'Cartão de Crédito';
                        } else {
                          accountLabel = accounts.find(acc => acc.id === tx.conta_id)?.nome || 'Sem Conta';
                        }

                        return (
                          <tr key={tx.id} className={`hover:bg-slate-500/5 transition font-medium text-slate-705 dark:text-slate-200`}>
                            {/* Situação column */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleToggleStatus(tx)}
                                className="p-1 rounded-full hover:bg-slate-500/10 transition cursor-pointer inline-flex items-center justify-center"
                                title={tx.quitada ? 'Marcar como pendente' : 'Marcar como pago'}
                              >
                                {tx.quitada ? (
                                  <span className="w-5 h-5 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                ) : (
                                  <span className={`w-5 h-5 ${isOverdue ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-amber-500/10 text-amber-500'} rounded-full flex items-center justify-center`}>
                                    <AlertCircle className="w-3 h-3 stroke-[3]" />
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Data column */}
                            <td className="py-3 px-4 font-mono">
                              {new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </td>

                            {/* Descrição column */}
                            <td className="py-3 px-4 font-bold">
                              {tx.descricao}
                            </td>

                            {/* Categoria column */}
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold">
                                {tx.categoria}
                              </span>
                            </td>

                            {/* Conta column */}
                            <td className="py-3 px-4 font-bold text-slate-500 dark:text-slate-400">
                              {accountLabel}
                            </td>

                            {/* Valor column */}
                            <td className={`py-3 px-4 text-right font-mono font-black ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isIncome ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>

                            {/* Ações column */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteEntity(
                                  isCard ? 'card-expenses' : isIncome ? 'income' : 'expenses',
                                  tx.id
                                )}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded transition duration-200 cursor-pointer"
                                title="Excluir transação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ====================================================
            TAB: CARTÕES (Faturas, limites e pagamentos)
            ==================================================== */}
        {activeTab === 'cartoes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              
              {/* Tabs selector */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 rounded-xl p-0.5 bg-slate-500/5 border border-slate-500/10 text-xs font-bold select-none">
                  <button
                    onClick={() => setCardFilter('abertas')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      cardFilter === 'abertas' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Faturas abertas
                  </button>
                  <button
                    onClick={() => setCardFilter('fechadas')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      cardFilter === 'fechadas' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Faturas fechadas
                  </button>
                </div>
              </div>

              {/* Cards Listing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creditCards.length === 0 ? (
                  <div className={`col-span-2 p-12 text-center text-xs font-mono border rounded-2xl ${c.cardBg}`}>
                    Nenhum cartão de crédito cadastrado.
                  </div>
                ) : (
                  creditCards.map((card: CreditCardType) => {
                    // Calculate totals based on filter
                    const isClosed = cardFilter === 'fechadas';
                    
                    const cardExps = cardExpenses.filter(ce => ce.cartao_id === card.id && ce.quitada === isClosed);
                    const consumed = cardExps.reduce((sum, ce) => sum + ce.valor, 0);
                    
                    const percent = Math.min(100, (consumed / card.limite) * 100);
                    const remaining = card.limite - consumed;

                    const hasOverdueExps = cardExpenses.some(ce => ce.cartao_id === card.id && !ce.quitada && new Date(ce.data + 'T12:00:00') <= new Date());

                    const cardColor = card.cor || '#8b5cf6';
                    const gradientBg = `linear-gradient(135deg, ${cardColor} 0%, #060910 100%)`;

                    return (
                      <div
                        key={card.id}
                        className="rounded-2xl border relative overflow-hidden shadow-lg p-5 flex flex-col justify-between min-h-[220px] text-white transition-all hover:scale-[1.02]"
                        style={{ background: gradientBg, borderColor: `${cardColor}30` }}
                      >
                        {/* Metallic chip */}
                        <div className="absolute top-5 right-5 w-8 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded opacity-40 shadow-inner"></div>

                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono tracking-widest uppercase opacity-75">Cartão Digital</span>
                            
                            {hasOverdueExps && (
                              <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[8px] uppercase tracking-wider animate-pulse">
                                Fatura Vencida
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-sm font-bold tracking-tight text-white mt-1">{card.nome}</h4>
                        </div>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="opacity-75">Fatura Atual</span>
                            <span className="font-mono font-black text-white">R$ {consumed.toFixed(2)}</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: cardColor }}></div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] opacity-75">
                            <span>Disponível R$ {remaining.toFixed(2)}</span>
                            <span>Total R$ {card.limite.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                          <span className="text-[9px] opacity-75">Fechamento: Dia {card.dia_fechamento}</span>
                          
                          <button
                            onClick={() => handlePayCardBill(card.id)}
                            className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-[9px] font-black tracking-wider uppercase transition cursor-pointer"
                          >
                            Pagar Fatura
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Credit cards summary sidebar */}
            <div className="space-y-4">
              <div className={`p-5 rounded-2xl border transition-colors shadow-md space-y-5 ${c.cardBg}`}>
                <div className={`border-b pb-3 ${c.divider}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider">Resumo Faturas</h4>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <span className="text-[10px] uppercase font-bold text-purple-500 font-mono block">Valor Total de Faturas Abertas</span>
                    <h3 className="text-xl font-black font-mono mt-1 text-purple-500">
                      R$ {activeCardsFaturaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <span className="text-[10px] uppercase font-bold text-blue-500 font-mono block">Limite Disponível Total</span>
                    <h3 className="text-xl font-black font-mono mt-1 text-blue-500">
                      R$ {creditCards.reduce((sum, c) => {
                        const consumed = cardExpenses.filter(ce => ce.cartao_id === c.id && !ce.quitada).reduce((s, ce) => s + ce.valor, 0);
                        return sum + (c.limite - consumed);
                      }, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            TAB: OBJETIVOS (Metas financeiras)
            ==================================================== */}
        {activeTab === 'objetivos' && (
          <div className="space-y-5">
            {/* Filter buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 rounded-xl p-0.5 bg-slate-500/5 border border-slate-500/10 text-xs font-bold select-none">
                <button
                  onClick={() => setGoalFilter('andamento')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    goalFilter === 'andamento' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Em Andamento
                </button>
                <button
                  onClick={() => setGoalFilter('concluidos')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    goalFilter === 'concluidos' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Concluídos
                </button>
              </div>

              <button
                onClick={() => setShowNewGoalModal(true)}
                className="px-3.5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Criar Novo Objetivo
              </button>
            </div>

            {/* Goals list */}
            {(() => {
              const activeGoals = goals.filter(g => {
                const percent = (g.progresso / g.meta) * 100;
                return goalFilter === 'concluidos' ? percent >= 100 : percent < 100;
              });

              if (activeGoals.length === 0) {
                return (
                  <div className={`p-10 rounded-2xl border flex flex-col items-center justify-center text-center space-y-4 ${c.cardBg}`}>
                    {/* SVG Illustration clone from screenshot */}
                    <div className="w-48 h-36 bg-slate-500/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      <Landmark className="w-16 h-16 text-violet-500 opacity-20" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-violet-600 text-white rounded-2xl shadow-lg">
                        <Plus className="w-6 h-6" />
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-base font-bold ${c.titleText}`}>Definindo objetivos você alcança seus sonhos mais rápido!</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">Que tal criar um para te ajudar?</p>
                    </div>

                    <button
                      onClick={() => setShowNewGoalModal(true)}
                      className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                    >
                      CRIAR NOVO OBJETIVO
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeGoals.map((g: Goal) => {
                    const percent = Math.min(100, Math.round((g.progresso / g.meta) * 100));
                    return (
                      <div key={g.id} className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[160px] relative ${c.cardBg}`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-black tracking-tight">{g.titulo}</h4>
                            <span className="text-[10px] font-black font-mono text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/10">
                              {percent}%
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1">Prazo: {g.prazo}</span>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-[10px] opacity-75 font-mono">
                            <span>Progresso: R$ {g.progresso.toFixed(2)}</span>
                            <span>Meta: R$ {g.meta.toFixed(2)}</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-2 bg-slate-500/10 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-600 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>

                        {/* Quick Update progress bar slider input */}
                        <div className="mt-4 pt-3 border-t border-slate-500/5 flex items-center justify-between gap-2">
                          <input
                            type="range"
                            min="0"
                            max={g.meta}
                            value={g.progresso}
                            onChange={async (e) => {
                              const val = parseFloat(e.target.value);
                              try {
                                await fetch('/api/db/goals/progress', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: g.id, progresso: val })
                                });
                                onRefresh();
                              } catch (err: any) {
                                console.error(err);
                              }
                            }}
                            className="w-full accent-violet-600 cursor-pointer"
                          />
                          <button
                            onClick={() => handleDeleteEntity('goals', g.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ====================================================
            TAB: RELATÓRIOS (Gráficos)
            ==================================================== */}
        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            {/* Format selector */}
            <div className="flex gap-1 rounded-xl p-0.5 bg-slate-500/5 border border-slate-500/10 text-xs font-bold select-none self-start inline-flex">
              <button
                onClick={() => setReportType('categoria')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportType === 'categoria' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Rosca Categoria
              </button>
              <button
                onClick={() => setReportType('diario')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportType === 'diario' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Curva Diária
              </button>
              <button
                onClick={() => setReportType('balanco')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  reportType === 'balanco' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                Balanço Mensal
              </button>
            </div>

            {/* Donut Chart: Despesas por Categoria */}
            {reportType === 'categoria' && (
              <div className={`p-5 rounded-2xl border transition-colors shadow-md ${c.cardBg}`}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Piechart */}
                  <div className="lg:col-span-3 h-80 flex flex-col justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(() => {
                            const map: Record<string, number> = {};
                            expenses.forEach(e => { map[e.categoria] = (map[e.categoria] || 0) + e.valor; });
                            return Object.keys(map).map((k, idx) => ({
                              name: k,
                              value: map[k],
                              color: ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'][idx % 9]
                            }));
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {expenses.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'][index % 9]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Middle amount display */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Despesa Total</span>
                      <h3 className={`text-lg font-black font-mono ${c.titleText}`}>
                        R$ {expenses.reduce((s, e) => s + e.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                  </div>

                  {/* Right side list details */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
                    <h4 className="text-xs font-black uppercase font-mono tracking-wider">Distribuição por Categoria</h4>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {(() => {
                        const total = expenses.reduce((s, e) => s + e.valor, 0) || 1;
                        const map: Record<string, number> = {};
                        expenses.forEach(e => { map[e.categoria] = (map[e.categoria] || 0) + e.valor; });
                        
                        return Object.keys(map).map((key, idx) => {
                          const val = map[key];
                          const pct = (val / total) * 100;
                          const color = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'][idx % 9];
                          
                          return (
                            <div key={key} className="space-y-1 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                                  {key}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  R$ {val.toFixed(2)} ({pct.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-500/10 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Line Chart: Daily curves */}
            {reportType === 'diario' && (
              <div className={`p-5 rounded-2xl border transition-colors shadow-md ${c.cardBg}`}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          const dailyMap: Record<string, number> = {};
                          expenses.forEach(e => {
                            const date = new Date(e.data + 'T12:00:00').getDate();
                            dailyMap[date] = (dailyMap[date] || 0) + e.valor;
                          });
                          return Array.from({ length: 30 }, (_, i) => ({
                            day: i + 1,
                            'Despesas': dailyMap[i + 1] || 0
                          }));
                        })()}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222532' : '#cbd5e1'} />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={10} label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5 }} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sidebar list of daily data */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
                    <h4 className="text-xs font-black uppercase font-mono tracking-wider">Lançamentos por Dia</h4>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {(() => {
                        const dailyMap: Record<string, number> = {};
                        expenses.forEach(e => {
                          const date = e.data;
                          dailyMap[date] = (dailyMap[date] || 0) + e.valor;
                        });

                        const sortedDates = Object.keys(dailyMap).sort((a,b) => b.localeCompare(a));
                        return sortedDates.map(date => (
                          <div key={date} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-500/5">
                            <span className="font-bold">{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            <span className="font-mono text-rose-500 font-bold">R$ {dailyMap[date].toFixed(2)}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Columns chart: Balanço mensal */}
            {reportType === 'balanco' && (
              <div className={`p-5 rounded-2xl border transition-colors shadow-md ${c.cardBg}`}>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Consolidado', Receitas: income.reduce((s,i)=>s+i.valor, 0), Despesas: expenses.reduce((s,e)=>s+e.valor,0) }
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#222532' : '#cbd5e1'} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
                        <YAxis stroke="#6b7280" fontSize={10} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50} />
                        <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sidebar stats breakdown */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
                    <h4 className="text-xs font-black uppercase font-mono tracking-wider">Resumo Caixa</h4>
                    
                    <div className="p-4 rounded-xl bg-slate-500/5 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="opacity-75">Ganhos Globais:</span>
                        <span className="font-mono text-emerald-500 font-bold">R$ {income.reduce((s,i)=>s+i.valor, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-75">Gastos Globais:</span>
                        <span className="font-mono text-rose-500 font-bold">R$ {expenses.reduce((s,e)=>s+e.valor, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-500/10 pt-2 font-bold">
                        <span>Balanço Líquido:</span>
                        <span className={`font-mono ${(income.reduce((s,i)=>s+i.valor, 0) - expenses.reduce((s,e)=>s+e.valor, 0)) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          R$ {(income.reduce((s,i)=>s+i.valor, 0) - expenses.reduce((s,e)=>s+e.valor, 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ====================================================
            TAB: CONFIGURAÇÕES (Visibility Checklist)
            ==================================================== */}
        {activeTab === 'configuracoes' && (
          <div className={`p-6 rounded-2xl border transition-colors shadow-md ${c.cardBg}`}>
            <div className="border-b pb-3 mb-5">
              <h3 className={`text-sm font-black uppercase tracking-wider ${c.titleText}`}>Configurações de Cartões do Dashboard</h3>
              <p className="text-xs text-slate-400">Selecione quais cartões ou widgets informativos você deseja ocultar ou exibir na sua tela inicial.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold text-slate-650 dark:text-slate-300">
              
              {/* Left Column widgets */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-violet-500">Cards da Esquerda</h4>
                
                {[
                  { id: 'wdg_expenses_by_category', label: 'Mostrar gráfico de despesas por categoria?' },
                  { id: 'wdg_expense_frequency', label: 'Mostrar gráfico de frequência de gastos?' },
                  { id: 'wdg_monthly_balance', label: 'Mostrar gráfico do balanço mensal?' },
                  { id: 'wdg_pending_txs', label: 'Mostrar transações pendentes?' },
                  { id: 'wdg_budget_summary', label: 'Mostrar resumo do orçamento do mês atual?' },
                  { id: 'wdg_favorite_txs', label: 'Mostrar transações favoritas?' },
                  { id: 'wdg_calendar_widget', label: 'Mostrar calendário de Movimentações?' },
                  { id: 'wdg_my_accounts_list', label: 'Mostrar minhas contas?' },
                ].map(widget => {
                  const isChecked = visibleWidgets.includes(widget.id);
                  return (
                    <label key={widget.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-500/10 bg-slate-500/5 cursor-pointer hover:border-violet-500/30 transition">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleWidget(widget.id)}
                        className="w-4 h-4 rounded text-violet-600 border-slate-350 focus:ring-violet-500 cursor-pointer"
                      />
                      <span>{widget.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Right Column widgets */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase font-mono tracking-widest text-violet-500">Cards da Direita</h4>
                
                {[
                  { id: 'wdg_income_by_category', label: 'Mostrar gráfico de receitas por categoria?' },
                  { id: 'wdg_semiannual_balance', label: 'Mostrar gráfico do balanço semestral?' },
                  { id: 'wdg_quarterly_balance', label: 'Mostrar gráfico do balanço trimestral?' },
                  { id: 'wdg_credit_cards_info', label: 'Mostrar informações de cartão de crédito?' },
                  { id: 'wdg_goals_list', label: 'Mostrar seus objetivos?' },
                  { id: 'wdg_savings_pct', label: 'Mostrar informações da economia no mês atual?' },
                  { id: 'wdg_profile_info', label: 'Mostrar informações de perfil?' },
                ].map(widget => {
                  const isChecked = visibleWidgets.includes(widget.id);
                  return (
                    <label key={widget.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-500/10 bg-slate-500/5 cursor-pointer hover:border-violet-500/30 transition">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleWidget(widget.id)}
                        className="w-4 h-4 rounded text-violet-600 border-slate-350 focus:ring-violet-500 cursor-pointer"
                      />
                      <span>{widget.label}</span>
                    </label>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ====================================================
          MODALS POPUPS
          ==================================================== */}
      
      {/* Account detail modal popup */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 relative shadow-2xl ${c.modalBg}`}>
            <button
              onClick={() => setShowAccountModal(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-500/10 rounded-full cursor-pointer text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pt-2">
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-70">Detalhes da conta</span>
              <h3 className="text-lg font-black mt-1">{showAccountModal.nome}</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-500/5 border border-slate-500/10 text-center">
                <span className="text-[10px] opacity-75 block font-mono">Saldo Atual</span>
                <h2 className="text-2xl font-black font-mono mt-1 text-violet-500">
                  R$ {Number(showAccountModal.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span className="text-[9px] text-slate-400 block mt-1">Última sincronização: hoje às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <div className="flex justify-between items-center py-2 border-b border-slate-500/5">
                  <span className="opacity-75">Tipo de conta:</span>
                  <strong className="capitalize">{showAccountModal.tipo}</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-500/5">
                  <span className="opacity-75">Quantidade de despesas:</span>
                  <strong className="text-rose-500">{expenses.filter(e => e.conta_id === showAccountModal.id).length} despesas</strong>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-500/5">
                  <span className="opacity-75">Quantidade de receitas:</span>
                  <strong className="text-emerald-500">{income.filter(i => i.conta_id === showAccountModal.id).length} receitas</strong>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="opacity-75 font-bold">Incluir na soma da tela inicial?</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New account modal */}
      {showNewAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 relative shadow-2xl ${c.modalBg}`}>
            <button onClick={() => setShowNewAccountModal(false)} className="absolute top-4 right-4 p-1 hover:bg-slate-500/10 rounded-full cursor-pointer text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black uppercase tracking-wider">Nova Conta Bancária</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cadastre uma nova carteira ou conta relacional.</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider">Nome da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: Santander C.Corrente"
                  value={accountForm.nome}
                  onChange={(e) => setAccountForm({ ...accountForm, nome: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Tipo</label>
                  <select
                    value={accountForm.tipo}
                    onChange={(e) => setAccountForm({ ...accountForm, tipo: e.target.value as any })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="carteira">Dinheiro / Carteira</option>
                    <option value="poupança">Poupança</option>
                    <option value="investimento">Investimento</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={accountForm.saldo_inicial}
                    onChange={(e) => setAccountForm({ ...accountForm, saldo_inicial: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider block">Cor de Identificação</label>
                <div className="flex gap-2.5">
                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccountForm({ ...accountForm, cor: color })}
                      className="w-7 h-7 rounded-full transition flex items-center justify-center border border-white/10 cursor-pointer"
                      style={{ backgroundColor: color }}
                    >
                      {accountForm.cor === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                CRIAR CONTA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New goal modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 relative shadow-2xl ${c.modalBg}`}>
            <button onClick={() => setShowNewGoalModal(false)} className="absolute top-4 right-4 p-1 hover:bg-slate-500/10 rounded-full cursor-pointer text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black uppercase tracking-wider">Criar objetivo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Selecione uma categoria predefinida ou crie uma personalizada.</p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Fundo de emergência', icon: '🏦' },
                { label: 'Novo carro', icon: '🚗' },
                { label: 'Nova casa', icon: '🏠' },
                { label: 'Reforma', icon: '🛠️' },
                { label: 'Viagem nas férias', icon: '✈️' },
                { label: 'Gastos médicos', icon: '🩺' },
                { label: 'Pagar uma dívida', icon: '💳' },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setGoalForm({ ...goalForm, titulo: preset.label })}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition hover:border-violet-500 hover:bg-violet-500/5 text-left cursor-pointer ${
                    goalForm.titulo === preset.label ? 'border-violet-600 bg-violet-600/10 text-violet-500' : 'border-slate-500/10'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span className="font-semibold">{preset.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 pt-3 border-t border-slate-500/5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider">Título do Objetivo</label>
                <input
                  type="text"
                  placeholder="Ex: Fundo de emergência"
                  value={goalForm.titulo}
                  onChange={(e) => setGoalForm({ ...goalForm, titulo: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Meta (Valor Alvo)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 10.000,00"
                    value={goalForm.meta}
                    onChange={(e) => setGoalForm({ ...goalForm, meta: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Prazo Conclusão</label>
                  <input
                    type="date"
                    value={goalForm.prazo}
                    onChange={(e) => setGoalForm({ ...goalForm, prazo: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                CRIAR OBJETIVO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New transaction modal */}
      {showNewTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 relative shadow-2xl ${c.modalBg}`}>
            <button onClick={() => setShowNewTxModal(null)} className="absolute top-4 right-4 p-1 hover:bg-slate-500/10 rounded-full cursor-pointer text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black uppercase tracking-wider">
                {showNewTxModal === 'expense' ? 'Registrar Despesa' : 'Registrar Receita'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Cadastre lançamentos manuais estruturados no banco de dados.</p>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  value={txForm.valor}
                  onChange={(e) => setTxForm({ ...txForm, valor: e.target.value })}
                  className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Uber ou Almoço"
                    value={txForm.descricao}
                    onChange={(e) => setTxForm({ ...txForm, descricao: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Transporte"
                    value={txForm.categoria}
                    onChange={(e) => setTxForm({ ...txForm, categoria: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>
              </div>

              {showNewTxModal === 'expense' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider block">Método de Pagamento</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, isCard: false })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        !txForm.isCard ? 'bg-violet-600/10 text-violet-500 border-violet-600' : 'border-slate-500/10'
                      }`}
                    >
                      🏦 Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxForm({ ...txForm, isCard: true })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        txForm.isCard ? 'bg-violet-600/10 text-violet-500 border-violet-600' : 'border-slate-500/10'
                      }`}
                    >
                      💳 Cartão Crédito
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {(!txForm.isCard || showNewTxModal === 'income') ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Conta Vinculada</label>
                    <select
                      value={txForm.conta_id}
                      onChange={(e) => setTxForm({ ...txForm, conta_id: e.target.value })}
                      className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                    >
                      <option value="">Selecione...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.nome}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider">Cartão Utilizado</label>
                    <select
                      value={txForm.cartao_id}
                      onChange={(e) => setTxForm({ ...txForm, cartao_id: e.target.value })}
                      className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                    >
                      <option value="">Selecione...</option>
                      {creditCards.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider">Data</label>
                  <input
                    type="date"
                    value={txForm.data}
                    onChange={(e) => setTxForm({ ...txForm, data: e.target.value })}
                    className={`w-full p-3 rounded-xl border text-xs ${c.inputBg}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                REGISTRAR LANÇAMENTO
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
