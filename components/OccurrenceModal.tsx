import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Entity } from '../types';

interface OccurrenceModalProps {
  entity: Entity;
  onClose: () => void;
  onUpdate: (data: Record<string, string>[]) => void;
}

const OccurrenceModal: React.FC<OccurrenceModalProps> = ({ entity, onClose, onUpdate }) => {
  const [records, setRecords] = useState<Record<string, string>[]>(entity.data || []);

  // Initialize with one empty row if no data exists
  useEffect(() => {
    if (records.length === 0) {
      setRecords([{}]);
    }
  }, []);

  const handleChange = (rowIndex: number, attrName: string, value: string) => {
    const newRecords = [...records];
    newRecords[rowIndex] = { ...newRecords[rowIndex], [attrName]: value };
    setRecords(newRecords);
  };

  const addRow = () => {
    setRecords([...records, {}]);
  };

  const removeRow = (index: number) => {
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords.length ? newRecords : [{}]); // Keep at least one row or empty
  };

  const handleSave = () => {
    // Filter out completely empty rows if desired, or just save as is
    const validRecords = records.filter(record => Object.values(record).some(val => val.trim() !== ''));
    onUpdate(validRecords);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm">
                {entity.name}
              </span>
              Diagrama de Ocorrências
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Simule o cadastro de dados para esta entidade.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body - Scrollable Table */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {entity.attributes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">Esta entidade não possui atributos.</p>
              <p className="text-sm">Adicione atributos na entidade para simular dados.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="w-12 p-3 text-center text-xs font-bold text-slate-400 uppercase">#</th>
                      {entity.attributes.map((attr, idx) => (
                        <th key={idx} className="p-3 text-xs font-black text-slate-600 uppercase tracking-wider min-w-[150px] border-r border-slate-100 last:border-r-0">
                          <div className="flex items-center gap-1.5">
                            {attr.isPK && <span className="text-amber-500 text-[10px]">(PK)</span>}
                            {attr.name}
                          </div>
                        </th>
                      ))}
                      <th className="w-12 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, rowIndex) => (
                      <tr key={rowIndex} className="group hover:bg-blue-50/30 transition-colors border-b border-slate-100 last:border-b-0">
                        <td className="p-3 text-center text-xs font-bold text-slate-300 group-hover:text-blue-400">
                          {rowIndex + 1}
                        </td>
                        {entity.attributes.map((attr, colIndex) => (
                          <td key={colIndex} className="p-2 border-r border-slate-100 last:border-r-0">
                            <input
                              type="text"
                              value={record[attr.name] || ''}
                              onChange={(e) => handleChange(rowIndex, attr.name, e.target.value)}
                              placeholder={`Valor para ${attr.name}...`}
                              className="w-full bg-transparent text-sm text-slate-700 font-medium placeholder:text-slate-300 outline-none focus:placeholder:text-blue-300"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => removeRow(rowIndex)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remover linha"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Add Row Button */}
              <button 
                onClick={addRow}
                className="w-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors font-bold text-sm border-t border-slate-100"
              >
                <Plus className="w-4 h-4" />
                Adicionar Registro
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default OccurrenceModal;
