import React from 'react';
import { 
  LayoutGrid, Clock, DollarSign, Layers, Flame, BrainCircuit, User, HelpCircle, AlertTriangle, Calendar 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telegramOpen: boolean;
  setTelegramOpen: (open: boolean) => void;
  appName: string;
}

export default function Sidebar({ activeTab, setActiveTab, telegramOpen, setTelegramOpen, appName }: SidebarProps) {
  const [botStatus, setBotStatus] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/telegram/status');
        if (res.ok) setBotStatus(await res.json());
      } catch (_) {}
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'calendar', label: 'Google Agenda', icon: <Calendar className="w-4 h-4" /> },
    { id: 'finances', label: 'Finanças', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'projects', label: 'Projetos', icon: <Layers className="w-4 h-4" /> },
    { id: 'goals', label: 'Hábitos & Metas', icon: <Flame className="w-4 h-4" /> },
    { id: 'memory', label: 'Memória Inteligente', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'profile', label: 'Personas & Perfil', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="w-64 bg-[#0d0e11] border-r border-[#1a1c23] flex flex-col justify-between h-full text-gray-400">
      <div>
        {/* Branding Logo */}
        <div className="p-6 border-b border-[#1a1c23] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-mono text-xs font-bold text-white shadow">
              L
            </div>
            <span className="font-mono text-sm font-bold tracking-widest text-white uppercase">{appName}</span>
          </div>
          <span className="text-[8px] font-bold font-mono text-blue-400 bg-blue-950/40 border border-blue-800/25 px-1.5 py-0.5 rounded uppercase tracking-wide">
            v1.0
          </span>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase block px-3 mb-2.5">
            Menu Operacional
          </span>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg font-medium transition duration-200 cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10 font-bold'
                  : 'hover:text-white hover:bg-[#151720] border border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bot status indicator */}
      <div className="px-4 py-2.5 mx-4 mb-4 bg-[#111318]/50 border border-[#1e202a] rounded-lg flex items-center justify-between text-[10px] font-mono">
        <span className="text-gray-500">Telegram Bot:</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            botStatus?.configured 
              ? 'bg-emerald-500 animate-pulse' 
              : botStatus?.hasToken 
                ? 'bg-amber-500' 
                : 'bg-gray-600'
          }`}></div>
          <span className="font-bold text-gray-300">
            {botStatus?.configured 
              ? 'ATIVO' 
              : botStatus?.hasToken 
                ? 'SEM CHAT ID' 
                : 'DESATIVADO'}
          </span>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-[#1a1c23] space-y-2">
        {/* Telegram operator drawer toggle */}
        <button
          onClick={() => setTelegramOpen(!telegramOpen)}
          className={`w-full text-xs font-mono py-2 rounded-lg border flex items-center justify-center gap-2 font-bold cursor-pointer transition select-none ${
            telegramOpen 
              ? 'bg-blue-950/30 text-blue-400 border-blue-800/30 hover:border-blue-500' 
              : 'bg-[#151720] text-gray-300 border-[#2b2f3d] hover:text-white hover:border-gray-500'
          }`}
        >
          <span>💬 Operator: {telegramOpen ? 'Visible' : 'Hidden'}</span>
        </button>

        <div className="text-[10px] text-gray-600 font-mono text-center flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span>Desktop Optimized</span>
        </div>
      </div>
    </div>
  );
}
