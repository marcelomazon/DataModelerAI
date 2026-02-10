
import React from 'react';
import { X, Copy, Download, Database } from 'lucide-react';
import { DatabaseType } from '../geminiService';

interface SQLModalProps {
  sql: string;
  dbType: DatabaseType;
  onClose: () => void;
}

const SQLModal: React.FC<SQLModalProps> = ({ sql, dbType, onClose }) => {
  const dbLabel = dbType === 'mysql' ? 'MySQL' : 'PostgreSQL';

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    alert(`Código SQL (${dbLabel}) copiado para a área de transferência!`);
  };

  const handleDownload = () => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo-ddl-${dbType}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Database className="w-6 h-6" /></div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Script SQL DDL ({dbLabel})</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-slate-900 p-6 font-mono text-sm leading-relaxed relative group">
          <pre className="text-emerald-400 whitespace-pre-wrap">{sql}</pre>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">Este script reflete a estrutura física {dbLabel} baseada no seu diagrama lógico.</p>
          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all">
              <Copy className="w-4 h-4" /> Copiar Código
            </button>
            <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
              <Download className="w-4 h-4" /> Baixar .sql
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLModal;
