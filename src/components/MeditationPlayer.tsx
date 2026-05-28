import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Compass, Heart, Wind, HelpCircle, Check, Award } from 'lucide-react';
import { showToast } from './Toast';

interface MeditationPlayerProps {
  onSessionLogged: () => void;
  theme?: 'light' | 'dark';
}

type MeditationType = 'breathing' | 'guided' | 'gratitude' | 'visualization' | 'body_scan';

export default function MeditationPlayer({ onSessionLogged, theme = 'light' }: MeditationPlayerProps) {
  const [type, setType] = useState<MeditationType>('breathing');
  const [duration, setDuration] = useState<number>(300); // 5 minutes standard
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  // Mood Tracking
  const [step, setStep] = useState<'setup' | 'playing' | 'mood_before' | 'mood_after' | 'completed'>('setup');
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Audio simulation / Ambient sound
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startAmbientSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      audioContextRef.current = new AudioCtx();
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.frequency.setValueAtTime(110, audioContextRef.current.currentTime); // Low soothing sound (A2)
      
      // Modulate frequency to create deep hum sound
      oscillatorRef.current.frequency.linearRampToValueAtTime(115, audioContextRef.current.currentTime + 3);
      
      gainNodeRef.current.gain.setValueAtTime(0.04, audioContextRef.current.currentTime);
      
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      oscillatorRef.current.start();
    } catch (_) {}
  };

  const stopAmbientSound = () => {
    try {
      if (oscillatorRef.current) oscillatorRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    } catch (_) {}
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && elapsed < duration) {
      timer = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else if (elapsed >= duration && isPlaying) {
      setIsPlaying(false);
      stopAmbientSound();
      setStep('mood_after');
      showToast('Sessão concluída! Vamos avaliar seu estado mental.', 'success');
    }
    return () => clearInterval(timer);
  }, [isPlaying, elapsed, duration]);

  useEffect(() => {
    if (isPlaying) {
      startAmbientSound();
    } else {
      stopAmbientSound();
    }
    return () => stopAmbientSound();
  }, [isPlaying]);

  const handleStartPractice = () => {
    if (!moodBefore) {
      setStep('mood_before');
    } else {
      setElapsed(0);
      setStep('playing');
      setIsPlaying(true);
    }
  };

  const handleCompletePractice = async () => {
    if (!moodBefore || !moodAfter) return;
    setSaving(true);
    
    try {
      const res = await fetch('/api/db/meditation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration_seconds: duration,
          type,
          mood_before: moodBefore,
          mood_after: moodAfter,
          notes
        })
      });

      if (res.ok) {
        showToast('🧘 Sessão de mindfulness registrada! Seu Life Score aumentou.', 'success');
        setStep('completed');
        onSessionLogged();
      } else {
        showToast('Erro ao salvar dados da sessão.', 'error');
      }
    } catch (_) {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetPlayer = () => {
    setIsPlaying(false);
    stopAmbientSound();
    setElapsed(0);
    setMoodBefore(null);
    setMoodAfter(null);
    setNotes('');
    setStep('setup');
  };

  const formatTimer = (totalSecs: number) => {
    const min = Math.floor(totalSecs / 60);
    const sec = totalSecs % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const meditationTypes = [
    { id: 'breathing', label: 'Respiração Guiada (4-4-6)', desc: 'Exercício tático de regulação nervosa com Pomodoro de fôlego.', icon: <Wind className="w-5 h-5 text-sky-400" /> },
    { id: 'guided', label: 'Meditação Guiada', desc: 'Foco e atenção plena com trilhas de som binaural relaxantes.', icon: <Compass className="w-5 h-5 text-indigo-400" /> },
    { id: 'gratitude', label: 'Diário de Gratidão', desc: 'Acalme a mente reconhecendo 3 coisas positivas hoje.', icon: <Heart className="w-5 h-5 text-rose-400" /> },
    { id: 'visualization', label: 'Visualização de Metas', desc: 'Conecte-se com seus objetivos de longo prazo.', icon: <Award className="w-5 h-5 text-amber-400" /> },
  ];

  const durations = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
  ];

  // Breathing Visual guide logic:
  // cycle: 4s inhale, 4s hold, 6s exhale (total 14s)
  const breathingCycle = elapsed % 14;
  let breathingAction = 'Prepare-se';
  let breatheScale = 'scale-90 bg-sky-500/20';
  if (isPlaying) {
    if (breathingCycle < 4) {
      breathingAction = 'Inspire lentamente...';
      breatheScale = 'scale-125 bg-sky-500/40 shadow-[0_0_40px_10px_rgba(14,165,233,0.3)] duration-[4000ms]';
    } else if (breathingCycle < 8) {
      breathingAction = 'Segure o fôlego...';
      breatheScale = 'scale-125 bg-amber-500/30 shadow-[0_0_40px_10px_rgba(245,158,11,0.2)] duration-1000';
    } else {
      breathingAction = 'Solte o ar...';
      breatheScale = 'scale-90 bg-sky-500/10 duration-[6000ms]';
    }
  }

  const isDark = theme === 'dark';
  const c = isDark 
    ? 'bg-[#111318] border-[#1d202a] text-slate-100'
    : 'bg-white border-slate-200 text-slate-800';

  return (
    <div className={`p-6 border rounded-2xl shadow-xl transition-colors ${c}`}>
      
      {step === 'setup' && (
        <div className="space-y-6">
          <div className="border-b pb-3 mb-2 flex items-center justify-between border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[9px] font-mono font-black text-purple-500 tracking-wider uppercase">Módulo Mindfulness</span>
              <h3 className="text-sm font-bold uppercase tracking-wide mt-0.5">Mindfulness & Meditação Guiada</h3>
            </div>
            <Wind className="w-5 h-5 text-indigo-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meditationTypes.map(m => (
              <button
                key={m.id}
                onClick={() => setType(m.id as any)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition flex items-start gap-3.5 hover:border-indigo-400/50 ${
                  type === m.id 
                    ? (isDark ? 'bg-indigo-950/30 border-indigo-500/80 text-white' : 'bg-indigo-50/70 border-indigo-200 text-indigo-800')
                    : (isDark ? 'bg-[#090a0d] border-[#1d202a]' : 'bg-slate-50/60 border-slate-100')
                }`}
              >
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>{m.icon}</div>
                <div>
                  <h4 className="text-xs font-bold leading-none">{m.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Tempo de Prática</span>
            <div className="flex gap-2">
              {durations.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border cursor-pointer transition select-none ${
                    duration === d.value
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                      : (isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-200')
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartPractice}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer select-none"
          >
            Iniciar Prática de Atenção Plena
          </button>
        </div>
      )}

      {step === 'mood_before' && (
        <div className="space-y-6 text-center py-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-indigo-500 uppercase font-black">Estado Emocional Inicial</span>
            <h3 className="text-base font-bold">Como está seu nível de calma e humor agora?</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Registramos seu humor inicial para medir a elevação do seu bem-estar após o exercício.
            </p>
          </div>

          <div className="flex justify-center flex-wrap gap-2 max-w-md mx-auto">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                onClick={() => setMoodBefore(i + 1)}
                className={`w-9 h-9 rounded-full font-mono font-black text-xs transition cursor-pointer select-none ${
                  moodBefore === i + 1
                    ? 'bg-indigo-600 text-white shadow-lg scale-110'
                    : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {moodBefore && (
            <button
              onClick={() => { setStep('playing'); setIsPlaying(true); }}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              Começar Prática <Wind className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {step === 'playing' && (
        <div className="flex flex-col items-center justify-center space-y-8 py-6 relative overflow-hidden">
          <div className="absolute w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="text-center space-y-1 z-10">
            <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-500 font-black">Prática em andamento</span>
            <h3 className="text-sm font-bold uppercase tracking-wide capitalize">{type === 'breathing' ? 'Foco Respiratório' : type}</h3>
          </div>

          {/* Core Breathing Guide Bubble */}
          <div className="relative flex items-center justify-center w-48 h-48 z-10">
            <div className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center transition-all ease-in-out border border-white/5 ${breatheScale}`}>
              <span className="text-xs font-bold text-indigo-600 dark:text-sky-300 font-sans tracking-wide">
                {breathingAction}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 z-10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition shadow-lg cursor-pointer flex items-center justify-center"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
            </button>

            <span className="font-mono text-2xl font-black text-indigo-600 dark:text-sky-400 tracking-wider">
              {formatTimer(duration - elapsed)}
            </span>
          </div>

          <button
            onClick={resetPlayer}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500 transition cursor-pointer z-10"
          >
            Interromper Sessão
          </button>
        </div>
      )}

      {step === 'mood_after' && (
        <div className="space-y-6 text-center py-4">
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase font-black">Prática Concluída com Sucesso</span>
            <h3 className="text-base font-bold">Como está seu humor pós-prática?</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Excelente! Avalie sua elevação emocional na escala de 1 a 10.
            </p>
          </div>

          <div className="flex justify-center flex-wrap gap-2 max-w-md mx-auto">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                onClick={() => setMoodAfter(i + 1)}
                className={`w-9 h-9 rounded-full font-mono font-black text-xs transition cursor-pointer select-none ${
                  moodAfter === i + 1
                    ? 'bg-emerald-500 text-white shadow-lg scale-110'
                    : (isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {moodAfter && (
            <div className="space-y-3 max-w-sm mx-auto">
              <input 
                type="text"
                placeholder="Insira notas rápidas de reflexão (opcional)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={`w-full text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium transition text-center ${
                  isDark ? 'bg-[#090a0d] border-[#1d202a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button
                onClick={handleCompletePractice}
                disabled={saving}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                {saving ? 'Registrando...' : 'Gravar Sessão no Dashboard'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'completed' && (
        <div className="space-y-6 text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
            <Check size={28} strokeWidth={3} />
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-bold">Mindfulness Catalogada!</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Obrigado pela consistência, César. A elevação de humor e a taxa de foco foram agregadas ao seu **Life Score** consolidado.
            </p>
          </div>

          <button
            onClick={resetPlayer}
            className="px-6 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition cursor-pointer select-none"
          >
            Voltar ao Início
          </button>
        </div>
      )}

    </div>
  );
}
