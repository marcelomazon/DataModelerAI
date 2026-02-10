
import React from 'react';
import { X, Award, CheckCircle, HelpCircle, Activity } from 'lucide-react';
import { EvaluationResult } from '../types';

interface EvaluationModalProps {
  result: EvaluationResult;
  onClose: () => void;
}

const EvaluationModal: React.FC<EvaluationModalProps> = ({ result, onClose }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            Resultado da Avaliação
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Score Header */}
          <div className="flex flex-col items-center text-center">
            <div className={`text-6xl font-black px-8 py-4 rounded-3xl border-2 mb-4 ${getScoreColor(result.score)}`}>
              {result.score}
              <span className="text-xl font-bold ml-1">/100</span>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed max-w-lg">
              {result.feedback}
            </p>
          </div>

          {/* Breakdown Sections */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Entidades
              </h3>
              <p className="text-slate-600 text-sm">{result.details.entities}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Atributos
              </h3>
              <p className="text-slate-600 text-sm">{result.details.attributes}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-500" />
                Relacionamentos
              </h3>
              <p className="text-slate-600 text-sm">{result.details.relationships}</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Entendido, continuar modelando!
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModal;
