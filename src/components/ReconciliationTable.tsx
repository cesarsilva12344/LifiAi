import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { showToast } from './Toast';

interface ReconciliationTableProps {
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function ReconciliationTable({ onRefresh, theme = 'light' }: ReconciliationTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/financial-reconciliation');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (_) {
      showToast('Falha ao obter dados de conciliação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliation();
  }, [onRefresh]);

  const isDark = theme === 'dark';
  const c = isDark 
    ? {
        cardBg: 'bg-[#111318] border-[#1d202a] text-slate-100',
        tableHeader: 'bg-[#090a0d] border-[#1d202a] text-slate-400',
        rowHover: 'hover:bg-slate-900/40 border-[#1d202a]',
        titleText: 'text-white'
      }
    : {
        cardBg: 'bg-white border-slate-200 text-slate-800',
        tableHeader: 'bg-slate-50 border-slate-150 text-slate-550',
        rowHover: 'hover:bg-slate-50 border-slate-150',
        titleText: 'text-slate-800'
      };

  return (
    <div className={`border rounded-2xl shadow-md overflow-hidden transition-colors ${c.cardBg}`}>
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider ${c.titleText}`}>Conciliação Financeira (Planejado vs Real)</h4>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sincronização reativa de limites orçamentários por categoria</p>
        </div>
        <button 
          onClick={fetchReconciliation}
          disabled={loading}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto text-xs">
        {loading ? (
          <div className="py-20 text-center text-slate-400 font-mono">Carregando conciliação...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-mono leading-relaxed">
            Sem orçamentos planejados catalogados.<br />Use o importador de planilhas acima para gerar orçamentos imediatos!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[10px] font-mono font-bold uppercase tracking-wider ${c.tableHeader}`}>
                <th className="p-3.5 pl-6">Categoria</th>
                <th className="p-3.5">Mês/Ano</th>
                <th className="p-3.5 text-right">Planejado</th>
                <th className="p-3.5 text-right">Realizado</th>
                <th className="p-3.5 text-right">Diferença</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row) => {
                const diff = row.diferenca;
                const isOk = row.status_conciliacao === 'OK';
                
                return (
                  <tr key={row.id} className={`transition duration-150 ${c.rowHover}`}>
                    <td className="p-3.5 pl-6 font-bold truncate max-w-[120px]">{row.category_id?.name}</td>
                    <td className="p-3.5 font-mono text-slate-400">{row.mes.toString().padStart(2, '0')}/{row.ano}</td>
                    <td className="p-3.5 text-right font-mono">R$ {row.valor_planejado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3.5 text-right font-mono font-bold">R$ {row.valor_realizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3.5 text-right font-mono font-bold ${
                      diff >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {diff >= 0 ? '+' : '-'} R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isOk 
                            ? 'bg-emerald-50/70 text-emerald-600 border-emerald-150' 
                            : 'bg-amber-50/70 text-amber-600 border-amber-150 animate-pulse'
                        }`}>
                          {isOk ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              OK
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Estouro
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
