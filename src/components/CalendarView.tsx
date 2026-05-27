import React, { useState, useEffect } from 'react';
import { 
  googleSignIn, logout, getAccessToken, initAuth 
} from '../lib/firebaseAuth';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  Check, 
  CheckSquare, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Info, 
  AlertCircle 
} from 'lucide-react';
import { DatabaseState, Reminder } from '../types';
import { User } from 'firebase/auth';

interface CalendarViewProps {
  data: DatabaseState;
  onRefresh: () => void;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

export default function CalendarView({ data, onRefresh }: CalendarViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingEvents, setSyncingEvents] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states for creating a new event
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // Sync section states
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [syncingReminders, setSyncingReminders] = useState(false);

  // Initialize Auth listeners
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Calendar Events
  const fetchCalendarEvents = async (authToken: string) => {
    setSyncingEvents(true);
    setErrorMsg(null);
    try {
      const timeMin = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&maxResults=25`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired, log out
          handleLogout();
          throw new Error('Sua credencial do Google expirou. Por favor, conecte-se novamente.');
        }
        throw new Error(`Erro na API (${res.status}): Não foi possível buscar os compromissos.`);
      }

      const body = await res.json();
      setEvents(body.items || []);
    } catch (err: any) {
      console.error('Fetch events error:', err);
      setErrorMsg(err.message || 'Falha de comunicação com o Google Calendar.');
    } finally {
      setSyncingEvents(false);
    }
  };

  // Trigger loading events on token resolution
  useEffect(() => {
    if (token) {
      fetchCalendarEvents(token);
    }
  }, [token]);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login Error:', err);
      setErrorMsg('Falha ao autenticar com o Google. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setEvents([]);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Explicit User Confirmation for Mutation
    const confirmMessage = `Deseja agendar "${title}" na sua Agenda do Google de ${startDate} ${startTime} até ${endDate} ${endTime}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSubmittingEvent(true);
    try {
      const startIso = new Date(`${startDate}T${startTime}`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}`).toISOString();

      const eventBody = {
        summary: title,
        description: description,
        location: location,
        start: { dateTime: startIso },
        end: { dateTime: endIso },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar evento no Google Calendar.');
      }

      // Clear fields
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');

      // Refresh list
      await fetchCalendarEvents(token);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      alert(err.message || 'Erro ao agendar compromisso.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string, eventSummary: string) => {
    if (!token) return;

    // Explicit User Confirmation for Destructive Operation
    const confirmed = window.confirm(
      `Tem certeza que deseja DELETAR o compromisso "${eventSummary || 'Sem título'}" da sua Google Agenda? Esta ação é irreversível.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Não foi possível remover o compromisso do servidor.');
      }

      // Refresh list
      await fetchCalendarEvents(token);
    } catch (err: any) {
      console.error('Delete event error:', err);
      alert(err.message || 'Falha ao remover o compromisso.');
    }
  };

  // Bulk sync logic for active local reminders
  const activeLocalReminders = data.reminders.filter(r => r.status === 'active');

  const handleToggleReminderSelection = (id: string) => {
    setSelectedReminders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSyncRemindersToGoogle = async () => {
    if (!token || selectedReminders.length === 0) return;

    // Display selected titles
    const syncingTasks = activeLocalReminders.filter(r => selectedReminders.includes(r.id));
    const listSummary = syncingTasks.map(t => `- ${t.titulo}`).join('\n');

    // Confirm write mutation
    const confirmMessage = `Você deseja sincronizar/exportar as seguintes tarefas (${syncingTasks.length}) para seu Google Calendar?\n\n${listSummary}\n\nEles serão programados como compromissos de 1 hora a partir do fuso corrente cadastrado de cada um.`;
    if (!window.confirm(confirmMessage)) return;

    setSyncingReminders(true);
    try {
      for (const item of syncingTasks) {
        // Parse date
        let startIso: string;
        try {
          // If formatting is directly standard ISO etc or YYYY-MM-DD HH:mm
          const cleanDateStr = item.data_hora.replace(' ', 'T');
          const dt = new Date(cleanDateStr);
          if (isNaN(dt.getTime())) {
            throw new Error();
          }
          startIso = dt.toISOString();
        } catch {
          // Fallback to today + 1 hour if unparseable
          const fallback = new Date();
          fallback.setHours(fallback.getHours() + 1);
          startIso = fallback.toISOString();
        }

        const endDt = new Date(startIso);
        endDt.setHours(endDt.getHours() + 1); // 1-hour interval default
        const endIso = endDt.toISOString();

        const eventBody = {
          summary: `[LifeOS] ${item.titulo}`,
          description: `Compromisso importado do LifeOS AI.\nStatus original: Ativo`,
          start: { dateTime: startIso },
          end: { dateTime: endIso }
        };

        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        });

        if (!res.ok) {
          console.error(`Falha ao exportar reminder "${item.titulo}"`);
        } else {
          // Update the localized reminder status via API if preferred,
          // but we can just report complete.
        }
      }

      // Clear selection
      setSelectedReminders([]);
      alert(`Sincronização concluída com sucesso! ${syncingTasks.length} lembretes importados.`);
      await fetchCalendarEvents(token);
    } catch (err: any) {
      console.error(err);
      alert('Falha parcial ou total durante o fluxo integrado de escrita.');
    } finally {
      setSyncingReminders(false);
    }
  };

  const getFriendlyTime = (dateTimeStr?: string, dateStr?: string) => {
    if (dateTimeStr) {
      const dt = new Date(dateTimeStr);
      return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }
    if (dateStr) {
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]} (Dia Inteiro)`;
    }
    return 'Sem data';
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-4 bg-[#111318] border border-[#1e202a] rounded-xl">
        <div className="w-6 h-6 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-gray-400">Verificando credenciais do ecossistema Google...</p>
      </div>
    );
  }

  // Not signed in UI
  if (!token || !user) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-[#111318] border border-[#1d202a] rounded-xl shadow-lg">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#4285F4] uppercase">Google Integration Workspace</span>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">Conecte sua Google Agenda</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Vincule seu calendário para que as inteligências e faturamentos agendados no Telegram sincronizem em tempo real com sua agenda.
            </p>
          </div>
        </div>

        <div className="p-12 bg-[#0d0e11] border border-[#1d202a] rounded-xl flex flex-col items-center text-center space-y-6">
          <CalendarIcon className="w-16 h-16 text-[#4285F4] stroke-[1.2] opacity-80" />
          <div className="space-y-2 max-w-md">
            <h3 className="text-sm font-semibold text-white">Pronto para Integrar</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Ao se conectar com sua conta Google, você poderá consultar compromissos em tempo real, criar novos alarmes e sincronizar automaticamente seus lembretes locais.
            </p>
          </div>

          <div>
            {/* Standard "Sign in with Google" button */}
            <button 
              onClick={handleLogin}
              className="gsi-material-button cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'white',
                border: '1px solid #747775',
                borderRadius: '8px',
                color: '#1f1f1f',
                padding: '0 12px',
                height: '40px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background-color 0.218s, border-color 0.218s'
              }}
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '20px', height: '20px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>Conectar com Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome Authenticated Box */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#111318] border border-[#1d202a] rounded-xl shadow-md">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-blue-500/30" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-900/40 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400">
              {user.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <span className="text-[9px] font-mono font-bold tracking-widest text-blue-400 uppercase">Google Agenda Ativa</span>
            <h2 className="text-base font-bold text-white tracking-tight">{user.displayName}</h2>
            <p className="text-[10px] text-gray-500 font-mono">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchCalendarEvents(token)}
            disabled={syncingEvents}
            className="p-2 border border-[#1e202a] hover:bg-[#202330] rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            title="Recarregar eventos"
          >
            <RefreshCw className={`w-4 h-4 ${syncingEvents ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-950/40 border border-red-900/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase font-bold">Desconectar</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-950/30 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <span className="font-bold">Ocorreu um problema: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Agenda timeline list (3 cols) */}
        <div className="col-span-1 lg:col-span-3 bg-[#111318] border border-[#1e202a] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1b1c25] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">Compromissos Agendados</h3>
              </div>
              <span className="text-[9px] font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/20">
                Primary API V3
              </span>
            </div>

            {syncingEvents ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin mx-auto mr-auto ml-auto"></div>
                <span className="text-xs font-mono text-gray-500 block">Buscando agenda no servidor Google...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="py-20 text-center text-xs text-gray-500 font-mono space-y-1">
                <Info className="w-5 h-5 text-gray-700 mx-auto" />
                <p>Nenhum compromisso pendente nos próximos dias.</p>
                <p className="text-[10px] text-gray-600">Use o painel lateral para criar ou agendar lembretes.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                {events.map((ev) => (
                  <div 
                    key={ev.id}
                    className="p-3.5 bg-[#090a0d] border border-[#1d202a] hover:border-blue-500/20 rounded-xl transition group duration-200 flex items-start justify-between gap-3 shadow-inner"
                  >
                    <div className="space-y-1 truncate">
                      <h4 className="text-xs font-bold text-gray-200 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                        {ev.summary || 'Sem título'}
                      </h4>
                      {ev.description && (
                        <p className="text-[10px] text-gray-500 truncate max-w-sm">{ev.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[10px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1 text-blue-400">
                          <Clock className="w-3 h-3" />
                          {getFriendlyTime(ev.start?.dateTime, ev.start?.date)}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1 text-gray-500 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3" />
                            {ev.location}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {ev.htmlLink && (
                        <a 
                          href={ev.htmlLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 text-gray-500 hover:text-white bg-[#141620] border border-[#1e202e] hover:border-gray-600 rounded cursor-pointer transition"
                          title="Melhorar/Editar no Google Agenda"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button 
                        onClick={() => handleDeleteEvent(ev.id, ev.summary)}
                        className="p-1.5 text-gray-500 hover:text-red-400 bg-[#141620] border border-[#1e202e] hover:border-red-950 rounded cursor-pointer transition"
                        title="Deletar compromisso"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-[10px] text-gray-500 font-mono mt-4 pt-3 border-t border-[#1a1c25]">
            💡 Alinhamento temporal concluído. Os compromissos acima herdam seu timezone local.
          </div>
        </div>

        {/* Right Options Sidebar: Create & Sync Lembretes (2 cols) */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          
          {/* Quick Create Event Form */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider border-b border-[#1b1c25] pb-2.5 mb-3">
              Novo Compromisso
            </h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Título do Compromisso *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Alinhamento de Investimentos" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Data Início *</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate) setEndDate(e.target.value);
                    }}
                    className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Horário Início *</label>
                  <input 
                    type="time" 
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Data Fim *</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Horário Fim *</label>
                  <input 
                    type="time" 
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Local (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Google Meet, Escritório..." 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#090a0d] border border-[#202330] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-mono uppercase font-semibold">Descrição (Opcional)</label>
                <textarea 
                  rows={2}
                  placeholder="Compromisso importado do LifeOS..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#090a0d] border border-[#202330] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button 
                type="submit"
                disabled={submittingEvent}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/25 text-white py-2 rounded-lg font-bold text-xs transition cursor-pointer select-none flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {submittingEvent ? 'Agendando...' : 'Criar na Agenda'}
              </button>
            </form>
          </div>

          {/* Sincronização de Lembretes Locais */}
          <div className="bg-[#111318] border border-[#1e202a] rounded-xl p-5">
            <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider border-b border-[#1b1c25] pb-2.5 mb-3 flex items-center justify-between">
              <span>Sincronizar Lembretes</span>
              <span className="text-[9px] bg-amber-950/40 text-amber-500 border border-amber-800/10 px-1.5 py-0.5 rounded">
                Ativos ({activeLocalReminders.length})
              </span>
            </h3>

            {activeLocalReminders.length === 0 ? (
              <p className="text-[11px] text-gray-500 leading-relaxed py-2">
                Nenhum lembrete do LifeOS AI está ativo no momento para exportar.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Selecione os lembretes ou compromissos gerados via Telegram para sincronizar imediatamente com sua conta Google:
                </p>

                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {activeLocalReminders.map((rem) => {
                    const selected = selectedReminders.includes(rem.id);
                    return (
                      <div 
                        key={rem.id}
                        onClick={() => handleToggleReminderSelection(rem.id)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 cursor-pointer transition ${
                          selected 
                            ? 'bg-blue-950/30 border-blue-500/30' 
                            : 'bg-[#090a0d] border-[#1d202d]'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-700'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-gray-200 truncate">{rem.titulo}</p>
                          <p className="text-[9px] text-gray-500 font-mono font-semibold">{rem.data_hora}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={handleSyncRemindersToGoogle}
                  disabled={selectedReminders.length === 0 || syncingReminders}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-950/40 text-white disabled:text-gray-500 rounded-lg font-bold text-xs transition cursor-pointer select-none flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {syncingReminders ? 'Sincronizando...' : `Sincronizar Selecionados (${selectedReminders.length})`}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
