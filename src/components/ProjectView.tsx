import React, { useState } from 'react';
import { 
  Folder, PlayCircle, Layers, CheckSquare, Trash2, Clock, 
  Search, X, Plus, ChevronRight, BarChart 
} from 'lucide-react';
import { DatabaseState, Project } from '../types';
import { showToast } from './Toast';

interface ProjectViewProps {
  data: DatabaseState;
  onRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function ProjectView({ data, onRefresh, theme = 'light' }: ProjectViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'TODOS' | 'active' | 'on_hold' | 'completed' | 'planning'>('TODOS');
  
  // Drawer (slide-over) State
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  
  // Creation Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'planning' | 'active' | 'completed' | 'on_hold'>('planning');

  // Colors mapping for client avatar circles
  const clientColors: { [key: string]: { bg: string; text: string } } = {
    A: { bg: 'bg-emerald-50 border-emerald-250', text: 'text-emerald-500' },
    B: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    C: { bg: 'bg-pink-50 border-pink-200', text: 'text-pink-600' },
    D: { bg: 'bg-purple-50 border-purple-250', text: 'text-purple-600' },
    E: { bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-600' },
    F: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-500' },
    G: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-600' },
    V: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-600' },
  };

  const getClientColor = (clientName: string) => {
    const firstLetter = (clientName || 'G').charAt(0).toUpperCase();
    return clientColors[firstLetter] || { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600' };
  };

  // API wrappers
  const handleUpdateProject = async (id: string, fields: Partial<Project>) => {
    try {
      const res = await fetch(`/api/db/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      if (res.ok) {
        showToast('Projeto atualizado!', 'success');
        onRefresh();
      } else {
        showToast('Erro ao atualizar projeto.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha: ${err.message}`, 'error');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        const res = await fetch(`/api/db/projects/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast('Projeto excluído com sucesso!', 'success');
          onRefresh();
        } else {
          showToast('Erro ao excluir projeto.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha: ${err.message}`, 'error');
      }
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      showToast('Nome do projeto é obrigatório!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/db/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newProjectName,
          descricao: newProjectDesc,
          cliente: newProjectClient.trim() || 'Iniciativas Gerais',
          status: newProjectStatus,
          progresso: 0
        })
      });
      if (res.ok) {
        showToast('Projeto criado com sucesso!', 'success');
        setShowNewModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
        setNewProjectClient('');
        setNewProjectStatus('planning');
        onRefresh();
      } else {
        showToast('Erro ao criar projeto.', 'error');
      }
    } catch (err: any) {
      showToast(`Falha ao criar: ${err.message}`, 'error');
    }
  };

  // Metrics calculation
  const totalCount = data.projects.length;
  const activeCount = data.projects.filter(p => p.status === 'active').length;
  const holdCount = data.projects.filter(p => p.status === 'on_hold').length;
  const completedCount = data.projects.filter(p => p.status === 'completed').length;
  const planningCount = data.projects.filter(p => p.status === 'planning').length;

  const metrics = [
    { label: 'TOTAL', count: totalCount, icon: <Folder className="w-4 h-4" />, colorClass: 'text-blue-600', bgClass: 'bg-blue-50 border-blue-100' },
    { label: 'EM ANDAMENTO', count: activeCount, icon: <PlayCircle className="w-4 h-4" />, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-100' },
    { label: 'PAUSADOS', count: holdCount, icon: <Layers className="w-4 h-4" />, colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-100' },
    { label: 'ENCERRADOS', count: completedCount, icon: <CheckSquare className="w-4 h-4" />, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-100' },
    { label: 'CANCELADOS', count: 0, icon: <Trash2 className="w-4 h-4" />, colorClass: 'text-slate-400', bgClass: 'bg-slate-50 border-slate-200' },
    { label: 'NÃO INICIADOS', count: planningCount, icon: <Clock className="w-4 h-4" />, colorClass: 'text-purple-600', bgClass: 'bg-purple-50 border-purple-100' },
  ];

  // Filtering projects
  const filteredProjects = data.projects.filter((proj) => {
    // 1. Filter by search term
    const matchesSearch = 
      proj.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj.cliente && proj.cliente.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Filter by status tag
    const matchesStatus = activeFilter === 'TODOS' || proj.status === activeFilter;

    return matchesSearch && matchesStatus;
  });

  // Grouping filtered projects by client
  const groupedProjects: { [client: string]: Project[] } = {};
  filteredProjects.forEach((p) => {
    const client = p.cliente || 'Iniciativas Gerais';
    if (!groupedProjects[client]) {
      groupedProjects[client] = [];
    }
    groupedProjects[client].push(p);
  });

  const getProjectsByClient = (clientName: string) => {
    return data.projects.filter(p => (p.cliente || 'Iniciativas Gerais') === clientName);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Novo Projeto Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Portfólio de Projetos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Visão consolidada de todas as iniciativas por cliente.</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg px-4 py-2.5 shadow hover:shadow-md transition cursor-pointer flex items-center gap-1.5 self-start sm:self-center uppercase tracking-wide font-mono"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* 2. Portfolio metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {metrics.map((m, idx) => (
          <div 
            key={idx} 
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between h-[82px] hover:border-slate-350 transition duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider">{m.label}</span>
              <div className={`p-1 rounded-md ${m.bgClass} ${m.colorClass}`}>
                {m.icon}
              </div>
            </div>
            <h4 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{m.count}</h4>
          </div>
        ))}
      </div>

      {/* 3. Search and Category filter pill-bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por projeto ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 text-[10px] font-mono font-bold tracking-wide">
          <button
            onClick={() => setActiveFilter('TODOS')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer uppercase ${
              activeFilter === 'TODOS'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer uppercase ${
              activeFilter === 'active'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'
            }`}
          >
            Em Andamento
          </button>
          <button
            onClick={() => setActiveFilter('on_hold')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer uppercase ${
              activeFilter === 'on_hold'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'
            }`}
          >
            Pausados
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer uppercase ${
              activeFilter === 'completed'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'
            }`}
          >
            Encerrados
          </button>
          <button
            onClick={() => setActiveFilter('planning')}
            className={`px-3 py-1.5 rounded-lg border transition cursor-pointer uppercase ${
              activeFilter === 'planning'
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-350'
            }`}
          >
            Não Iniciados
          </button>
        </div>
      </div>

      {/* 4. Client Grouped Portfolio Grid */}
      {Object.keys(groupedProjects).length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm space-y-2">
          <p className="text-xs text-slate-500">Nenhum projeto encontrado correspondendo aos filtros ativos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(groupedProjects).map((client) => {
            const clientProjs = groupedProjects[client];
            const color = getClientColor(client);
            const initialLetter = client.charAt(0).toUpperCase();

            return (
              <div 
                key={client}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-350 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${color.bg} ${color.text}`}>
                    {initialLetter}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{client}</h3>
                    <span className="text-[9px] font-bold font-mono text-slate-400 tracking-wider">
                      {clientProjs.length} {clientProjs.length === 1 ? 'PROJETO' : 'PROJETOS'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <button 
                    onClick={() => setSelectedClient(client)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 hover:translate-x-0.5 transition cursor-pointer select-none"
                  >
                    <span>VER DETALHAMENTO</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. SLIDE-OVER DRAWER (Detalhes do Cliente) */}
      {selectedClient && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex justify-end transition-opacity duration-300">
          <div className="fixed inset-0" onClick={() => setSelectedClient(null)}></div>
          
          <div className="relative w-full max-w-lg bg-[#f8fafc] h-full shadow-2xl flex flex-col overflow-hidden z-50 animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide">Iniciativas: {selectedClient}</h3>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {getProjectsByClient(selectedClient).length} PROJETOS TÁTICOS
                </span>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              {getProjectsByClient(selectedClient).map((proj) => {
                const relevantTasks = data.tasks.filter(t => 
                  t.titulo.toLowerCase().includes(proj.nome.toLowerCase().split(' ')[0]) ||
                  proj.descricao.toLowerCase().includes(t.titulo.toLowerCase().split(' ')[0])
                );

                return (
                  <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{proj.nome}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{proj.descricao}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          value={proj.status}
                          onChange={(e) => handleUpdateProject(proj.id, { status: e.target.value as any })}
                          className="text-[9px] font-bold font-mono bg-slate-50 border border-slate-200 hover:border-slate-350 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none cursor-pointer uppercase"
                        >
                          <option value="planning">Não Iniciado</option>
                          <option value="active">Em Andamento</option>
                          <option value="completed">Concluído</option>
                          <option value="on_hold">Pausado</option>
                        </select>
                        
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition duration-200 cursor-pointer"
                          title="Excluir Projeto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono font-bold">
                        <span className="text-slate-400 uppercase">Progresso</span>
                        <span className="text-blue-600">{proj.progresso}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={proj.progresso}
                        onChange={(e) => handleUpdateProject(proj.id, { progresso: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                      />
                    </div>

                    {/* Associated Tasks */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-bold block">
                        Tarefas Relacionadas ({relevantTasks.length})
                      </span>
                      {relevantTasks.length === 0 ? (
                        <span className="text-[10px] text-slate-400 block italic">Nenhuma pendência mapeada.</span>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {relevantTasks.map(task => (
                            <div key={task.id} className="flex justify-between items-center text-[10px] py-1 text-slate-600">
                              <span className={`truncate pr-2 ${task.status === 'completed' ? 'line-through text-slate-400 font-light' : ''}`}>{task.titulo}</span>
                              <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold min-w-[35px] text-center ${
                                task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {task.status === 'completed' ? 'done' : 'todo'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. NOVO PROJETO MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setShowNewModal(false)}></div>
          
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-6 z-50 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Criar Novo Projeto</h3>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Nome do Projeto</label>
                <input 
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  placeholder="Ex: Refatoração de UI"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Nome do Cliente / Organização</label>
                <input 
                  type="text"
                  value={newProjectClient}
                  onChange={(e) => setNewProjectClient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans font-semibold"
                  placeholder="Ex: Alelo (ou deixe em branco para 'Geral')"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Descrição Curta</label>
                <textarea 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ex: Reestruturação visual e responsiva das views de portfólio..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold block">Status Inicial</label>
                <select
                  value={newProjectStatus}
                  onChange={(e) => setNewProjectStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-blue-500 rounded-lg p-2 text-xs text-slate-700 focus:outline-none font-sans"
                >
                  <option value="planning">Não Iniciado (Planejamento)</option>
                  <option value="active">Em Andamento (Ativo)</option>
                  <option value="completed">Concluído</option>
                  <option value="on_hold">Pausado (Em Espera)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold font-mono">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer transition uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer transition uppercase"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
