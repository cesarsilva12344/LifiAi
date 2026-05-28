import React, { useState, useRef } from 'react';
import { useLifeOSStore } from '../lib/store';
import { ArrowUp, Mic, Image, Text, AlertCircle } from 'lucide-react';
import { showToast } from './Toast';

interface QuickCaptureBarProps {
  onDataRefresh: () => void;
  theme?: 'light' | 'dark';
}

export default function QuickCaptureBar({ onDataRefresh, theme = 'light' }: QuickCaptureBarProps) {
  const { captureMode, setCaptureMode, isRecording, setIsRecording } = useLifeOSStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local Web Speech API Speech Recognition
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('API de Reconhecimento de Voz não suportada neste navegador.', 'error');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'pt-BR';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      showToast('🎙️ Gravando áudio...', 'success');
    };

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1][0].transcript;
      setText(prev => (prev ? prev + ' ' + result : result));
    };

    recognitionRef.current.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      setCaptureMode('voice');
      startListening();
    }
  };

  const handleImageClick = () => {
    setCaptureMode('image');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    showToast('📷 Processando imagem via OCR...', 'info');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Call local OCR API
        const res = await fetch('/api/ocr/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mime: file.type })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            setText(data.text);
            showToast('✅ OCR concluído com sucesso!', 'success');
          } else {
            showToast('Não foi possível ler dados estruturados da imagem.', 'error');
          }
        } else {
          showToast('Erro ao processar imagem no servidor.', 'error');
        }
        setSending(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err.message, 'error');
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    
    setSending(true);
    if (isRecording) stopListening();

    try {
      // Call local webhook that implements 3-level confidence staging
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });

      if (res.ok) {
        const data = await res.json();
        setText('');
        
        if (data.extractionStatus === 'APPROVED') {
          showToast('✅ Informação adicionada com sucesso!', 'success');
        } else if (data.extractionStatus === 'REVIEW') {
          showToast('🔍 Confiança baixa. Salvo na Fila de Validação IA.', 'info');
        } else {
          showToast('❓ NLP não entendeu com segurança. Reformule.', 'error');
        }
        
        onDataRefresh();
      } else {
        showToast('Falha ao processar mensagem no servidor.', 'error');
      }
    } catch (err) {
      showToast('Erro ao conectar ao servidor.', 'error');
    } finally {
      setSending(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
      <div className={`flex items-center gap-2 border rounded-2xl p-2.5 shadow-2xl transition duration-200 ${
        isDark 
          ? 'bg-[#111318]/90 border-[#1d202a]/80 backdrop-blur text-slate-100' 
          : 'bg-white/90 border-slate-200/80 backdrop-blur text-slate-800'
      }`}>
        
        {/* Toggle options */}
        <button 
          onClick={() => { setCaptureMode('text'); stopListening(); }} 
          className={`p-2 rounded-lg cursor-pointer transition select-none ${
            captureMode === 'text' && !isRecording
              ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600') 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Modo Texto"
        >
          <Text size={16} />
        </button>

        <button 
          onClick={handleMicClick} 
          className={`p-2 rounded-lg cursor-pointer transition select-none ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Modo Voz"
        >
          <Mic size={16} />
        </button>

        <button 
          onClick={handleImageClick} 
          className={`p-2 rounded-lg cursor-pointer transition select-none ${
            captureMode === 'image' 
              ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600') 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
          title="Modo Foto/OCR"
        >
          <Image size={16} />
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
          accept="image/*"
        />

        {/* Input Bar */}
        <input 
          value={text} 
          onChange={e => setText(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={sending}
          placeholder={
            isRecording 
              ? 'Fale em português... ouvindo...' 
              : sending 
                ? 'Processando...' 
                : 'Diga algo (ex: "Gastei 25 no Uber" ou "Meditei por 10min")...'
          } 
          className={`flex-1 bg-transparent border-none text-xs px-2 focus:outline-none focus:ring-0 ${
            isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
          }`}
        />

        {/* Submit */}
        <button 
          onClick={handleSend} 
          disabled={sending || !text.trim()}
          className={`p-2 rounded-xl cursor-pointer transition select-none ${
            text.trim()
              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
