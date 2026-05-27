import React from 'react';
import { Layers, Folder, PlayCircle, CheckSquare, BarChart, ArrowUpRight, Trash2 } from 'lucide-react';
import { DatabaseState, Project } from '../types';
import { showToast } from './Toast';

interface ProjectViewProps {
  data: DatabaseState;
  onRefresh: () => void;
}

export default function ProjectView({ data, onRefresh }: ProjectViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'planning': return 'bg-yellow-500/10 text-yellow-500/20 text-yellow-400';
      case 'on_hold': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-800 text-gray-400';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#111318] border border-[#1d202a] rounded-xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Projetos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visão unificada das iniciativas, alinhamento de entregáveis e progresso tático.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 font-mono uppercase block">Total Ativo</span>
          <span className="text-sm font-bold text-white font-mono">{data.projects.length} iniciativas</span>
        </div>
      </div>

      {/* Projects portfolio grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.projects.map((proj) => {
          // Find associated pending/completed tasks if matching names
          const relevantTasks = data.tasks.filter(t => 
            t.titulo.toLowerCase().includes(proj.nome.toLowerCase().split(' ')[0]) ||
            proj.descricao.toLowerCase().includes(t.titulo.toLowerCase().split(' ')[0])
          );

          return (
            <div 
              key={proj.id}
              className="p-5 bg-[#111318] border border-[#1e202a] rounded-xl hover:border-[#2a2c3c] transition duration-200 flex flex-col justify-between space-y-4 shadow"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-white tracking-wide truncate">{proj.nome}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <select
                      value={proj.status}
                      onChange={(e) => handleUpdateProject(proj.id, { status: e.target.value as any })}
                      className="text-[10px] font-semibold font-mono bg-[#090a0d] border border-[#1d202a] rounded px-1.5 py-0.5 text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="planning">Planejamento</option>
                      <option value="active">Ativo</option>
                      <option value="completed">Concluído</option>
                      <option value="on_hold">Em Espera</option>
                    </select>
                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition duration-200 cursor-pointer"
                      title="Excluir Projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">{proj.descricao}</p>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Progresso</span>
                  <span className="text-blue-400 font-bold">{proj.progresso}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={proj.progresso}
                  onChange={(e) => handleUpdateProject(proj.id, { progresso: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#1c1e28] rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
              </div>

              {/* Associated tasks listing */}
              <div className="pt-3 border-t border-[#1a1c25] space-y-1.5">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold block">Tarefas Relacionadas ({relevantTasks.length})</span>
                {relevantTasks.length === 0 ? (
                  <span className="text-[10px] text-gray-600 block italic">Nenhuma pendência mapeada com correlação direta.</span>
                ) : (
                  <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {relevantTasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center text-[11px] py-1 text-gray-300">
                        <span className={`truncate ${task.status === 'completed' ? 'line-through text-gray-600' : ''}`}>{task.titulo}</span>
                        <span className={`text-[8px] font-mono px-1 rounded uppercase min-w-[35px] text-center ${task.status === 'completed' ? 'bg-emerald-950/20 text-emerald-500' : 'bg-yellow-950/20 text-yellow-500'}`}>
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
  );
}
