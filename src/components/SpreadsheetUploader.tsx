import React, { useState } from 'react';
import { FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import { showToast } from './Toast';

interface SpreadsheetUploaderProps {
  onUploadComplete: () => void;
  theme?: 'light' | 'dark';
}

export default function SpreadsheetUploader({ onUploadComplete, theme = 'light' }: SpreadsheetUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccess(false);
    showToast('📂 Carregando arquivo financeiro...', 'info');

    try {
      // Simulate spreadsheet processing via the local integration
      const res = await fetch('/api/db/import-spreadsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: `/uploads/finances/${file.name}` })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        showToast(`✅ Planilha importada com sucesso! ${data.rows} categorias orçadas.`, 'success');
        onUploadComplete();
      } else {
        showToast('Falha ao interpretar a planilha.', 'error');
      }
    } catch (_) {
      showToast('Falha na comunicação com o servidor.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const isDark = theme === 'dark';
  const bgColors = isDark 
    ? 'bg-[#090a0d] border-slate-800 hover:border-slate-700 hover:bg-[#0d0f17]/40' 
    : 'bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-slate-100/60';

  return (
    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition duration-200 ${bgColors}`}>
      <input 
        type="file" 
        id="fin-upload-input" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange} 
        className="hidden" 
        disabled={uploading}
      />
      <label htmlFor="fin-upload-input" className="cursor-pointer flex flex-col items-center justify-center space-y-3 select-none">
        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full"></div>
            <span className="text-xs font-mono text-indigo-500 font-bold uppercase animate-pulse">IA analisando dados da planilha...</span>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Planilha importada com sucesso!</span>
            <span className="text-[10px] text-slate-400">Clique para reenviar se desejar</span>
          </div>
        ) : (
          <>
            <FileSpreadsheet className="w-10 h-10 text-indigo-500" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Importação de Planilha Orçamentária</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">Arraste seu arquivo Excel/CSV ou clique para procurar. A IA extrairá orçamentos mensais automaticamente.</p>
            </div>
            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">Planilha Excel ou CSV</span>
          </>
        )}
      </label>
    </div>
  );
}
