import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, Terminal, FileText, Plus, Trash2, CheckCircle, 
  Flame, DollarSign, Command, Mic, Square, Paperclip, Search, 
  MoreVertical, Check, CheckCheck, PlayCircle, DownloadCloud, Image as ImageIcon, X
} from 'lucide-react';
import { showToast } from './Toast';

interface TelegramMsg {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isAudio?: boolean;
  isDoc?: boolean;
  isImage?: boolean;
  fileName?: string;
  fileSize?: string;
  duration?: string;
}

interface TelegramEmulatorProps {
  onDataRefresh: () => void;
  theme?: 'light' | 'dark';
  onClose?: () => void;
}

export default function TelegramEmulator({ onDataRefresh, theme = 'light', onClose }: TelegramEmulatorProps) {
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
                await handleSendMessage(data.text, { isAudio: true, duration: '0:08' });
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
            await handleSendMessage(textToSend, { isImage: true, fileName: file.name });
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
        
        // Enhance list with simulated media types based on content keywords
        const enriched = data.map((m: TelegramMsg) => {
          const lowerText = m.text.toLowerCase();
          const isAudio = lowerText.includes('audio') || lowerText.includes('transcrição') || lowerText.includes('gravação');
          const isDoc = lowerText.includes('.pdf') || lowerText.includes('documento') || lowerText.includes('contrato');
          const isImage = lowerText.includes('ocr') || lowerText.includes('imagem') || lowerText.includes('comprovante');
          
          return {
            ...m,
            isAudio: m.isAudio ?? isAudio,
            isDoc: m.isDoc ?? isDoc,
            isImage: m.isImage ?? isImage,
            fileName: m.fileName ?? (isDoc ? 'Contrato_Design_MVP.pdf' : isImage ? 'comprovante_reuniao.jpg' : undefined),
            fileSize: m.fileSize ?? (isDoc ? '248 KB' : isImage ? '1.2 MB' : undefined),
            duration: m.duration ?? (isAudio ? '0:12' : undefined)
          };
        });

        setMessages(enriched);
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

  const handleSendMessage = async (textToSend: string, extraMedia?: Partial<TelegramMsg>) => {
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
      case 'expense': return <DollarSign className="w-4 h-4 text-rose-500" />;
      case 'income': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'task': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'habit': return <Flame className="w-4 h-4 text-orange-500" />;
      default: return <FileText className="w-4 h-4 text-violet-500" />;
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

  // Theme variable bindings for layout design
  const darkThemeColors = {
    chatBg: 'bg-[#0f1721] bg-mesh-dark',
    headerBg: 'bg-[#17212b] border-[#101921] text-white',
    footerBg: 'bg-[#17212b] border-[#101921]',
    incomingBubble: 'bg-[#182533] border-[#1f2d3a] text-slate-100 shadow-sm',
    outgoingBubble: 'bg-[#2b5278] text-white shadow-sm',
    metaText: 'text-slate-400',
    headerSubtext: 'text-[#5288c1]',
    inputBg: 'bg-[#111c27] border-[#1e2c3a] text-white',
    quickBtnBg: 'bg-[#182533] border-[#1f2d3a] hover:bg-[#203044] text-slate-300'
  };

  const lightThemeColors = {
    chatBg: 'bg-[#f4f4f7] bg-mesh-light',
    headerBg: 'bg-white border-slate-200 text-slate-900',
    footerBg: 'bg-white border-slate-200',
    incomingBubble: 'bg-white text-slate-800 shadow-sm border border-slate-150',
    outgoingBubble: 'bg-[#eeffde] text-slate-800 shadow-sm border border-[#e2f0d3]',
    metaText: 'text-slate-500',
    headerSubtext: 'text-[#4f93e3]',
    inputBg: 'bg-slate-50 border-slate-200 text-slate-800',
    quickBtnBg: 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
  };

  const c = theme === 'dark' ? darkThemeColors : lightThemeColors;

  return (
    <div className={`flex flex-col h-full border-l w-full select-none ${
      theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
    }`}>
      
      {/* 1. Header (Premium Style) */}
      <div className={`p-3.5 border-b flex items-center justify-between shadow-sm flex-shrink-0 transition-colors ${c.headerBg}`}>
        <div className="flex items-center gap-3">
          {/* Avatar circle */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-white shadow-inner text-sm tracking-wide">
            LA
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">LifeOS Assistant</h3>
            <span className={`text-xs font-semibold ${c.headerSubtext} flex items-center gap-1`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-slate-400">
          <button className="hover:text-blue-500 cursor-pointer transition p-1">
            <Search className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose} 
              className="hover:text-red-500 hover:bg-slate-500/10 rounded p-1 cursor-pointer transition shrink-0"
              title="Fechar Emulador"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
          {!onClose && (
            <button className="hover:text-blue-500 cursor-pointer transition p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Suggestion templates shortcuts */}
      <div className={`p-3 border-b flex-shrink-0 transition-colors ${
        theme === 'dark' ? 'bg-[#0f1721] border-[#101921]' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className={`text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 mb-2 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Command className="w-3.5 h-3.5 opacity-70" /> Atalhos Rápidos
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-350">
          {templates.map((t, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSendMessage(t.val)}
              className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors duration-150 shrink-0 cursor-pointer select-none ${c.quickBtnBg}`}
            >
              {t.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 3. Messages Chatroom Pattern wallpaper */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar transition-colors ${c.chatBg}`}
        style={{
          backgroundImage: theme === 'light' 
            ? 'radial-gradient(#d5d8dc 0.6px, transparent 0.6px)' 
            : 'radial-gradient(#273646 0.7px, transparent 0.7px)',
          backgroundSize: '13px 13px',
          backgroundBlendMode: 'normal'
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const isUser = m.sender === 'user';
            
            return (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ type: "spring", stiffness: 450, damping: 28 }}
                className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl leading-relaxed text-xs shadow-sm flex flex-col gap-2 relative transition-all ${
                    isUser ? c.outgoingBubble : c.incomingBubble
                  } ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                >
                  
                  {/* 3.1 Audio message block */}
                  {m.isAudio ? (
                    <div className="flex items-center gap-3 py-1.5 min-w-[200px]">
                      <button className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition ${
                        isUser ? 'bg-sky-500 text-white hover:bg-sky-400' : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}>
                        <PlayCircle className="w-5 h-5 fill-current" />
                      </button>
                      <div className="flex-1 flex flex-col gap-1">
                        {/* Live Audio wave visualizer mockup */}
                        <div className="flex items-center gap-1 h-6 px-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((bar) => {
                            const delay = bar * 0.04;
                            const height = 4 + Math.sin(bar * 0.5) * 8 + Math.random() * 4;
                            return (
                              <motion.div
                                key={bar}
                                animate={{ 
                                  scaleY: [1, 1.8, 0.7, 1.4, 1] 
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: 1.0, 
                                  delay: delay,
                                  ease: "easeInOut"
                                }}
                                style={{ height: `${height}px`, transformOrigin: 'center' }}
                                className={`w-[2.2px] rounded-full ${isUser ? 'bg-white' : 'bg-blue-500'}`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center text-[10px] opacity-75 mt-0.5">
                          <span className="font-mono">{m.duration || '0:07'}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* 3.2 Document block */}
                  {m.isDoc ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-black/5 min-w-[200px] border border-black/5">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
                        <DownloadCloud className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">{m.fileName || 'Contrato_Investidor.pdf'}</h4>
                        <p className="text-[10px] opacity-75 font-mono">{m.fileSize || '12.5 KB'}</p>
                      </div>
                    </div>
                  ) : null}

                  {/* 3.3 Image / Photo OCR preview block */}
                  {m.isImage ? (
                    <div className="rounded-xl overflow-hidden mb-1 shadow-inner border border-black/10 flex flex-col gap-1 bg-black/10">
                      <div className="w-full h-32 bg-slate-800 flex items-center justify-center text-slate-400 relative">
                        <ImageIcon className="w-12 h-12 stroke-[1.2] opacity-70" />
                        <span className="absolute bottom-2 right-2 text-[9px] bg-black/60 text-white px-2 py-0.5 rounded font-mono">
                          image/jpeg
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* General text content */}
                  <span className="font-sans leading-relaxed text-[12px] whitespace-pre-wrap">{m.text}</span>
                  
                  {/* Meta details (Time + Double Check) */}
                  <div className="flex items-center justify-end gap-1 text-[9px] opacity-70 self-end mt-0.5">
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isUser && (
                      <CheckCheck className={`w-3.5 h-3.5 ${
                        theme === 'light' ? 'text-emerald-600' : 'text-sky-300'
                      }`} />
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <div className={`flex items-center gap-2.5 p-3 rounded-2xl rounded-tl-none mr-auto max-w-[80%] text-xs shadow-sm border ${
            theme === 'dark' 
              ? 'bg-[#182533] border-[#1f2d3a] text-slate-300' 
              : 'bg-white border-slate-150 text-slate-600'
          }`}>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <span className="text-[10px] font-mono italic">Processando Inteligência...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. Mini notification banner for AI Extraction */}
      {classification && parsedData && (
        <div className="px-4 py-2 border-t bg-blue-500/10 text-blue-500 text-[11px] font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Extraído: <strong className="font-bold uppercase">{classification}</strong></span>
            {parsedData.valor && <span className="opacity-80">| R$ {parsedData.valor}</span>}
          </div>
          <span className="text-[9px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded uppercase">
            CONCORDADO
          </span>
        </div>
      )}

      {/* 5. Footer panel / Input Box */}
      <div className={`p-3.5 border-t flex-shrink-0 transition-colors ${c.footerBg}`}>
        <div className="flex gap-2">
          
          {/* File attachment */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`rounded-lg p-2.5 transition shrink-0 cursor-pointer border ${
              theme === 'dark' 
                ? 'bg-[#182533] border-[#1f2d3a] text-slate-400 hover:text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
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
            placeholder={isRecording ? "Gravando áudio..." : "Digite uma mensagem..."}
            disabled={isRecording}
            className={`flex-1 border rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50 transition-colors ${c.inputBg}`}
          />

          {/* Audio recorder mic */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`rounded-lg p-2.5 transition shrink-0 cursor-pointer border ${
              isRecording 
                ? 'bg-rose-600 border-rose-500 animate-pulse text-white' 
                : theme === 'dark' 
                  ? 'bg-[#182533] border-[#1f2d3a] text-slate-400 hover:text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title={isRecording ? 'Parar e transcrever' : 'Gravar áudio'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isLoading || isRecording}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/40 disabled:text-gray-500 text-white rounded-lg p-2.5 transition shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
          
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
          <span>⚡ Captura Cognitiva Inteligente Ativa</span>
          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border dark:border-slate-700">Enter para enviar</span>
        </div>
      </div>

    </div>
  );
}
