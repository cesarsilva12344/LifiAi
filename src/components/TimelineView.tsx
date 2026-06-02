import React, { useState } from 'react';
import { Clock, Filter, Sparkles, AlertCircle, FileText, CheckCircle, RefreshCw, Send, HelpCircle, Trash2 } from 'lucide-react';
import { DatabaseState, InboxItem } from '../types';
import { showToast } from './Toast';

interface TimelineViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function TimelineView({ data, onRefresh, theme = 'light' }: TimelineViewProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const getBadgeColor = (type: string) => {
    if (theme === 'dark') {
      switch (type) {
        case 'expense': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'income': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'task': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
        case 'reminder': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
        case 'goal': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'habit': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'note': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'idea': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
        case 'memory': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
        case 'chat': return 'bg-gray-500/10 text-gray-400 border-gray-600/20';
        default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      }
    } else {
      switch (type) {
        case 'expense': return 'bg-red-50 text-red-650 border-red-200';
        case 'income': return 'bg-emerald-50 text-emerald-650 border-emerald-200';
        case 'task': return 'bg-sky-50 text-sky-650 border-sky-200';
        case 'reminder': return 'bg-indigo-50 text-indigo-655 border-indigo-200';
        case 'goal': return 'bg-amber-50 text-amber-650 border-amber-200';
        case 'habit': return 'bg-orange-50 text-orange-650 border-orange-200';
        case 'note': return 'bg-purple-50 text-purple-655 border-purple-200';
        case 'idea': return 'bg-pink-50 text-pink-655 border-pink-200';
        case 'memory': return 'bg-teal-50 text-teal-655 border-teal-200';
        case 'chat': return 'bg-slate-100 text-slate-700 border-slate-200';
        default: return 'bg-blue-50 text-blue-650 border-blue-200';
      }
    }
  };

  const getHumanFriendlyType = (type: string) => {
    switch (type) {
      case 'expense': return 'Despesa';
      case 'income': return 'Receita';
      case 'task': return 'Tarefa';
      case 'reminder': return 'Lembrete';
      case 'goal': return 'Meta';
      case 'habit': return 'Hábito';
      case 'note': return 'Anotação';
      case 'idea': return 'Ideia';
      case 'memory': return 'Memória';
      case 'chat': return 'Chat Bot';
      default: return 'Não Classificado';
    }
  };

  const filteredInbox = data.inbox.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const categories = [
    { label: 'Todos', value: 'all' },
    { label: 'Despesas', value: 'expense' },
    { label: 'Receitas', value: 'income' },
    { label: 'Tarefas', value: 'task' },
    { label: 'Lembretes', value: 'reminder' },
    { label: 'Anotações', value: 'note' },
    { label: 'Ideias', value: 'idea' },
    { label: 'Memórias', value: 'memory' }
  ];

  // Dynamic theme variables for Premium Light/Dark cohesion
  const darkColors = {
    cardBg: 'bg-[#111318] border-[#1d202a] text-slate-100 shadow-lg',
    titleText: 'text-white',
    subText: 'text-slate-400',
    mutedText: 'text-gray-500',
    divider: 'border-[#1b1d28]',
    filterBg: 'bg-[#090a0d] border-[#1d202a]',
    filterHover: 'text-gray-400 hover:text-white hover:bg-[#161822]',
    itemCardBg: 'bg-[#111318] border-[#1e202a] text-gray-250 hover:border-[#2d3042]',
    badgeBg: 'bg-[#1a1d28] border border-[#2b2f3d] text-gray-450',
    extractedBg: 'bg-[#090a0d] border border-[#1a1c26] text-gray-400',
    extractedText: 'text-gray-300'
  };

  const lightColors = {
    cardBg: 'bg-white border-slate-200 text-slate-800 shadow-sm',
    titleText: 'text-slate-800',
    subText: 'text-slate-650',
    mutedText: 'text-slate-400',
    divider: 'border-slate-100',
    filterBg: 'bg-slate-50 border-slate-200',
    filterHover: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200',
    itemCardBg: 'bg-white border-slate-200 text-slate-700 hover:border-slate-350',
    badgeBg: 'bg-slate-100 border border-slate-200 text-slate-600',
    extractedBg: 'bg-slate-50 border border-slate-200 text-slate-500',
    extractedText: 'text-slate-700'
  };

  const c = theme === 'dark' ? darkColors : lightColors;

  return (
    <div className="space-y-6">
      {/* Header filter metrics */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border rounded-xl shadow transition-colors duration-200 ${c.cardBg}`}>
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${c.titleText}`}>Timeline do Inbox</h2>
          <p className={`text-xs mt-0.5 ${c.subText}`}>Fluxo cronológico unificado de todas as capturas recebidas em tempo real do Telegram.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium whitespace-nowrap ${c.subText}`}>Filtrar Categoria:</span>
          <div className={`flex items-center gap-1.5 rounded-lg p-1 max-w-[400px] overflow-x-auto select-none custom-scrollbar border transition-colors duration-200 ${c.filterBg}`}>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterType(cat.value)}
                className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded transition duration-200 cursor-pointer ${
                  filterType === cat.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : c.filterHover
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Capture log chronological flow */}
      <div className="space-y-4">
        {filteredInbox.length === 0 ? (
          <div className={`p-16 border rounded-xl text-center space-y-2 transition-colors duration-200 ${c.cardBg}`}>
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
            <p className={`text-xs font-mono font-bold ${c.mutedText}`}>Nenhuma captura registrada sob esse filtro.</p>
            <p className={`text-[11px] ${c.mutedText}`}>Mande mensagens pelo painel do Telegram no canto direito para popular!</p>
          </div>
        ) : (
          filteredInbox.map((item, index) => (
            <div 
              key={item.id}
              className={`p-5 border relative overflow-hidden rounded-xl shadow group transition-all duration-300 ${c.itemCardBg}`}
            >
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b ${c.divider}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded border tracking-wide uppercase ${getBadgeColor(item.type)}`}>
                    {getHumanFriendlyType(item.type)}
                  </span>
                  <span className={`text-[10px] flex items-center gap-1 font-mono ${c.mutedText}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${c.badgeBg}`}>
                    Canal: <strong className="font-bold">{item.source}</strong>
                  </span>
                  {item.processed && (
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-550/20 uppercase tracking-widest">
                      AI Indexado
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja excluir esta captura do inbox?')) {
                        try {
                          const res = await fetch(`/api/db/inbox/${item.id}`, {
                            method: 'DELETE'
                          });
                          if (res.ok) {
                            showToast('Captura do Inbox removida!', 'success');
                            onRefresh();
                          } else {
                            showToast('Erro ao remover captura.', 'error');
                          }
                        } catch (err: any) {
                          showToast(`Falha: ${err.message}`, 'error');
                        }
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition duration-200 cursor-pointer"
                    title="Remover do Inbox"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="py-4 text-xs md:text-sm leading-relaxed font-sans font-medium">
                {item.raw_content}
              </div>

              {/* Extra parsed visual parameters depending on entity */}
              <div className={`rounded-lg p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2 transition-colors duration-200 ${c.extractedBg}`}>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Extraído: </span>
                  <span className={`font-semibold ${c.extractedText}`}>
                    {item.type === 'expense' ? 'Despesa cadastrada automaticamente' : 
                     item.type === 'income' ? 'Registrado faturamento' :
                     item.type === 'task' ? 'Nova tarefa criada pendente' :
                     item.type === 'reminder' ? 'Lembrete catalogado' :
                     item.type === 'idea' ? 'Pensamento criativo arquivado com nota' :
                     'Informação indexada para insights gerais'}
                  </span>
                </div>
                <span className="text-[10px] font-mono">ID: {item.extracted_id || item.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

