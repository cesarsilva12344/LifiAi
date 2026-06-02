import React, { useState, useEffect } from 'react';
import { Calendar, HelpCircle, Eye, CheckCircle2, ChevronRight, Play, RefreshCw, Plus, X } from 'lucide-react';
import { DatabaseState, Decision } from '../types';
import { showToast } from './Toast';

interface DecisionJournalProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function DecisionJournalView({ data, onRefresh, theme = 'light' }: DecisionJournalProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ title: '', context: '', expected_outcome: '', review_at: '' });
  
  // Review Modal State
  const [reviewingDecision, setReviewingDecision] = useState<Decision | null>(null);
  const [actualOutcomeText, setActualOutcomeText] = useState('');

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.expected_outcome.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/db/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        showToast('📓 Decisão estratégica registrada com sucesso!', 'success');
        setForm({ title: '', context: '', expected_outcome: '', review_at: '' });
        setShowModal(false);
        onRefresh();
      } else {
        showToast('Erro ao criar decisão estratégica.', 'error');
      }
    } catch (_) {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReview = async () => {
    if (!reviewingDecision || !actualOutcomeText.trim()) return;
    setLoading(true);
    
    try {
      const res = await fetch(`/api/db/decisions/${reviewingDecision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_outcome: actualOutcomeText,
          reviewed: true,
          status: 'REVIEWED'
        })
      });

      if (res.ok) {
        showToast('✅ Loop de decisão revisado e fechado. Aprendizado gravado!', 'success');
        setReviewingDecision(null);
        setActualOutcomeText('');
        onRefresh();
      } else {
        showToast('Erro ao registrar desfecho.', 'error');
      }
    } catch (_) {
      showToast('Erro de conexão.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const c = isDark 
    ? {
        cardBg: 'bg-[#111318] border-[#1d202a] text-slate-100',
        titleText: 'text-white',
        subText: 'text-slate-400',
        divider: 'border-[#1b1c25]',
        formBg: 'bg-[#090a0d] border-[#1d202a]',
        rowBg: 'bg-[#090a0d]/60 border-[#1d202a]',
        inputBg: 'bg-[#090a0d] border-[#1d202a] text-white',
        timelineLine: 'bg-slate-800'
      }
    : {
        cardBg: 'bg-white border-slate-200 text-slate-800',
        titleText: 'text-slate-800',
        subText: 'text-slate-500',
        divider: 'border-slate-100',
        formBg: 'bg-slate-50/60 border-slate-200',
        rowBg: 'bg-white border-slate-200',
        inputBg: 'bg-white border-slate-250 text-slate-800',
        timelineLine: 'bg-slate-200'
      };

  const decisionsList = data.decisions || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Add Button */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors ${c.cardBg}`}>
        <div>
          <span className="text-[9px] font-mono font-black text-indigo-500 tracking-wider uppercase">Módulo Cognitivo</span>
          <h2 className={`text-xl font-bold tracking-tight mt-0.5 ${c.titleText}`}>Diário de Decisões (Decision Journal)</h2>
          <p className={`text-xs mt-0.5 ${c.subText}`}>Registre contextos, expectativas e revise loops de desfechos para aprendizado da IA.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer select-none"
        >
          <Plus size={16} /> Registrar Decisão
        </button>
      </div>

      {/* 2. Decision Timeline */}
      <div className={`p-6 border rounded-2xl shadow-md transition-colors relative ${c.cardBg}`}>
        <div className="border-b pb-3 mb-6 flex items-center justify-between border-slate-100 dark:border-slate-800">
          <span className="text-xs font-mono font-bold uppercase tracking-wider">Histórico de Decisões</span>
          <span className="text-[10px] font-mono text-slate-400">{decisionsList.length} decisões catalogadas</span>
        </div>

        {decisionsList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono leading-relaxed">
            Sem decisões registradas na sua linha temporal.<br />Clique acima para registrar a primeira!
          </div>
        ) : (
          <div className="relative pl-6 space-y-6">
            {/* The vertical timeline bar */}
            <div className={`absolute top-2 bottom-2 left-2.5 w-0.5 ${c.timelineLine}`}></div>

            {decisionsList.map((dec) => {
              const formattedDate = new Date(dec.created_at || Date.now()).toLocaleDateString('pt-BR', { dateStyle: 'short' });
              const isDue = new Date(dec.review_at) <= new Date() && !dec.reviewed;
              
              return (
                <div key={dec.id} className="relative group">
                  {/* Circle dot on timeline */}
                  <span className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border transition duration-200 ${
                    dec.reviewed
                      ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : isDue
                        ? 'bg-amber-500 border-amber-400 shadow-md shadow-amber-500/20 animate-pulse'
                        : 'bg-indigo-500 border-indigo-400'
                  }`} />

                  {/* Decision Box */}
                  <div className={`p-5 border rounded-2xl transition duration-200 ${c.rowBg} hover:border-indigo-400/50`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                      <h4 className="text-xs font-bold leading-snug">{dec.title}</h4>
                      <div className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase shrink-0">
                        <span className="text-slate-400">Data: {formattedDate}</span>
                        {dec.reviewed ? (
                          <span className="bg-emerald-50/70 text-emerald-600 border border-emerald-150 px-2 py-0.5 rounded-full">Revisada</span>
                        ) : isDue ? (
                          <button
                            onClick={() => setReviewingDecision(dec)}
                            className="bg-amber-50/80 hover:bg-amber-100 text-amber-600 border border-amber-250 px-2.5 py-0.5 rounded-full cursor-pointer animate-pulse select-none"
                          >
                            🔍 Pendente de Revisão
                          </button>
                        ) : (
                          <span className="bg-indigo-50/70 text-indigo-600 border border-indigo-150 px-2 py-0.5 rounded-full">Ativa</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 text-[11px] leading-relaxed">
                      {dec.context && (
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                          <strong>Contexto:</strong> {dec.context}
                        </p>
                      )}
                      <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        <strong>Desfecho Esperado:</strong> {dec.expected_outcome}
                      </p>
                      {dec.reviewed && dec.actual_outcome && (
                        <div className="pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-emerald-500">
                          <strong>Resultado Real & Desfecho:</strong> {dec.actual_outcome}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Add Decision Modal Dialogue */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border ${c.cardBg}`}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 font-mono">Registrar Decisão Estratégica</h3>
            
            <form onSubmit={handleCreateDecision} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Título / O que você está decidindo?*</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Contratar agência de Growth Q3"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition ${c.inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Contexto & Premissas</label>
                <textarea 
                  placeholder="Premissas, custos e alternativas consideradas..."
                  value={form.context}
                  onChange={e => setForm({...form, context: e.target.value})}
                  rows={2}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition resize-none ${c.inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Resultado Esperado / Hipótese de Sucesso*</label>
                <textarea 
                  required
                  placeholder="O que você espera que aconteça em 30/90 dias? Qual métrica validará?"
                  value={form.expected_outcome}
                  onChange={e => setForm({...form, expected_outcome: e.target.value})}
                  rows={3}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition resize-none ${c.inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Prazo para Revisão do Loop*</label>
                <input 
                  type="date"
                  required
                  value={form.review_at}
                  onChange={e => setForm({...form, review_at: e.target.value})}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition ${c.inputBg}`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                {loading ? 'Gravando...' : 'Gravar Decisão no Diário'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Review Decision Modal dialogue */}
      {reviewingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl relative border ${c.cardBg}`}>
            <button
              onClick={() => setReviewingDecision(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 font-mono">Fechar Loop de Decisão</h3>
            
            <div className="p-4 bg-slate-500/5 rounded-xl text-[11px] leading-relaxed mb-4">
              <h4 className="font-bold border-b border-white/5 pb-1 mb-2">{reviewingDecision.title}</h4>
              <p className="text-slate-400"><strong>Resultado Esperado:</strong></p>
              <p className="italic text-slate-300 mt-0.5">"{reviewingDecision.expected_outcome}"</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400">Desfecho Real / Lições Aprendidas*</label>
                <textarea 
                  required
                  placeholder="O que realmente aconteceu? A hipótese foi validada? Quais premissas falharam?"
                  value={actualOutcomeText}
                  onChange={e => setActualOutcomeText(e.target.value)}
                  rows={4}
                  className={`w-full rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium transition resize-none ${c.inputBg}`}
                />
              </div>

              <button
                onClick={handleResolveReview}
                disabled={loading || !actualOutcomeText.trim()}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                {loading ? 'Processando...' : 'Revisar & Salvar Desfecho'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
