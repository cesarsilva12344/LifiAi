import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Sun, CheckSquare, Zap, DollarSign } from 'lucide-react';
import { DatabaseState } from '../types';
import { showToast } from './Toast';

interface DailyBriefingCardProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function DailyBriefingCard({ data, onRefresh, theme = 'light' }: DailyBriefingCardProps) {
  const [briefingText, setBriefingText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchBriefing = async (forceGenerate = false) => {
    setLoading(true);
    try {
      if (forceGenerate) {
        showToast('🌅 Gerando briefing matinal com IA...', 'info');
        const res = await fetch('/api/db/generate-briefing', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setBriefingText(data.text);
          showToast('✅ Briefing matinal atualizado!', 'success');
          onRefresh();
          return;
        }
      }

      // Read from existing local state
      const briefings = data.briefings || [];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBriefing = briefings.find(b => b.date === todayStr);

      if (todayBriefing) {
        setBriefingText(todayBriefing.content);
      } else {
        // Run auto generator mock
        const res = await fetch('/api/db/generate-briefing', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setBriefingText(data.text);
        }
      }
    } catch (_) {
      console.warn('Erro ao conectar ao gerador de briefings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing(false);
  }, [data.briefings]);

  const isDark = theme === 'dark';
  const c = isDark 
    ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-indigo-950/20 border-slate-800 text-slate-100'
    : 'bg-gradient-to-br from-white via-white to-indigo-50/20 border-slate-200 text-slate-800';

  if (!briefingText) return null;

  return (
    <div className={`p-5 rounded-2xl border shadow-md relative overflow-hidden transition duration-300 ${c}`}>
      {/* Decorative Blur Backing */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>

      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-3.5 z-10 relative">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />
          <div>
            <span className="text-[9px] font-mono font-black text-indigo-500 tracking-wider uppercase">Executive Digest</span>
            <h3 className="text-xs font-bold uppercase tracking-wider mt-0.5">Briefing Matinal de Performance</h3>
          </div>
        </div>

        <button
          onClick={() => fetchBriefing(true)}
          disabled={loading}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
          title="Regerar Briefing com IA"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="text-[11px] leading-relaxed whitespace-pre-line z-10 relative space-y-2">
        {briefingText}
      </div>
    </div>
  );
}
