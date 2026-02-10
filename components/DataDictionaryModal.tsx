
import React from 'react';
import { X, BookOpen, Key, FileText, Layers, Component, Hash } from 'lucide-react';
import { Entity, AttributeCategory } from '../types';

interface DataDictionaryModalProps {
  entities: Entity[];
  onClose: () => void;
}

const CATEGORY_MAP: Record<AttributeCategory, { label: string; icon: any; color: string }> = {
  identifier: { label: 'PK (Identificador)', icon: Key, color: 'text-amber-600' },
  descriptive: { label: 'Descritivo', icon: FileText, color: 'text-slate-500' },
  multivalued: { label: 'Multivalorado', icon: Layers, color: 'text-purple-600' },
  composite: { label: 'Composto', icon: Component, color: 'text-indigo-600' },
  referential: { label: 'FK (Referencial)', icon: Hash, color: 'text-emerald-600' },
};

const DataDictionaryModal: React.FC<DataDictionaryModalProps> = ({ entities, onClose }) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
             <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dicionário de Dados</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 tracking-widest">Entidade</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 tracking-widest">Atributo</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 tracking-widest">Categoria</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 tracking-widest text-center">PK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic font-medium">Nenhuma entidade modelada até o momento.</td>
                </tr>
              )}
              {entities.flatMap(entity => 
                entity.attributes.map((attr, idx) => {
                  const cat = CATEGORY_MAP[attr.category || (attr.isPK ? 'identifier' : 'descriptive')];
                  return (
                    <tr key={`${entity.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4"><span className="text-xs font-black text-slate-800 uppercase">{entity.name}</span></td>
                      <td className="px-4 py-4"><span className="text-sm font-medium text-slate-600">{attr.name}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                           <cat.icon className={`w-3 h-3 ${cat.color}`} />
                           <span className={`text-[11px] font-bold ${cat.color}`}>{cat.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {attr.isPK ? (
                          <div className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-600 rounded-full">
                            <Key className="w-3 h-3" />
                          </div>
                        ) : <span className="text-slate-200">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-right">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-all">
            Fechar Dicionário
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDictionaryModal;
