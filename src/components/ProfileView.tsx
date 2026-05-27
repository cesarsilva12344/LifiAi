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
}

export default function ProfileView({ data, onRefresh }: ProfileViewProps) {
  // General Settings States
  const [userName, setUserName] = useState(data.userProfile.nome || 'Cesaronesto');
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);

  // Profile Bio States
  const [contexto, setContexto] = useState(data.userProfile.contexto);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);

  const [newInteresse, setNewInteresse] = useState('');
  const [newObjetivo, setNewObjetivo] = useState('');

  // Persona Editing States
  const [selectedPersonaId, setSelectedPersonaId] = useState(data.personas[0]?.id || 'cfo');
  const [editedPersonaName, setEditedPersonaName] = useState('');
  const [editedPersonaDesc, setEditedPersonaDesc] = useState('');
  const [editedPersonaPrompt, setEditedPersonaPrompt] = useState('');
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const [personaSuccess, setPersonaSuccess] = useState(false);

  // Sync edits when selected persona changes or when database updates
  useEffect(() => {
    const p = data.personas.find(p => p.id === selectedPersonaId);
    if (p) {
      setEditedPersonaName(p.nome);
      setEditedPersonaDesc(p.descricao);
      setEditedPersonaPrompt(p.prompt_base);
    }
  }, [selectedPersonaId, data.personas]);

  const getPersonaIcon = (id: string) => {
    switch (id) {
      case 'cfo': return <Briefcase className="w-5 h-5 text-emerald-400" />;
      case 'founder': return <Rocket className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'mentor': return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case 'executor': return <CheckSquare className="w-5 h-5 text-sky-400" />;
      case 'conselheiro': return <Compass className="w-5 h-5 text-indigo-400" />;
      case 'analista': return <TrendingUp className="w-5 h-5 text-pink-400" />;
      case 'cos': return <LayoutGrid className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleTogglePersona = async (id: string) => {
    try {
      const res = await fetch('/api/db/persona/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao alternar persona:', err);
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: userName,
          appName: appName,
          geminiApiKey: geminiApiKey,
          deepseekApiKey: deepseekApiKey,
          qwenApiKey: qwenApiKey,
          telegramBotToken: telegramBotToken,
          telegramChatId: telegramChatId
        })
      });
      if (res.ok) {
        setSettingsSuccess(true);
        onRefresh();
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Falha ao salvar configurações gerais:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRegisterWebhook = async () => {
    setIsRegisteringWebhook(true);
    try {
      const res = await fetch('/api/telegram/register-webhook', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        showToast(json.message || 'Webhook registrado!', 'success');
      } else {
        showToast(json.error || 'Erro ao registrar webhook.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha na requisição: ${err.message}`, 'error');
    } finally {
      setIsRegisteringWebhook(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);
    setBioSuccess(false);
    try {
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contexto,
          interesses: data.userProfile.interesses,
          objetivos: data.userProfile.objetivos,
          preferencias: data.userProfile.preferencias
        })
      });
      if (res.ok) {
        setBioSuccess(true);
        onRefresh();
        setTimeout(() => setBioSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Falha ao salvar perfil:', err);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handlePersonaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPersona(true);
    setPersonaSuccess(false);
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
        setPersonaSuccess(true);
        onRefresh();
        setTimeout(() => setPersonaSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Falha ao atualizar persona:', err);
    } finally {
      setIsSavingPersona(false);
    }
  };

  // Add list helper
  const handleAddItem = async (field: 'interesses' | 'objetivos', value: string, clearFn: () => void) => {
    if (!value.trim()) return;
    try {
      const updatedList = [...data.userProfile[field], value];
      const res = await fetch('/api/db/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: updatedList })
      });
      if (res.ok) {
        clearFn();
        onRefresh();
      }
    } catch (err) {
      console.error('Falha ao adicionar item:', err);
    }
  };

  // Remove list helper
  const handleRemoveItem = async (field: 'interesses' | 'objetivos', index: number) => {
    try {
      const updatedList = data.userProfile[field].filter((_, idx) => idx !== index);
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

  return (
    <div className="space-y-6">
      
      {/* Grid of the 7 native Personas */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6 shadow-md">
        <div className="flex border-b border-[#1b1c25] pb-3 mb-5 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white tracking-wide">COGNITIVE PERSONAS</h3>
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase">Ligar ou desligar personas nativas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.personas.map((p) => (
            <div 
              key={p.id}
              onClick={() => handleTogglePersona(p.id)}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] ${
                p.ativa 
                  ? 'bg-blue-950/20 border-blue-500 shadow-md ring-1 ring-blue-500/30' 
                  : 'bg-[#090a0d] border-[#1e212c] hover:border-gray-600/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${p.ativa ? 'bg-blue-500/10' : 'bg-gray-800/40'}`}>
                    {getPersonaIcon(p.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{p.nome}</h4>
                    <span className="text-[9px] text-gray-500 font-mono tracking-wide">ID: {p.id}</span>
                  </div>
                </div>
                {p.ativa ? (
                  <span className="text-[8px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500 text-white tracking-widest uppercase">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-500">
                    STANDBY
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: General Configuration and Bio (Col Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card: Configurações Gerais */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6 shadow-md">
            <div className="flex border-b border-[#1b1c25] pb-3 mb-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-wide">CONFIGURAÇÕES DO SISTEMA</h3>
              </div>
              {settingsSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/25 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> SALVO
                </span>
              )}
            </div>

            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block">Nome do Usuário</label>
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: Augusto"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block">Nome da Plataforma (App Name)</label>
                  <input 
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: LifeOS AI"
                    required
                  />
                </div>
                           {/* API Keys grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gemini Key */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                    <Key className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                    Gemini Key
                  </label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="GEMINI_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* DeepSeek Key */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                    <Key className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    DeepSeek Key
                  </label>
                  <div className="relative">
                    <input 
                      type={showDeepseekKey ? "text" : "password"}
                      value={deepseekApiKey}
                      onChange={(e) => setDeepseekApiKey(e.target.value)}
                      className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="DEEPSEEK_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-white"
                    >
                      {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Qwen Key */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block flex items-center gap-1.5 text-ellipsis overflow-hidden whitespace-nowrap">
                    <Key className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    Qwen Key (70M Free)
                  </label>
                  <div className="relative">
                    <input 
                      type={showQwenKey ? "text" : "password"}
                      value={qwenApiKey}
                      onChange={(e) => setQwenApiKey(e.target.value)}
                      className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="QWEN_API_KEY..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowQwenKey(!showQwenKey)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-white"
                    >
                      {showQwenKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>    </div>

              {/* Telegram config grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1a1c25] pt-4">
                {/* Bot Token */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block">
                    Telegram Bot Token
                  </label>
                  <div className="relative">
                    <input 
                      type={showTelegramToken ? "text" : "password"}
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      placeholder="Ex: 8958634176:AA..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowTelegramToken(!showTelegramToken)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-white"
                    >
                      {showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Chat ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block">
                    Seu Telegram Chat ID
                  </label>
                  <input 
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
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
                  className="bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-900/40 disabled:text-gray-500 text-indigo-300 hover:text-white border border-indigo-500/20 text-xs font-semibold rounded-lg px-4 py-2 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isRegisteringWebhook ? 'Registrando...' : 'Registrar Webhook Oficial'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Biografia & Contexto */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6 shadow-md">
            <div className="flex border-b border-[#1b1c25] pb-3 mb-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white tracking-wide">BIOGRAFIA & CONTEXTO</h3>
              </div>
              {bioSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/25 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" /> ATUALIZADO
                </span>
              )}
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider font-semibold block">Contexto Existencial / Perfil Executivo</label>
                <textarea 
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  rows={4}
                  placeholder="Ex: É um fundador técnico focado em otimização de tempo e automações..."
                  className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded-lg p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex border-b border-[#1b1c25] pb-2.5 items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">EDITAR PERSONAS</span>
              </div>
              {personaSuccess && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/25 px-1.5 py-0.5 rounded">
                  SALVO
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider block">Selecione para Editar</label>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full bg-[#090a0d] border border-[#202330] rounded p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  {data.personas.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#111318] text-white">
                      {p.nome} ({p.id}) {p.ativa ? '🟢' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handlePersonaSave} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Nome da Persona</label>
                  <input
                    type="text"
                    value={editedPersonaName}
                    onChange={(e) => setEditedPersonaName(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded p-2 text-xs text-white focus:outline-none"
                    placeholder="Nome da inteligência"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Descrição Curta</label>
                  <input
                    type="text"
                    value={editedPersonaDesc}
                    onChange={(e) => setEditedPersonaDesc(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded p-2 text-xs text-white focus:outline-none"
                    placeholder="Objetivo principal..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">Instrução Base (System Prompt)</label>
                  <textarea
                    value={editedPersonaPrompt}
                    onChange={(e) => setEditedPersonaPrompt(e.target.value)}
                    rows={6}
                    className="w-full bg-[#090a0d] border border-[#202330] focus:border-blue-500 rounded p-2 text-xs text-white focus:outline-none font-mono text-[10px] leading-relaxed"
                    placeholder="Base de instruções cognitivas de sistema..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPersona}
                  className="w-full bg-[#202434] hover:bg-[#2c3248] disabled:bg-[#202434]/50 text-white text-xs font-semibold rounded py-2 transition cursor-pointer font-mono"
                >
                  {isSavingPersona ? 'Atualizando...' : 'Salvar Alterações da Persona'}
                </button>
              </form>
            </div>
          </div>

          {/* List Card: Objetivos */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5 shadow-md space-y-3">
            <span className="text-xs font-mono font-bold text-gray-300 uppercase block tracking-wider">Objetivos de Sucesso</span>
            
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {data.userProfile.objetivos.map((obj, i) => (
                <div key={i} className="flex justify-between items-center bg-[#090a0d] border border-[#1e202c] rounded px-2.5 py-1.5 text-[11px] group">
                  <span className="text-gray-300 truncate pr-2">{obj}</span>
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
                className="flex-1 bg-[#090a0d] border border-[#202330] rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                type="button"
                onClick={() => handleAddItem('objetivos', newObjetivo, () => setNewObjetivo(''))}
                className="bg-[#202434] hover:bg-[#2c3248] text-white p-1.5 rounded cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Card: Interesses */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5 shadow-md space-y-3">
            <span className="text-xs font-mono font-bold text-gray-300 uppercase block tracking-wider">Áreas de Interesse</span>
            
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {data.userProfile.interesses.map((int, i) => (
                <div key={i} className="flex justify-between items-center bg-[#090a0d] border border-[#1e202c] rounded px-2.5 py-1.5 text-[11px] group">
                  <span className="text-gray-300 truncate pr-2">{int}</span>
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
                className="flex-1 bg-[#090a0d] border border-[#202330] rounded px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
              />
              <button 
                type="button"
                onClick={() => handleAddItem('interesses', newInteresse, () => setNewInteresse(''))}
                className="bg-[#202434] hover:bg-[#2c3248] text-white p-1.5 rounded cursor-pointer"
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
