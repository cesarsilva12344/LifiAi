import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Rocket, GraduationCap, CheckSquare, Compass, TrendingUp, 
  LayoutGrid, User, Sparkles, Plus, Trash2, Settings, Edit3, Key, Eye, EyeOff, Check, Send,
  CreditCard as CardIcon, Wallet, Landmark, Layers, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2
} from 'lucide-react';
import { DatabaseState, Persona, UserProfile, CreditCard, Account, Category } from '../types';
import { showToast } from './Toast';

interface ProfileViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function ProfileView({ data, onRefresh, theme = 'light' }: ProfileViewProps) {
  // Main Sub-Tab switcher state
  const [activeSubTab, setActiveSubTab] = useState<'finances' | 'personas' | 'keys' | 'profile'>('finances');

  // General Settings States
  const [userName, setUserName] = useState(data.userProfile.nome || 'César');
  const [appName, setAppName] = useState(data.userProfile.appName || 'LifeOS AI');
  const [geminiApiKey, setGeminiApiKey] = useState(data.userProfile.geminiApiKey || '');
  const [deepseekApiKey, setDeepseekApiKey] = useState(data.userProfile.deepseekApiKey || '');
  const [qwenApiKey, setQwenApiKey] = useState(data.userProfile.qwenApiKey || '');
  const [telegramBotToken, setTelegramBotToken] = useState(data.userProfile.telegramBotToken || '');
  const [telegramChatId, setTelegramChatId] = useState(data.userProfile.telegramChatId || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [showQwenKey, setShowQwenKey] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  
  // Customization Persona States
  const [selectedPersonaId, setSelectedPersonaId] = useState(data.personas[0]?.id || 'cfo');
  const [editedPersonaName, setEditedPersonaName] = useState('');
  const [editedPersonaDesc, setEditedPersonaDesc] = useState('');
  const [editedPersonaPrompt, setEditedPersonaPrompt] = useState('');

  // Bio State
  const [contexto, setContexto] = useState(data.userProfile.contexto || '');

  // Add Item Lists states
  const [newObjetivo, setNewObjetivo] = useState('');
  const [newInteresse, setNewInteresse] = useState('');

  // Bank Account State additions
  const [accName, setAccName] = useState('');
  const [accTipo, setAccTipo] = useState<'carteira' | 'corrente' | 'poupança' | 'investimento'>('corrente');
  const [accSaldo, setAccSaldo] = useState('');
  const [accCor, setAccCor] = useState('#3b82f6');

  // Credit Card State additions
  const [crdName, setCrdName] = useState('');
  const [crdLimite, setCrdLimite] = useState('');
  const [crdFechamento, setCrdFechamento] = useState('10');
  const [crdVencimento, setCrdVencimento] = useState('17');
  const [crdCor, setCrdCor] = useState('#8b5cf6');

  // Category State additions
  const [catName, setCatName] = useState('');
  const [catTipo, setCatTipo] = useState<'receita' | 'despesa'>('despesa');
  const [catCor, setCatCor] = useState('#10b981');

  // Bank Presets
  const bankPresets = [
    { label: 'Nubank', color: '#820ad1', name: 'Nubank' },
    { label: 'Inter', color: '#f97316', name: 'Inter' },
    { label: 'PicPay', color: '#11c76f', name: 'PicPay' },
    { label: 'XP', color: '#1e293b', name: 'XP' },
    { label: 'Itaú', color: '#ec7000', name: 'Itaú' },
    { label: 'Bradesco', color: '#cc092f', name: 'Bradesco' },
    { label: 'Santander', color: '#ec0000', name: 'Santander' }
  ];

  const handleApplyCardPreset = (preset: typeof bankPresets[0]) => {
    setCrdName(preset.name);
    setCrdCor(preset.color);
    showToast(`Preset do ${preset.label} carregado!`, 'success');
  };

  const handleApplyAccountPreset = (preset: typeof bankPresets[0]) => {
    setAccName(preset.name);
    setAccCor(preset.color);
    showToast(`Preset do ${preset.label} carregado para conta!`, 'success');
  };

  const handleDeleteRelation = async (collection: string, id: string) => {
    if (confirm('Deseja realmente excluir este registro? Isso pode afetar lançamentos vinculados.')) {
      try {
        const res = await fetch(`/api/db/${collection}/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast('Registro excluído com sucesso!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao remover registro.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha: ${err.message}`, 'error');
      }
    }
  };

  const handleAddAccount = async () => {
    if (!accName.trim()) {
      showToast('Preencha o nome da conta.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/db/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: accName,
          tipo: accTipo,
          saldo_inicial: parseFloat(accSaldo) || 0,
          cor: accCor
        })
      });
      if (res.ok) {
        showToast('Conta cadastrada com sucesso!', 'success');
        setAccName('');
        setAccSaldo('');
        onRefresh();
      }
    } catch (_) {
      showToast('Erro ao salvar conta.', 'error');
    }
  };

  const handleAddCard = async () => {
    if (!crdName.trim() || !crdLimite) {
      showToast('Preencha o nome e limite do cartão.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/db/credit-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: crdName,
          limite: parseFloat(crdLimite) || 0,
          dia_fechamento: parseInt(crdFechamento) || 10,
          dia_vencimento: parseInt(crdVencimento) || 17,
          cor: crdCor
        })
      });
      if (res.ok) {
        showToast('Cartão cadastrado com sucesso!', 'success');
        setCrdName('');
        setCrdLimite('');
        onRefresh();
      }
    } catch (_) {
      showToast('Erro ao salvar cartão.', 'error');
    }
  };

  const handleAddCategory = async () => {
    if (!catName.trim()) {
      showToast('Preencha o nome da categoria.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: catName,
          tipo: catTipo,
          cor: catCor
        })
      });
      if (res.ok) {
        showToast('Categoria cadastrada!', 'success');
        setCatName('');
        onRefresh();
      }
    } catch (_) {
      showToast('Erro ao cadastrar categoria.', 'error');
    }
  };

  // Success indicator triggers
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);

  // Sync edits when selected persona switches
  useEffect(() => {
    const p = data.personas.find(item => item.id === selectedPersonaId);
    if (p) {
      setEditedPersonaName(p.nome);
      setEditedPersonaDesc(p.descricao);
      setEditedPersonaPrompt(p.prompt_base);
    }
  }, [selectedPersonaId, data.personas]);

  // Sync state values if data gets updated from parent
  useEffect(() => {
    setUserName(data.userProfile.nome || 'César');
    setAppName(data.userProfile.appName || 'LifeOS AI');
    setGeminiApiKey(data.userProfile.geminiApiKey || '');
    setDeepseekApiKey(data.userProfile.deepseekApiKey || '');
    setQwenApiKey(data.userProfile.qwenApiKey || '');
    setTelegramBotToken(data.userProfile.telegramBotToken || '');
    setTelegramChatId(data.userProfile.telegramChatId || '');
    setContexto(data.userProfile.contexto || '');
  }, [data]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: userName,
          appName,
          geminiApiKey,
          deepseekApiKey,
          qwenApiKey,
          telegramBotToken,
          telegramChatId
        })
      });
      if (res.ok) {
        showToast('Configurações salvas com sucesso!', 'success');
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3000);
        onRefresh();
      } else {
        showToast('Erro ao atualizar configurações.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto })
      });
      if (res.ok) {
        showToast('Contexto existencial atualizado!', 'success');
        setBioSuccess(true);
        setTimeout(() => setBioSuccess(false), 3000);
        onRefresh();
      } else {
        showToast('Erro ao atualizar biografia.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação.', 'error');
    } finally {
      setIsSavingBio(false);
    }
  };

  const handlePersonaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPersona(true);
    try {
      const res = await fetch('/api/db/persona/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPersonaId,
          nome: editedPersonaName,
          descricao: editedPersonaDesc,
          prompt_base: editedPersonaPrompt
        })
      });
      if (res.ok) {
        showToast(`Persona ${editedPersonaName} atualizada!`, 'success');
        setPersonaSuccess(true);
        setTimeout(() => setPersonaSuccess(false), 3000);
        onRefresh();
      } else {
        showToast('Erro ao atualizar a persona.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha no salvamento.', 'error');
    } finally {
      setIsSavingPersona(false);
    }
  };

  const handleTogglePersona = async (id: string) => {
    try {
      const res = await fetch('/api/db/persona/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const payload = await res.json();
        showToast(`Persona ativa alterada para: ${payload.nome}`, 'success');
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao ativar persona:', err);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!telegramBotToken) {
      showToast('Defina o Telegram Bot Token antes de registrar.', 'warning');
      return;
    }
    setIsRegisteringWebhook(true);
    try {
      const res = await fetch('/api/telegram/register-webhook', { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        showToast(`Webhook Telegram registrado! Bot: @${body.username}`, 'success');
      } else {
        const errBody = await res.json();
        showToast(`Falha: ${errBody.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Erro na rede: ${err.message}`, 'error');
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const getPersonaIcon = (id: string) => {
    switch (id) {
      case 'cfo': return <Briefcase className="w-5 h-5 text-emerald-500" />;
      case 'founder': return <Rocket className="w-5 h-5 text-blue-500" />;
      case 'mentor': return <GraduationCap className="w-5 h-5 text-sky-500" />;
      case 'executor': return <CheckSquare className="w-5 h-5 text-orange-500" />;
      case 'conselheiro': return <Compass className="w-5 h-5 text-purple-500" />;
      case 'analista': return <TrendingUp className="w-5 h-5 text-pink-500" />;
      default: return <LayoutGrid className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleAddItem = async (field: 'objetivos' | 'interesses', value: string, clearCallback: () => void) => {
    if (!value.trim()) return;
    const currentList = data.userProfile[field] || [];
    const updatedList = [...currentList, value.trim()];
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedList })
      });
      if (res.ok) {
        clearCallback();
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao adicionar item:', err);
    }
  };

  const handleRemoveItem = async (field: 'objetivos' | 'interesses', index: number) => {
    const currentList = data.userProfile[field] || [];
    const updatedList = currentList.filter((_, i) => i !== index);
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedList })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao remover item:', err);
    }
  };

  // Finance metrics helpers
  const getCardSpent = (cardId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Sum matching expenses in current month
    return data.expenses
      ?.filter(e => {
        if (e.cartao_id !== cardId) return false;
        const eDate = new Date(e.data + 'T12:00:00');
        return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
      })
      ?.reduce((sum, e) => sum + e.valor, 0) || 0;
  };

  const getCategoryUsage = (categoryName: string) => {
    const expCount = data.expenses?.filter(e => e.categoria.toLowerCase() === categoryName.toLowerCase()).length || 0;
    const incCount = data.income?.filter(i => i.categoria.toLowerCase() === categoryName.toLowerCase()).length || 0;
    return expCount + incCount;
  };

  // Theme Styling Settings
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1e202a] text-slate-100',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1c25]',
    inputBg: 'bg-[#090a0d] border-[#202330] text-white placeholder-gray-650',
    btnSecondary: 'bg-[#202434] hover:bg-[#2c3248] text-white border-transparent',
    listBg: 'bg-[#090a0d] border-[#1e202c] text-gray-300',
    formBg: 'bg-[#090a0d] border-[#1d202a]'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800',
    titleText: 'text-slate-800',
    subText: 'text-slate-650',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    inputBg: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200',
    listBg: 'bg-slate-50 border-slate-200 text-slate-700',
    formBg: 'bg-slate-50 border-slate-200'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Workspace - Premium Sub-Navigation Panel */}
      <div className={`p-4 border rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg transition-colors ${c.cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl">
            <Settings className="w-6 h-6 animate-[spin_8s_linear_infinite]" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-wider uppercase">Painel de Configuração</h2>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">LifeOS AI v1.0 • César Silva</p>
          </div>
        </div>

        {/* Tactile Tab Pill Controls */}
        <div className="flex flex-wrap gap-1.5 bg-[#090a0d]/10 dark:bg-black/35 p-1 rounded-xl border border-slate-250 dark:border-slate-800">
          {[
            { id: 'finances', label: 'Contas & Cartões', icon: <CardIcon className="w-3.5 h-3.5" /> },
            { id: 'personas', label: 'IA Personas', icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'keys', label: 'Chaves & APIs', icon: <Key className="w-3.5 h-3.5" /> },
            { id: 'profile', label: 'Perfil & Metas', icon: <User className="w-3.5 h-3.5" /> }
          ].map((tab) => {
            const isTabActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-bold uppercase rounded-lg tracking-wide cursor-pointer select-none transition-all duration-200 flex items-center gap-1.5 ${
                  isTabActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : theme === 'dark' 
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-tab Content Rendering */}
      
      {/* ========================================================
          TAB 1: 💳 GERENCIAMENTO CONTÁBIL (DEFAULT)
          ======================================================== */}
      {activeSubTab === 'finances' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          {/* Main Grid: Card & Accounts Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Col 1: Credit Cards Visual Grid */}
            <div className={`lg:col-span-2 border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-5`}>
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <CardIcon className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">Cartões de Crédito Virtuais</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500">
                  {data.creditCards?.length || 0} ATIVOS
                </span>
              </div>

              {/* Glowing Interactive Cards list */}
              {(!data.creditCards || data.creditCards.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl dark:border-slate-800 text-center space-y-2">
                  <CardIcon className="w-10 h-10 text-slate-500 animate-pulse" />
                  <p className="text-xs font-mono text-slate-450 uppercase">Nenhum cartão cadastrado ainda</p>
                  <p className="text-[10px] text-slate-400 max-w-[250px]">Preencha o formulário rápido à direita para criar seu primeiro cartão com efeito glow.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.creditCards.map((card) => {
                    const spent = getCardSpent(card.id);
                    const available = Math.max(0, card.limite - spent);
                    const pct = Math.min(100, (spent / card.limite) * 100);
                    const cardColor = card.cor || '#8b5cf6';
                    
                    return (
                      <div 
                        key={card.id}
                        className="group relative flex flex-col justify-between p-5 rounded-2xl aspect-[1.586/1] text-white overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/5 select-none"
                        style={{
                          background: `linear-gradient(135deg, ${cardColor} 0%, #06090e 100%)`,
                          boxShadow: `0 16px 36px -12px ${cardColor}65`
                        }}
                      >
                        {/* Metallic gloss overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />

                        {/* Top Line */}
                        <div className="flex items-start justify-between z-10">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-bold opacity-60">Corporate Executive</p>
                            <p className="text-sm font-black tracking-wide uppercase mt-0.5">{card.nome}</p>
                          </div>
                          {/* Card chip */}
                          <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 border border-yellow-400/40 relative shadow">
                            <div className="absolute inset-x-2 inset-y-1.5 border-t border-b border-black/10" />
                            <div className="absolute inset-y-1.5 inset-x-3.5 border-l border-r border-black/10" />
                          </div>
                        </div>

                        {/* Middle Line: Virtual Numbers */}
                        <div className="my-2 z-10">
                          <p className="text-sm tracking-[0.25em] font-mono font-bold text-white/80">
                            ••••  ••••  ••••  {1000 + Math.floor(Math.abs(card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 8999)}
                          </p>
                        </div>

                        {/* Bottom Line: Limits Meter and Due Dates */}
                        <div className="space-y-2 z-10">
                          <div className="flex justify-between items-end text-[9px] font-mono text-white/85">
                            <div>
                              <p className="opacity-60 text-[8px] uppercase">Limite Consumido (Mês)</p>
                              <p className="font-bold">R$ {spent.toLocaleString('pt-BR')} / R$ {card.limite.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                              <p className="opacity-60 text-[8px] uppercase">Fech. / Venc.</p>
                              <p className="font-bold">{card.dia_fechamento} / {card.dia_vencimento}</p>
                            </div>
                          </div>

                          {/* Dynamic limit meter */}
                          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>

                          {/* Extra info & Delete Trigger */}
                          <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[9px] font-mono">
                            <span className="opacity-70">Disponível: R$ {available.toLocaleString('pt-BR')}</span>
                            <button
                              onClick={() => handleDeleteRelation('credit-cards', card.id)}
                              className="px-2 py-0.5 rounded bg-black/40 hover:bg-red-650 text-white font-bold transition cursor-pointer"
                            >
                              EXCLUIR
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Col 2: Card Creation Form & Real-time Live Preview */}
            <div className="space-y-6">
              
              {/* Form Quick Add Credit Card */}
              <div className={`border rounded-2xl p-5 shadow-md transition-colors ${c.cardBg} space-y-4`}>
                <div className="flex items-center gap-2 border-b pb-2 dark:border-slate-800">
                  <Plus className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">Novo Cartão de Crédito</span>
                </div>

                {/* Real-time Interactive Card Preview Box */}
                <div 
                  className="w-full aspect-[1.586/1] rounded-xl p-4 flex flex-col justify-between text-white overflow-hidden shadow-lg border border-white/5 font-mono select-none"
                  style={{
                    background: `linear-gradient(135deg, ${crdCor} 0%, #06090e 100%)`,
                    boxShadow: `0 12px 24px -8px ${crdCor}80`,
                    transition: 'all 0.4s ease'
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[7px] uppercase tracking-widest opacity-60">LIVE PREVIEW</p>
                      <p className="text-xs font-black tracking-wide uppercase truncate mt-0.5">{crdName || 'NOME DO BANCO'}</p>
                    </div>
                    <div className="w-8 h-6 rounded bg-gradient-to-tr from-yellow-500 to-amber-300 opacity-80" />
                  </div>
                  
                  <div>
                    <p className="text-xs tracking-[0.2em]">••••  ••••  ••••  8888</p>
                  </div>

                  <div className="space-y-1.5 text-[8px]">
                    <div className="flex justify-between opacity-80">
                      <span>LIMITE: R$ {parseFloat(crdLimite || '0').toLocaleString('pt-BR')}</span>
                      <span>F/V: {crdFechamento} / {crdVencimento}</span>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full" />
                    <span className="block opacity-60 truncate uppercase">{userName}</span>
                  </div>
                </div>

                {/* Quick presets list for Brazilian banks */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-mono font-bold text-slate-400 uppercase block">Escolha de Cor do Banco Presets:</label>
                  <div className="flex flex-wrap gap-1">
                    {bankPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyCardPreset(preset)}
                        className="px-2 py-1 rounded text-[9px] font-bold text-white border border-white/10 transition hover:brightness-110 cursor-pointer"
                        style={{ backgroundColor: preset.color }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 block uppercase">Nome do Banco</label>
                      <input
                        type="text" placeholder="Ex: Inter"
                        value={crdName}
                        onChange={e => setCrdName(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 block uppercase">Limite Total (R$)</label>
                      <input
                        type="number" placeholder="Ex: 5000"
                        value={crdLimite}
                        onChange={e => setCrdLimite(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 block uppercase" title="Dia do fechamento">Fechamento</label>
                      <input
                        type="number"
                        value={crdFechamento}
                        onChange={e => setCrdFechamento(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 block uppercase" title="Dia do vencimento">Vencimento</label>
                      <input
                        type="number"
                        value={crdVencimento}
                        onChange={e => setCrdVencimento(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-slate-400 block uppercase">Cor Custom</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={crdCor}
                          onChange={e => setCrdCor(e.target.value)}
                          className="w-full h-8 rounded border border-slate-350 dark:border-slate-800 p-0.5 cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="w-full py-2 bg-purple-650 hover:bg-purple-550 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition cursor-pointer"
                  >
                    Gravar Cartão no Banco
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts & Wallets Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Col 1: Accounts and passbook visual grid */}
            <div className={`lg:col-span-2 border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-5`}>
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-mono font-bold tracking-widest uppercase">Carteiras e Contas Correntes</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                  {data.accounts?.length || 0} CONTAS
                </span>
              </div>

              {(!data.accounts || data.accounts.length === 0) ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl dark:border-slate-800 text-center space-y-2">
                  <Wallet className="w-10 h-10 text-slate-500 animate-pulse" />
                  <p className="text-xs font-mono text-slate-450 uppercase">Nenhuma conta ativa cadastrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.accounts.map((acc) => (
                    <div 
                      key={acc.id}
                      className="p-4 rounded-xl border flex flex-col justify-between space-y-3 transition duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: theme === 'dark' ? '#090a0d' : '#f8fafc',
                        borderLeft: `5px solid ${acc.cor || '#3b82f6'}`
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <Landmark className="w-4 h-4 opacity-70 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <h4 className="text-xs font-black uppercase tracking-wide truncate">{acc.nome}</h4>
                            <span className="text-[8px] font-mono uppercase bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                              {acc.tipo}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteRelation('accounts', acc.id)}
                          className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                          title="Remover conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] uppercase text-slate-450 font-mono">Saldo Consolidado</p>
                          <p className="text-sm font-bold font-mono text-emerald-500">
                            R$ {acc.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <span className="text-[8px] font-mono text-slate-500">Inicial: R$ {acc.saldo_inicial.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Col 2: Account form */}
            <div className={`border rounded-2xl p-5 shadow-md transition-colors ${c.cardBg} space-y-4`}>
              <div className="flex items-center gap-2 border-b pb-2 dark:border-slate-800">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase">Nova Conta / Carteira</span>
              </div>

              {/* Quick account presets */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase block">Atalhos rápidos para conta:</label>
                <div className="flex flex-wrap gap-1">
                  {bankPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyAccountPreset(preset)}
                      className="px-2 py-0.5 rounded text-[8px] font-bold text-white border border-white/5 hover:scale-[1.02] transition cursor-pointer"
                      style={{ backgroundColor: preset.color }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-450 block uppercase">Nome da Conta</label>
                    <input
                      type="text" placeholder="Ex: Inter"
                      value={accName}
                      onChange={e => setAccName(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-450 block uppercase">Tipo</label>
                    <select
                      value={accTipo}
                      onChange={e => setAccTipo(e.target.value as any)}
                      className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    >
                      <option value="corrente">Corrente</option>
                      <option value="carteira">Carteira / Dinheiro</option>
                      <option value="poupança">Poupança</option>
                      <option value="investimento">Investimento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-450 block uppercase">Saldo Inicial (R$)</label>
                    <input
                      type="number" placeholder="Ex: 1500"
                      value={accSaldo}
                      onChange={e => setAccSaldo(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-slate-450 block uppercase">Identidade (Cor)</label>
                    <input
                      type="color"
                      value={accCor}
                      onChange={e => setAccCor(e.target.value)}
                      className="w-full h-8 rounded border border-slate-350 dark:border-slate-800 p-0.5 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddAccount}
                  className="w-full py-2 bg-emerald-650 hover:bg-emerald-550 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider transition cursor-pointer"
                >
                  Registrar Nova Carteira
                </button>
              </div>
            </div>
          </div>

          {/* Categories Manager Panel */}
          <div className={`border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-mono font-bold tracking-widest uppercase">Estrutura de Categorias Financeiras</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                {data.categories?.length || 0} REGISTRADAS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Despesas list (col-span 2) */}
              <div className="lg:col-span-2 space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-widest border-b pb-1.5 dark:border-slate-800">
                  🔴 Categorias de Despesas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {data.categories?.filter(cat => cat.tipo === 'despesa').map(cat => {
                    const usage = getCategoryUsage(cat.nome);
                    return (
                      <div 
                        key={cat.id} 
                        className={`flex justify-between items-center p-2 rounded-lg border text-xs group transition ${c.listBg}`}
                        style={{ borderLeft: `3px solid ${cat.cor}` }}
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold truncate">{cat.nome}</p>
                          <span className="text-[8px] font-mono opacity-50 uppercase">{usage} Lançamentos</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRelation('categories', cat.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receitas list (col-span 1) */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest border-b pb-1.5 dark:border-slate-800">
                  🟢 Categorias de Receitas
                </h4>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {data.categories?.filter(cat => cat.tipo === 'receita').map(cat => {
                    const usage = getCategoryUsage(cat.nome);
                    return (
                      <div 
                        key={cat.id} 
                        className={`flex justify-between items-center p-2 rounded-lg border text-xs group transition ${c.listBg}`}
                        style={{ borderLeft: `3px solid ${cat.cor}` }}
                      >
                        <div className="truncate pr-1">
                          <p className="font-bold truncate">{cat.nome}</p>
                          <span className="text-[8px] font-mono opacity-50 uppercase">{usage} Lançamentos</span>
                        </div>
                        <button
                          onClick={() => handleDeleteRelation('categories', cat.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add category form */}
              <div className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${c.formBg}`}>
                <span className="font-bold block tracking-tight uppercase text-[9px] font-mono text-indigo-400">Criar Nova Categoria</span>
                
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 block uppercase">Nome da Categoria</label>
                    <input
                      type="text" placeholder="Ex: Lazer"
                      value={catName}
                      onChange={e => setCatName(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 block uppercase">Fluxo</label>
                    <select
                      value={catTipo}
                      onChange={e => setCatTipo(e.target.value as any)}
                      className={`w-full focus:border-blue-500 rounded p-1.5 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    >
                      <option value="despesa">Despesa (Débito)</option>
                      <option value="receita">Receita (Crédito)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-mono text-slate-400 block uppercase">Cor de Marcação</label>
                    <input
                      type="color"
                      value={catCor}
                      onChange={e => setCatCor(e.target.value)}
                      className="w-full h-8 rounded border border-slate-350 dark:border-slate-800 p-0.5 cursor-pointer bg-transparent"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-[10px] rounded uppercase tracking-wider transition cursor-pointer"
                  >
                    Gravar Categoria
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: 🤖 PERSONAS COGNITIVAS & PROMPTS
          ======================================================== */}
      {activeSubTab === 'personas' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          {/* Active persona grids switches */}
          <div className={`border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-4`}>
            <div className={`flex border-b pb-3 mb-5 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-amber-450 animate-pulse" />
                <h3 className="text-sm font-semibold tracking-wide">PERSONAS COGNITIVAS NATIVAS</h3>
              </div>
              <span className={`text-[10px] font-mono uppercase ${c.mutedText}`}>Toque para ligar ou desligar a persona ativa</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.personas.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleTogglePersona(p.id)}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 cursor-pointer select-none transition-all duration-350 hover:scale-[1.01] ${
                    p.ativa 
                      ? (theme === 'dark' ? 'bg-blue-950/20 border-blue-500 shadow-md ring-1 ring-blue-500/30' : 'bg-blue-50/50 border-blue-500 shadow-md ring-1 ring-blue-500/20')
                      : (theme === 'dark' ? 'bg-[#090a0d] border-[#1e212c] hover:border-slate-700/50' : 'bg-slate-50 border-slate-200 hover:border-slate-350/50')
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${p.ativa ? 'bg-blue-500/10' : 'bg-gray-800/10'}`}>
                        {getPersonaIcon(p.id)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider">{p.nome}</h4>
                        <span className={`text-[9px] font-mono tracking-wide ${c.mutedText}`}>ID: {p.id}</span>
                      </div>
                    </div>
                    {p.ativa ? (
                      <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500 text-white tracking-widest uppercase">
                        ATVA
                      </span>
                    ) : (
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                        theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-250 border-slate-300 text-slate-500'
                      }`}>
                        STANDBY
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed font-sans opacity-85">{p.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form customize specific selected system prompt */}
          <div className={`border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-4`}>
            <div className={`flex border-b pb-3 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <Edit3 className="w-4.5 h-4.5 text-purple-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Modificar Configurações & Instrução de Persona</span>
              </div>
              {personaSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  SALVO COM SUCESSO
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left selector */}
              <div className="lg:col-span-2 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider block text-slate-400">Selecione para Customizar</label>
                  <select
                    value={selectedPersonaId}
                    onChange={(e) => setSelectedPersonaId(e.target.value)}
                    className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                  >
                    {data.personas.map(p => (
                      <option key={p.id} value={p.id} className={`${theme === 'dark' ? 'bg-[#111318] text-white' : 'bg-white text-slate-800'}`}>
                        {p.nome} ({p.id}) {p.ativa ? '🟢 ATIVA' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="p-4 rounded-xl border border-dashed text-xs dark:border-slate-800 text-slate-400 leading-relaxed space-y-2">
                  <p className="font-bold font-mono uppercase text-[9px] text-blue-400">O que é a Instrução Base (System Prompt)?</p>
                  <p>É o conjunto primário de regras, diretrizes morais e técnicas de tomada de decisão enviadas às APIs LLM (como Gemini, Deepseek). Modificar esse prompt alterará inteiramente o tom técnico e as respostas cognitivas do seu agente.</p>
                </div>
              </div>

              {/* Right prompt editor form */}
              <form onSubmit={handlePersonaSave} className="lg:col-span-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider block text-slate-400">Nome de Exibição</label>
                    <input
                      type="text"
                      value={editedPersonaName}
                      onChange={(e) => setEditedPersonaName(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider block text-slate-400">Objetivo Geral (Meta)</label>
                    <input
                      type="text"
                      value={editedPersonaDesc}
                      onChange={(e) => setEditedPersonaDesc(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider block text-slate-400">System Prompt (Prompt Base de Instrução)</label>
                  <textarea
                    value={editedPersonaPrompt}
                    onChange={(e) => setEditedPersonaPrompt(e.target.value)}
                    rows={8}
                    className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none font-mono text-[10px] leading-relaxed transition-colors ${c.inputBg}`}
                    placeholder="Regras de engenharia comportamental do agente..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPersona}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-lg uppercase tracking-wider transition cursor-pointer"
                >
                  {isSavingPersona ? 'Atualizando Prompt no Servidor...' : 'Salvar Alterações de Instrução'}
                </button>
              </form>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 3: 🔑 CHAVES & INTEGRAÇÕES
          ======================================================== */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          <div className={`border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg}`}>
            <div className={`flex border-b pb-3 mb-5 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <Key className="w-4.5 h-4.5 text-blue-500" />
                <h3 className="text-sm font-semibold tracking-wide">CONFIGURAÇÕES DE CHAVES DE API E CHATBOT</h3>
              </div>
              {settingsSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> SALVO
                </span>
              )}
            </div>

            <form onSubmit={handleSettingsSave} className="space-y-5">
              
              {/* App Meta Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-slate-400">Nome do Usuário Administrador</label>
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className={`w-full focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${c.inputBg}`}
                    placeholder="Ex: César"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-slate-400">Nome da Plataforma (App Name)</label>
                  <input 
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className={`w-full focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${c.inputBg}`}
                    placeholder="Ex: LifeOS AI"
                    required
                  />
                </div>
              </div>

              {/* Deep LLM API Provider Keys */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">🧠 Provedores de Inteligência Artificial</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gemini Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-slate-400">
                      <Key className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <input 
                        type={showApiKey ? "text" : "password"}
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                        placeholder="AIzaSy..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-2.5 cursor-pointer text-slate-400 hover:text-slate-200"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* DeepSeek Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-slate-400">
                      <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      DeepSeek API Key
                    </label>
                    <div className="relative">
                      <input 
                        type={showDeepseekKey ? "text" : "password"}
                        value={deepseekApiKey}
                        onChange={(e) => setDeepseekApiKey(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                        placeholder="sk-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                        className="absolute right-3 top-2.5 cursor-pointer text-slate-400 hover:text-slate-200"
                      >
                        {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Qwen Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-slate-400">
                      <Key className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      Qwen Key (70M Free)
                    </label>
                    <div className="relative">
                      <input 
                        type={showQwenKey ? "text" : "password"}
                        value={qwenApiKey}
                        onChange={(e) => setQwenApiKey(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                        placeholder="qw-..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowQwenKey(!showQwenKey)}
                        className="absolute right-3 top-2.5 cursor-pointer text-slate-400 hover:text-slate-200"
                      >
                        {showQwenKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chatbot Capture Bot Token integration */}
              <div className="space-y-3 border-t pt-4 dark:border-slate-800/80">
                <h4 className="text-[10px] font-mono font-bold text-sky-450 uppercase tracking-widest">💬 Captura por Chatbot & Mensageiros</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bot Token */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-slate-400">
                      Telegram Bot Token Oficial
                    </label>
                    <div className="relative">
                      <input 
                        type={showTelegramToken ? "text" : "password"}
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                        placeholder="Ex: 8958634176:AA..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowTelegramToken(!showTelegramToken)}
                        className="absolute right-3 top-2.5 cursor-pointer text-slate-400 hover:text-slate-200"
                      >
                        {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Chat ID */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-slate-400">
                      Chat ID do Administrador
                    </label>
                    <input 
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                      placeholder="Ex: 987654321"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer"
                >
                  {isSavingSettings ? 'Gravando Alterações...' : 'Salvar Alterações de Sistema'}
                </button>

                <button 
                  type="button"
                  onClick={handleRegisterWebhook}
                  disabled={isRegisteringWebhook || !telegramBotToken}
                  className="bg-indigo-650 hover:bg-indigo-550 disabled:bg-indigo-900/40 disabled:text-gray-500 text-indigo-100 border border-indigo-500/20 text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isRegisteringWebhook ? 'Registrando Webhook...' : 'Vincular Webhook do Telegram'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 4: 👤 PERFIL & METAS EXISTENCIAIS
          ======================================================== */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Bio profile context */}
            <div className={`lg:col-span-2 border rounded-2xl p-6 shadow-md transition-colors ${c.cardBg} space-y-4`}>
              <div className={`flex border-b pb-3 items-center justify-between ${c.divider}`}>
                <div className="flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-blue-500" />
                  <h3 className="text-sm font-semibold tracking-wide">RITUAL & CONTEXTO EXISTENCIAL</h3>
                </div>
                {bioSuccess && (
                  <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    ATUALIZADO
                  </span>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider font-semibold block text-slate-400">Contexto Geral / Perfil do Executivo para as IAs</label>
                  <textarea 
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    rows={8}
                    placeholder="Fale brevemente sobre você, seus hábitos de gastos, seus focos profissionais e sua rotina. As IAs adaptarão os conselhos a essa descrição..."
                    className={`w-full focus:border-blue-500 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${c.inputBg}`}
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={isSavingBio || contexto === data.userProfile.contexto}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/15 text-white text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer"
                >
                  {isSavingBio ? 'Gravando Contexto...' : 'Gravar Perfil Existencial'}
                </button>
              </form>
            </div>

            {/* Right: Goals and objectives lists */}
            <div className="space-y-6">
              
              {/* Objectives List */}
              <div className={`border rounded-2xl p-5 shadow-md space-y-3 transition-colors ${c.cardBg}`}>
                <span className="text-xs font-mono font-bold uppercase block tracking-wider">Objetivos Corporativos / Financeiros</span>
                
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {(!data.userProfile.objetivos || data.userProfile.objetivos.length === 0) ? (
                    <span className="text-[10px] font-mono text-slate-500 uppercase block pl-1">Sem objetivos listados</span>
                  ) : (
                    data.userProfile.objetivos.map((obj, i) => (
                      <div key={i} className={`flex justify-between items-center border rounded px-2.5 py-1.5 text-[11px] group transition-colors ${c.listBg}`}>
                        <span className="truncate pr-2">{obj}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem('objetivos', i)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-450 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-1.5 pt-1.5 border-t dark:border-slate-800">
                  <input 
                    type="text" 
                    value={newObjetivo}
                    onChange={(e) => setNewObjetivo(e.target.value)}
                    placeholder="Adicionar objetivo..."
                    className={`flex-1 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500 transition-colors ${c.inputBg}`}
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddItem('objetivos', newObjetivo, () => setNewObjetivo(''))}
                    className={`p-2 rounded cursor-pointer border ${c.btnSecondary}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Interests List */}
              <div className={`border rounded-2xl p-5 shadow-md space-y-3 transition-colors ${c.cardBg}`}>
                <span className="text-xs font-mono font-bold uppercase block tracking-wider">Áreas de Interesse</span>
                
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {(!data.userProfile.interesses || data.userProfile.interesses.length === 0) ? (
                    <span className="text-[10px] font-mono text-slate-500 uppercase block pl-1">Sem interesses cadastrados</span>
                  ) : (
                    data.userProfile.interesses.map((int, i) => (
                      <div key={i} className={`flex justify-between items-center border rounded px-2.5 py-1.5 text-[11px] group transition-colors ${c.listBg}`}>
                        <span className="truncate pr-2">{int}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveItem('interesses', i)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-450 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-1.5 pt-1.5 border-t dark:border-slate-800">
                  <input 
                    type="text" 
                    value={newInteresse}
                    onChange={(e) => setNewInteresse(e.target.value)}
                    placeholder="Nova área de interesse..."
                    className={`flex-1 rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500 transition-colors ${c.inputBg}`}
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddItem('interesses', newInteresse, () => setNewInteresse(''))}
                    className={`p-2 rounded cursor-pointer border ${c.btnSecondary}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
