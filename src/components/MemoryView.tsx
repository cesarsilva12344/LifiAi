import React, { useState } from 'react';
import { Search, BrainCircuit, Sparkles, Database, FileText, Lightbulb, Compass, MessageSquareCode } from 'lucide-react';
import { DatabaseState } from '../types';
import { showToast } from './Toast';

interface MemoryViewProps {
  data: DatabaseState;
  onRefresh: () => void;
}

interface SearchResult {
  item: any;
  type: 'note' | 'idea' | 'memory';
  score: number;
}

export default function MemoryView({ data, onRefresh }: MemoryViewProps) {
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
    switch (type) {
      case 'note': return <FileText className="w-4 h-4 text-purple-400" />;
      case 'idea': return <Lightbulb className="w-4 h-4 text-pink-400" />;
      case 'memory': return <BrainCircuit className="w-4 h-4 text-teal-400" />;
      default: return <Database className="w-4 h-4 text-gray-400" />;
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

  return (
    <div className="space-y-6">
      
      {/* Search Input block mimicking Raycast */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5 shadow-lg">
        <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 uppercase font-semibold">Mecanismo Vetorial Semântico</span>
        <h2 className="text-base font-bold text-white tracking-tight mt-1 mb-3 uppercase">Segundo Cérebro Inteligente</h2>
        
        <form onSubmit={handleSemanticSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquise sobre investimentos, SaaS, MVP, estudos no postgres, hacks..."
              className="w-full bg-[#090a0d] border border-[#202330] focus:border-teal-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800/10 text-white font-medium text-xs rounded-lg px-4 transition cursor-pointer"
          >
            {searching ? 'Pesquisando...' : 'Pesquisar Semântico'}
          </button>
        </form>
      </div>

      {/* Manual Memory Register Form */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5 shadow-lg">
        <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 uppercase font-semibold">Gravação Manual Cognitiva</span>
        <h2 className="text-base font-bold text-white tracking-tight mt-1 mb-3 uppercase">Gravar Nova Memória</h2>
        
        <form onSubmit={handleCreateMemory} className="flex gap-2">
          <input
            type="text"
            required
            value={newMemoryText}
            onChange={(e) => setNewMemoryText(e.target.value)}
            placeholder="Fato, anotação importante ou recordação para o banco vetorial..."
            className="flex-1 bg-[#090a0d] border border-[#202330] focus:border-teal-500 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs rounded-lg px-4 transition cursor-pointer"
          >
            Gravar Memória
          </button>
        </form>
      </div>

      {/* Semantic Results Listing */}
      {query && (
        <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-[#1b1c25] pb-3 mb-4 font-mono text-xs">
            <span className="text-gray-400 uppercase font-semibold">Resultados do Índice Vetorial ({results.length})</span>
            <span className="text-teal-400">Query: "{query}"</span>
          </div>

          {searching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-t-teal-400 border-gray-700 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500 font-mono">Processando similaridade de cosseno...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-600 font-mono">
              Nenhuma correlação vetorial encontrada acima da similaridade de corte.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((res, i) => (
                <div 
                  key={i}
                  className="p-4 bg-[#090a0d] border border-[#1d202d] rounded-xl hover:border-teal-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between border-b border-[#1a1c27]/60 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {getSourceIcon(res.type)}
                      <span className="text-gray-200">{getSourceTypeHuman(res.type)}</span>
                      {res.type === 'idea' && <span className="text-[10px] text-pink-400 bg-pink-950/20 px-1.5 py-0.5 rounded ml-1">Score: {res.item.score}/10</span>}
                    </div>
                    <span className="text-[10px] bg-teal-950/30 text-teal-400 font-mono px-2 py-0.5 rounded border border-teal-800/20">
                      Confiança: {(res.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {res.item.titulo && <h4 className="text-xs font-bold text-white mb-1.5">{res.item.titulo}</h4>}
                  <p className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">{res.item.conteudo || res.item.raw_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Natural Q&A Assistant Mode using Active Persona */}
      <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl"></div>
        <div>
          <div className="flex border-b border-[#1b1c25] pb-3 mb-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-wide">PERGUNTE À PERSONA ({activePersona.nome})</h3>
            </div>
            <span className="text-[10px] text-gray-500 font-mono uppercase">Linguagem Natural Contextualizada</span>
          </div>

          <p className="text-xs text-gray-400 mb-4 font-sans leading-relaxed">
            Consulte seus dados por voz textual. O assistente usará as melhores correspondências de suas memórias estruturadas para responder sob seu personagem.
          </p>

          <form onSubmit={handleAskPersona} className="flex gap-2 mb-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Qual foi a ideia de OCR que registrei antes?"
              className="flex-1 bg-[#090a0d] border border-[#202330] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans"
            />
            <button
              type="submit"
              disabled={qaLoading || !question.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800/20 text-white font-medium text-xs rounded-lg px-4 transition cursor-pointer"
            >
              {qaLoading ? 'Pensando...' : 'Enviar Pergunta'}
            </button>
          </form>

          {/* Persona text output inside bubble */}
          {(qaAnswer || qaLoading) && (
            <div className="p-4 bg-[#090a0d] border border-[#1f212a] rounded-xl space-y-2 mt-4">
              <div className="flex items-center gap-1.5 text-amber-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                <MessageSquareCode className="w-4 h-4 text-amber-400" />
                <span>Resposta de {activePersona.nome}</span>
              </div>
              {qaLoading ? (
                <div className="flex space-x-1 py-4">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              ) : (
                <p className="text-xs text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">{qaAnswer}</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
