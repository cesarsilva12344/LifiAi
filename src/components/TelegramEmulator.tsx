import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Terminal, FileText, Plus, Trash2, CheckCircle, Flame, DollarSign, Command, Mic, Square, Paperclip } from 'lucide-react';
import { showToast } from './Toast';

interface TelegramMsg {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface TelegramEmulatorProps {
  onDataRefresh: () => void;
}

export default function TelegramEmulator({ onDataRefresh }: TelegramEmulatorProps) {
  const [messages, setMessages] = useState<TelegramMsg[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [classification, setClassification] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio capture states and refs
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // OCR ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          showToast('Áudio gravado! Transcrevendo...', 'info');
          setIsLoading(true);
          
          try {
            const res = await fetch('/api/audio/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64data, mime: 'audio/webm' })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text?.trim()) {
                showToast(`Transcrição: "${data.text}"`, 'success');
                await handleSendMessage(data.text);
              } else {
                showToast('Não foi possível transcrever o áudio.', 'warning');
              }
            } else {
              showToast('Erro na transcrição do áudio.', 'error');
            }
          } catch (err: any) {
            showToast(`Falha na transcrição: ${err.message}`, 'error');
          } finally {
            setIsLoading(false);
          }
        };

        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('Gravando áudio... Clique no quadrado para parar.', 'info');
    } catch (err: any) {
      showToast('Erro ao acessar microfone: ' + err.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1];
      showToast('Imagem selecionada! Executando OCR...', 'info');
      setIsLoading(true);

      try {
        const res = await fetch('/api/ocr/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64data, mime: file.type })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            showToast('OCR concluído com sucesso!', 'success');
            let textToSend = data.text;
            if (data.isReceipt && data.valor) {
              textToSend = `Gastei R$ ${data.valor} com ${data.descricao || 'Recibo/Cupom'} em ${data.data || new Date().toISOString().split('T')[0]} (extraído via OCR)`;
            }
            await handleSendMessage(textToSend);
          } else {
            showToast('Nenhum texto extraído da imagem.', 'warning');
          }
        } else {
          showToast('Erro ao processar OCR da imagem.', 'error');
        }
      } catch (err: any) {
        showToast(`Falha no OCR: ${err.message}`, 'error');
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/telegram/history');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Falha ao buscar histórico do Telegram:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    setIsLoading(true);
    setClassification(null);
    setParsedData(null);

    // Optimistically add user message if selected through input directly
    if (textToSend === inputText) {
      setInputText('');
    }

    try {
      const response = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSend }),
      });

      if (response.ok) {
        const body = await response.json();
        if (body.classification) {
          setClassification(body.classification);
          setParsedData(body.parsed_data);
          // Show classification briefly for visual gratification
          setTimeout(() => {
            setClassification(null);
          }, 4500);
        }
        await fetchHistory();
        onDataRefresh(); // Global reload Dashboard figures
      }
    } catch (err) {
      console.error('Erro ao postar webhook Telegram:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'expense': return <DollarSign className="w-4 h-4 text-red-400" />;
      case 'income': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'task': return <CheckCircle className="w-4 h-4 text-sky-400" />;
      case 'habit': return <Flame className="w-4 h-4 text-orange-400" />;
      default: return <FileText className="w-4 h-4 text-purple-400" />;
    }
  };

  const templates = [
    { label: "💰 Gasto Uber", val: "Gastei R$ 42,90 com Uber para reunião com investidores" },
    { label: "💵 Ganho Consultoria", val: "Recebi R$ 5000,00 de consultoria na conta corrente" },
    { label: "📝 Nota Ideia", val: "Ideia: Criar uma extensão Chrome que clipa links direto para o inbox do LifeOS" },
    { label: "📋 Nova Task", val: "/tarefa high Revisar slides do pitch" },
    { label: "⚡ /hoje", val: "/hoje" },
    { label: "🧠 /insights", val: "/insights" },
    { label: "🔍 /ask Mentoria", val: "/ask O que salvei sobre investimentos?" }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0d0e11] border-l border-[#1a1c23] w-full text-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1c23] flex items-center justify-between bg-[#111318]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">TELEGRAM CAPTURE</h3>
            <span className="text-xs text-blue-400 font-mono">Sandbox Chat Interface v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1a1c23] border border-[#2b2e3a] rounded text-[10px] font-mono text-gray-400">
          <Terminal className="w-3 h-3 text-blue-400" />
          ACTIVE WEBHOOK
        </div>
      </div>

      {/* Suggestion tags */}
      <div className="p-3 bg-[#0d0e11] border-b border-[#1a1c23]">
        <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase flex items-center gap-1 mb-2">
          <Command className="w-3 h-3 text-gray-500" /> Atalhos Rápidos de Operação
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto custom-scrollbar">
          {templates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(t.val)}
              className="text-xs bg-[#161820] hover:bg-[#202330] border border-[#232635] text-gray-300 hover:text-white px-2 py-1 rounded transition duration-200"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#090a0d] custom-scrollbar">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div
              className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-blue-600/90 text-white rounded-tr-none'
                  : 'bg-[#151720] border border-[#202332] text-gray-200 rounded-tl-none font-sans shadow-md'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-gray-500 font-mono mt-1 px-1">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 bg-[#151720]/80 border border-[#222535] p-3 rounded-xl rounded-tl-none mr-auto max-w-[80%] text-xs shadow">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[10px] italic text-gray-400">Classificando com DeepSeek / Gemini...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Mini notification banner for AI Extraction */}
      {classification && parsedData && (
        <div className="px-4 py-2 border-t border-[#232738] bg-blue-950/40 text-blue-300 text-[11px] font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>Classificação IA: **{classification.toUpperCase()}**</span>
            {parsedData.valor && <span className="opacity-80">| Valor: R$ {parsedData.valor}</span>}
          </div>
          <span className="text-[9px] font-bold bg-blue-800 text-white px-1.5 py-0.5 rounded tracking-wide uppercase">
            Sincronizado
          </span>
        </div>
      )}

      {/* Input panel */}
      <div className="p-3 bg-[#111318] border-t border-[#1a1c23]">
        <div className="flex gap-2">
          {/* Attachment button for image OCR */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-[#161820] hover:bg-[#202330] border border-[#232635] text-gray-400 hover:text-white rounded-lg p-2.5 transition shrink-0 cursor-pointer"
            title="Enviar Imagem / OCR"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
            placeholder={isRecording ? "Gravando áudio..." : "Mande R$ 50 para almoço, /insights..."}
            disabled={isRecording}
            className="flex-1 bg-[#090a0d] border border-[#202330] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50"
          />

          {/* Audio recording button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`rounded-lg p-2.5 transition shrink-0 cursor-pointer ${
              isRecording 
                ? 'bg-rose-600 hover:bg-rose-500 animate-pulse text-white' 
                : 'bg-[#161820] hover:bg-[#202330] border border-[#232635] text-gray-400 hover:text-white'
            }`}
            title={isRecording ? 'Parar gravação e transcrever' : 'Gravar áudio'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading || isRecording}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-gray-500 text-white rounded-lg p-2.5 transition shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500 font-mono">
          <span>*Toda entrada alimenta o Dashboard automaticamente*</span>
          <span className="text-gray-400 bg-[#202332] px-1 rounded">Enter para enviar</span>
        </div>
      </div>
    </div>
  );
}
