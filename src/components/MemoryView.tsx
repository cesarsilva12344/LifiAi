import React, { useState } from 'react';
import { Search, BrainCircuit, Sparkles, Database, FileText, Lightbulb, Compass, MessageSquareCode } from 'lucide-react';
import { DatabaseState } from '../types';
import { showToast } from './Toast';

interface MemoryViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

interface SearchResult {
  item: any;
  type: 'note' | 'idea' | 'memory';
  score: number;
}

export default function MemoryView({ data, onRefresh, theme = 'light' }: MemoryViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // New Memory text state
  const [newMemoryText, setNewMemoryText] = useState('');

  // Q&A States
  const [question, setQuestion] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState('');

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/semantic-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = await res.json();
        setResults(body);
      }
    } catch (err) {
      console.error('Falha no busca semântica:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    try {
      const res = await fetch('/api/db/memories/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: newMemoryText })
      });
      if (res.ok) {
        showToast('Memória gravada e indexada no cérebro!', 'success');
        setNewMemoryText('');
        onRefresh();
      } else {
        showToast('Erro ao registrar memória.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleAskPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setQaLoading(true);
    setQaAnswer('');
    try {
      const response = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `/ask ${question}` })
      });
      if (response.ok) {
        const body = await response.json();
        setQaAnswer(body.response || 'Infelizmente não foi possível estruturar a resposta.');
      }
    } catch (err) {
      console.error('Erro de QA na Persona:', err);
    } finally {
      setQaLoading(false);
    }
  };

  const getSourceIcon = (type: string) => {
    const isDark = theme === 'dark';
    switch (type) {
      case 'note': return <FileText className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />;
      case 'idea': return <Lightbulb className={`w-4 h-4 ${isDark ? 'text-pink-400' : 'text-pink-605'}`} />;
      case 'memory': return <BrainCircuit className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />;
      default: return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  const getSourceTypeHuman = (type: string) => {
    switch (type) {
      case 'note': return 'Anotação / Nota';
      case 'idea': return 'Lampejo de Ideia';
      case 'memory': return 'Fato de Memória Longa';
      default: return 'Dados';
    }
  };

  const activePersona = data.personas.find(p => p.ativa) || data.personas[0];

  // Dynamic theme variables for Premium Light/Dark cohesion
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1e202a] text-slate-100 shadow-lg',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1c25]',
    inputBg: 'bg-[#090a0d] border-[#202330] text-white placeholder-gray-500',
    inputFocus: 'focus:border-teal-500 focus:ring-teal-500/25',
    rowBg: 'bg-[#090a0d] border-[#1d202d] text-slate-300 hover:border-teal-500/30',
    responseBg: 'bg-[#090a0d] border-[#1f212a] text-gray-250',
    accentText: 'text-teal-400',
    accentBadge: 'bg-teal-950/30 text-teal-400 border-teal-800/20'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800 shadow-sm',
    titleText: 'text-slate-800',
    subText: 'text-slate-600',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    inputBg: 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400',
    inputFocus: 'focus:border-teal-650 focus:ring-teal-650/20',
    rowBg: 'bg-slate-50 border-slate-200 text-slate-700 hover:border-teal-555/30',
    responseBg: 'bg-slate-50 border-slate-200 text-slate-800',
    accentText: 'text-teal-600',
    accentBadge: 'bg-teal-50 text-teal-650 border-teal-200'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="space-y-6">
      
      {/* Search Input block mimicking Raycast */}
      <div className={`border rounded-xl p-5 transition-colors duration-200 ${c.cardBg}`}>
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase font-semibold ${c.accentText}`}>Mecanismo Vetorial Semântico</span>
        <h2 className={`text-base font-bold tracking-tight mt-1 mb-3 uppercase ${c.titleText}`}>Segundo Cérebro Inteligente</h2>
        
        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise sobre investimentos, SaaS, MVP, estudos no postgres, hacks..."
              className={`w-full rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 transition font-sans ${c.inputBg} ${c.inputFocus}`}
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800/10 text-white font-semibold text-xs rounded-lg px-4 transition cursor-pointer font-mono uppercase tracking-wider"
          >
            {searching ? 'Pesquisando...' : 'Pesquisar Semântico'}
          </button>
        </form>
      </div>

      {/* Manual Memory Register Form */}
      <div className={`border rounded-xl p-5 transition-colors duration-200 ${c.cardBg}`}>
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase font-semibold ${c.accentText}`}>Gravação Manual Cognitiva</span>
        <h2 className={`text-base font-bold tracking-tight mt-1 mb-3 uppercase ${c.titleText}`}>Gravar Nova Memória</h2>
        
        <form onSubmit={handleCreateMemory} className="flex gap-2">
          <input
            type="text"
            required
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder="Fato, anotação importante ou recordação para o banco vetorial..."
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-1 transition font-sans ${c.inputBg} ${c.inputFocus}`}
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg px-4 transition cursor-pointer font-mono uppercase tracking-wider"
          >
            Gravar Memória
          </button>
        </form>
      </div>

      {/* Semantic Results Listing */}
      {query && (
        <div className={`border rounded-xl p-5 transition-colors duration-200 ${c.cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 mb-4 font-mono text-xs ${c.divider}`}>
            <span className={`${c.subText} uppercase font-semibold`}>Resultados do Índice Vetorial ({results.length})</span>
            <span className={c.accentText}>Query: "{query}"</span>
          </div>

          {searching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-t-teal-500 border-slate-300 rounded-full animate-spin"></div>
              <span className={`text-xs font-mono ${c.mutedText}`}>Processando similaridade de cosseno...</span>
            </div>
          ) : results.length === 0 ? (
            <div className={`py-12 text-center text-xs font-mono ${c.mutedText}`}>
              Nenhuma correlação vetorial encontrada acima da similaridade de corte.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((res, i) => (
                <div 
                  key={i}
                  className={`p-4 border rounded-xl transition-all duration-300 ${c.rowBg}`}
                >
                  <div className={`flex items-center justify-between border-b pb-2.5 mb-2.5 ${c.divider}`}>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {getSourceIcon(res.type)}
                      <span>{getSourceTypeHuman(res.type)}</span>
                      {res.type === 'idea' && <span className="text-[10px] text-pink-500 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded ml-1">Score: {res.item.score}/10</span>}
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.accentBadge}`}>
                      Confiança: {(res.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {res.item.titulo && <h4 className={`text-xs font-bold mb-1.5 ${c.titleText}`}>{res.item.titulo}</h4>}
                  <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{res.item.conteudo || res.item.raw_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Natural Q&A Assistant Mode using Active Persona */}
      <div className={`border rounded-xl p-6 relative overflow-hidden flex flex-col justify-between transition-colors duration-200 ${c.cardBg}`}>
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
        <div>
          <div className={`flex border-b pb-3 mb-4 items-center justify-between ${c.divider}`}>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              <h3 className={`text-sm font-semibold tracking-wide uppercase ${c.titleText}`}>PERGUNTE À PERSONA ({activePersona.nome})</h3>
            </div>
            <span className={`text-[10px] font-mono uppercase ${c.mutedText}`}>Linguagem Natural Contextualizada</span>
          </div>

          <p className={`text-xs mb-4 font-sans leading-relaxed ${c.subText}`}>
            Consulte seus dados por voz textual. O assistente usará as melhores correspondências de suas memórias estruturadas para responder sob seu personagem.
          </p>

          <form onSubmit={handleAskPersona} className="flex gap-2 mb-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Qual foi a ideia de OCR que registrei antes?"
              className={`flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans transition ${c.inputBg}`}
            />
            <button
              type="submit"
              disabled={qaLoading || !question.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800/20 text-white font-semibold text-xs rounded-lg px-4 transition cursor-pointer font-mono uppercase tracking-wider"
            >
              {qaLoading ? 'Pensando...' : 'Enviar Pergunta'}
            </button>
          </form>

          {/* Persona text output inside bubble */}
          {(qaAnswer || qaLoading) && (
            <div className={`p-4 border rounded-xl space-y-2 mt-4 transition-colors duration-200 ${c.responseBg}`}>
              <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                <MessageSquareCode className="w-4 h-4 text-amber-500" />
                <span>Resposta de {activePersona.nome}</span>
              </div>
              {qaLoading ? (
                <div className="flex space-x-1 py-4 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              ) : (
                <p className="text-xs leading-relaxed font-sans whitespace-pre-wrap">{qaAnswer}</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

