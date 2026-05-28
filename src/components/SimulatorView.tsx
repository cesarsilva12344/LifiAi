import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Sliders, RefreshCw, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { showToast } from './Toast';

interface SimulatorProps {
  theme?: 'light' | 'dark';
}

export default function SimulatorView({ theme = 'light' }: SimulatorProps) {
  const [months, setMonths] = useState(6);
  const [newHires, setNewHires] = useState(0);
  const [adSpend, setAdSpend] = useState(0);
  const [newDebt, setNewDebt] = useState(0);
  const [priceHike, setPriceHike] = useState(0);
  
  const [projection, setProjection] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          months,
          newHires,
          adSpend,
          newDebt,
          priceHike
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjection(data.projection);
        showToast('📈 Cenário simulado com sucesso!', 'success');
      } else {
        showToast('Erro ao processar simulação.', 'error');
      }
    } catch (_) {
      showToast('Falha na comunicação com o servidor.', 'error');
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
        chartGrid: '#222532',
        tooltipBg: '#111318',
        tooltipBorder: '#232738',
        tooltipText: '#fff'
      }
    : {
        cardBg: 'bg-white border-slate-200 text-slate-800',
        titleText: 'text-slate-850',
        subText: 'text-slate-500',
        divider: 'border-slate-100',
        formBg: 'bg-slate-50/60 border-slate-200',
        chartGrid: '#cbd5e1',
        tooltipBg: '#ffffff',
        tooltipBorder: '#cbd5e1',
        tooltipText: '#0f172a'
      };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Card */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors ${c.cardBg}`}>
        <div>
          <span className="text-[9px] font-mono font-black text-indigo-500 tracking-wider uppercase">Módulo Analítico</span>
          <h2 className={`text-xl font-bold tracking-tight mt-0.5 ${c.titleText}`}>Simulador Financeiro "E Se..." (What-If)</h2>
          <p className={`text-xs mt-0.5 ${c.subText}`}>Projete o fluxo de caixa do seu SaaS simulando contratações, orçamentos de publicidade ou flutuações de preços.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* 2. Sliders Form Panel (Left) */}
        <div className={`lg:col-span-2 p-5 border rounded-2xl shadow-md space-y-5 transition-colors ${c.cardBg}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Parâmetros de Cenários</h4>
          </div>

          <div className="space-y-4 text-xs">
            {/* Horizon Months */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400">
                <span>Horizonte Temporal:</span>
                <span className="text-indigo-400">{months} meses</span>
              </div>
              <input 
                type="range" min={3} max={18} step={1} value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* New Hires */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400">
                <span>Novas Contratações:</span>
                <span className="text-indigo-400">{newHires} colaboradores (-R$ 5.000,00/mês cada)</span>
              </div>
              <input 
                type="range" min={0} max={10} step={1} value={newHires}
                onChange={e => setNewHires(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Ad Spend */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400">
                <span>Aporte de Marketing / Anúncios:</span>
                <span className="text-indigo-400">R$ {adSpend.toLocaleString('pt-BR')}/mês</span>
              </div>
              <input 
                type="range" min={0} max={25000} step={1000} value={adSpend}
                onChange={e => setAdSpend(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* New Debt */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400">
                <span>Novos Financiamentos / Dívidas:</span>
                <span className="text-indigo-400">R$ {newDebt.toLocaleString('pt-BR')}/mês</span>
              </div>
              <input 
                type="range" min={0} max={15000} step={500} value={newDebt}
                onChange={e => setNewDebt(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Price Hike */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400">
                <span>Variação de Preço (SaaS):</span>
                <span className={`${priceHike >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{priceHike >= 0 ? '+' : ''}{priceHike}% de Receita</span>
              </div>
              <input 
                type="range" min={-30} max={50} step={5} value={priceHike}
                onChange={e => setPriceHike(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer select-none"
            >
              {loading ? 'Rodando Simulação...' : 'Projetar Cenário'}
            </button>
          </div>
        </div>

        {/* 3. Recharts Line Projection Panel (Right) */}
        <div className={`lg:col-span-3 p-5 border rounded-2xl shadow-md flex flex-col justify-between transition-colors ${c.cardBg}`}>
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider">Curva de Projeção de Caixa</h4>
              <span className="text-[9px] font-mono text-slate-400">Unidade: BRL</span>
            </div>

            {projection.length === 0 ? (
              <div className="py-24 text-center text-slate-400 font-mono text-xs">
                Ajuste os parâmetros à esquerda e clique em **Projetar Cenário** para renderizar o gráfico!
              </div>
            ) : (
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projection}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.chartGrid} />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={11} name="Mês" />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, color: c.tooltipText, borderRadius: '8px', fontSize: 11 }}
                    />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      activeDot={{ r: 6 }} 
                      name="Saldo Projetado" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {projection.length > 0 && (
            <div className={`text-[10px] leading-relaxed font-mono mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 ${c.subText} flex items-start gap-2`}>
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
              <span>
                {projection.some(p => p.risk === 'HIGH') 
                  ? '⚠️ ALERTA DE RISCO: A simulação acusa insolvência (saldo negativo) no horizonte projetado. Evite novos custos fixos sem aporte proporcional.'
                  : '✅ SAÚDE OK: A simulação acusa solidez contínua. Excelente margem operacional no horizonte projetado!'}
              </span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
