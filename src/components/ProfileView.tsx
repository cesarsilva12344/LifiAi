import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Rocket, GraduationCap, CheckSquare, Compass, TrendingUp, 
  LayoutGrid, User, Sparkles, Plus, Trash2, Settings, Edit3, Key, Eye, EyeOff, Check, Send
} from 'lucide-react';
import { DatabaseState, Persona, UserProfile } from '../types';
import { showToast } from './Toast';

interface ProfileViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function ProfileView({ data, onRefresh, theme = 'light' }: ProfileViewProps) {
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
        method: 'PATCH',
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
        showToast('Configurações do sistema salvas com sucesso!', 'success');
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
        method: 'PATCH',
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
      const res = await fetch(`/api/db/personas/${selectedPersonaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      const res = await fetch(`/api/db/personas/${id}/toggle`, { method: 'POST' });
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
        method: 'PATCH',
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
        method: 'PATCH',
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

  // Dynamic design variables based on the active theme
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1e202a] text-slate-100',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1c25]',
    inputBg: 'bg-[#090a0d] border-[#202330] text-white placeholder-gray-650',
    btnSecondary: 'bg-[#202434] hover:bg-[#2c3248] text-white border-transparent',
    listBg: 'bg-[#090a0d] border-[#1e202c] text-gray-300'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800',
    titleText: 'text-slate-800',
    subText: 'text-slate-600',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    inputBg: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200',
    listBg: 'bg-slate-50 border-slate-200 text-slate-700'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="space-y-6">
      
      {/* 1. Grid of the 7 native Personas */}
      <div className={`border rounded-xl p-6 shadow-md transition-colors ${c.cardBg}`}>
        <div className={`flex border-b pb-3 mb-5 items-center justify-between ${c.divider}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-450 animate-pulse" />
            <h3 className={`text-sm font-semibold tracking-wide ${c.titleText}`}>COGNITIVE PERSONAS</h3>
          </div>
          <span className={`text-[10px] font-mono uppercase ${c.mutedText}`}>Ligar ou desligar personas nativas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.personas.map((p) => (
            <div 
              key={p.id}
              onClick={() => handleTogglePersona(p.id)}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] ${
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
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${c.titleText}`}>{p.nome}</h4>
                    <span className={`text-[9px] font-mono tracking-wide ${c.mutedText}`}>ID: {p.id}</span>
                  </div>
                </div>
                {p.ativa ? (
                  <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500 text-white tracking-widest uppercase">
                    ACTIVE
                  </span>
                ) : (
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    theme === 'dark' ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-200 border-slate-300 text-slate-500'
                  }`}>
                    STANDBY
                  </span>
                )}
              </div>

              <p className={`text-[11px] leading-relaxed font-sans ${c.subText}`}>{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: General Configuration and Bio (Col Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card: Configurações Gerais */}
          <div className={`border rounded-xl p-6 shadow-md transition-colors ${c.cardBg}`}>
            <div className={`flex border-b pb-3 mb-4 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-blue-500" />
                <h3 className={`text-sm font-semibold tracking-wide ${c.titleText}`}>CONFIGURAÇÕES DO SISTEMA</h3>
              </div>
              {settingsSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> SALVO
                </span>
              )}
            </div>

            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${c.mutedText}`}>Nome do Usuário</label>
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
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${c.mutedText}`}>Nome da Plataforma (App Name)</label>
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

              {/* API Keys grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap ${c.mutedText}`}>
                    <Key className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    Gemini Key
                  </label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                      placeholder="GEMINI_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`absolute right-3 top-2 cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* DeepSeek Key */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap ${c.mutedText}`}>
                    <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    DeepSeek Key
                  </label>
                  <div className="relative">
                    <input 
                      type={showDeepseekKey ? "text" : "password"}
                      value={deepseekApiKey}
                      onChange={(e) => setDeepseekApiKey(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                      placeholder="DEEPSEEK_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      className={`absolute right-3 top-2 cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                      {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Qwen Key */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap ${c.mutedText}`}>
                    <Key className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    Qwen Key (70M Free)
                  </label>
                  <div className="relative">
                    <input 
                      type={showQwenKey ? "text" : "password"}
                      value={qwenApiKey}
                      onChange={(e) => setQwenApiKey(e.target.value)}
                      className={`w-full focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${c.inputBg}`}
                      placeholder="QWEN_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowQwenKey(!showQwenKey)}
                      className={`absolute right-3 top-2 cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                      {showQwenKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Telegram config grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 ${c.divider}`}>
                {/* Bot Token */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${c.mutedText}`}>
                    Telegram Bot Token
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
                      className={`absolute right-3 top-2 cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                    >
                      {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Chat ID */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${c.mutedText}`}>
                    Seu Telegram Chat ID
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

              <div className="pt-2 flex flex-wrap gap-3">
                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-850/50 text-white text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer"
                >
                  {isSavingSettings ? 'Salvando...' : 'Salvar Configurações'}
                </button>

                <button 
                  type="button"
                  onClick={handleRegisterWebhook}
                  disabled={isRegisteringWebhook || !telegramBotToken}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 disabled:text-gray-500 text-indigo-100 border border-indigo-500/20 text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isRegisteringWebhook ? 'Registrando...' : 'Registrar Webhook Oficial'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Biografia & Contexto */}
          <div className={`border rounded-xl p-6 shadow-md transition-colors ${c.cardBg}`}>
            <div className={`flex border-b pb-3 mb-4 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-blue-500" />
                <h3 className={`text-sm font-semibold tracking-wide ${c.titleText}`}>BIOGRAFIA & CONTEXTO</h3>
              </div>
              {bioSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> ATUALIZADO
                </span>
              )}
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-mono uppercase tracking-wider font-semibold block ${c.mutedText}`}>Contexto Existencial / Perfil Executivo</label>
                <textarea 
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  rows={4}
                  placeholder="Ex: É um fundador técnico focado em otimização de tempo e automações..."
                  className={`w-full focus:border-blue-500 rounded-lg p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${c.inputBg}`}
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSavingBio || contexto === data.userProfile.contexto}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/10 text-white text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer"
              >
                {isSavingBio ? 'Salvando...' : 'Atualizar Contexto'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Persona customization and Lists (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Personalizar Persona (Edit prompts) */}
          <div className={`border rounded-xl p-5 shadow-md space-y-4 transition-colors ${c.cardBg}`}>
            <div className={`flex border-b pb-2.5 items-center justify-between ${c.divider}`}>
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-500" />
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${c.titleText}`}>EDITAR PERSONAS</span>
              </div>
              {personaSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  SALVO
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className={`text-[10px] font-mono uppercase tracking-wider block ${c.mutedText}`}>Selecione para Editar</label>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none font-mono transition-colors ${c.inputBg}`}
                >
                  {data.personas.map(p => (
                    <option key={p.id} value={p.id} className={`${theme === 'dark' ? 'bg-[#111318] text-white' : 'bg-white text-slate-800'}`}>
                      {p.nome} ({p.id}) {p.ativa ? '🟢' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handlePersonaSave} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block ${c.mutedText}`}>Nome da Persona</label>
                  <input
                    type="text"
                    value={editedPersonaName}
                    onChange={(e) => setEditedPersonaName(e.target.value)}
                    className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    placeholder="Nome da inteligência"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block ${c.mutedText}`}>Descrição Curta</label>
                  <input
                    type="text"
                    value={editedPersonaDesc}
                    onChange={(e) => setEditedPersonaDesc(e.target.value)}
                    className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none transition-colors ${c.inputBg}`}
                    placeholder="Objetivo principal..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className={`text-[10px] font-mono uppercase tracking-wider block ${c.mutedText}`}>Instrução Base (System Prompt)</label>
                  <textarea
                    value={editedPersonaPrompt}
                    onChange={(e) => setEditedPersonaPrompt(e.target.value)}
                    rows={6}
                    className={`w-full focus:border-blue-500 rounded p-2 text-xs focus:outline-none font-mono text-[10px] leading-relaxed transition-colors ${c.inputBg}`}
                    placeholder="Base de instruções cognitivas de sistema..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPersona}
                  className={`w-full text-xs font-semibold rounded py-2 transition cursor-pointer font-mono border ${c.btnSecondary}`}
                >
                  {isSavingPersona ? 'Atualizando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>
          </div>

          {/* List Card: Objetivos */}
          <div className={`border rounded-xl p-5 shadow-md space-y-3 transition-colors ${c.cardBg}`}>
            <span className={`text-xs font-mono font-bold uppercase block tracking-wider ${c.titleText}`}>Objetivos de Sucesso</span>
            
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {data.userProfile.objetivos.map((obj, i) => (
                <div key={i} className={`flex justify-between items-center border rounded px-2.5 py-1.5 text-[11px] group transition-colors ${c.listBg}`}>
                  <span className="truncate pr-2">{obj}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem('objetivos', i)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <input 
                type="text" 
                value={newObjetivo}
                onChange={(e) => setNewObjetivo(e.target.value)}
                placeholder="Novo objetivo..."
                className={`flex-1 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-blue-500 transition-colors ${c.inputBg}`}
              />
              <button 
                type="button"
                onClick={() => handleAddItem('objetivos', newObjetivo, () => setNewObjetivo(''))}
                className={`p-1.5 rounded cursor-pointer border ${c.btnSecondary}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Card: Interesses */}
          <div className={`border rounded-xl p-5 shadow-md space-y-3 transition-colors ${c.cardBg}`}>
            <span className={`text-xs font-mono font-bold uppercase block tracking-wider ${c.titleText}`}>Áreas de Interesse</span>
            
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {data.userProfile.interesses.map((int, i) => (
                <div key={i} className={`flex justify-between items-center border rounded px-2.5 py-1.5 text-[11px] group transition-colors ${c.listBg}`}>
                  <span className="truncate pr-2">{int}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveItem('interesses', i)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <input 
                type="text" 
                value={newInteresse}
                onChange={(e) => setNewInteresse(e.target.value)}
                placeholder="Novo interesse..."
                className={`flex-1 rounded px-2.5 py-1 text-[11px] focus:outline-none focus:border-blue-500 transition-colors ${c.inputBg}`}
              />
              <button 
                type="button"
                onClick={() => handleAddItem('interesses', newInteresse, () => setNewInteresse(''))}
                className={`p-1.5 rounded cursor-pointer border ${c.btnSecondary}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
