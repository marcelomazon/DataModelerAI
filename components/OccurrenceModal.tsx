import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Entity, Relationship } from '../types';

interface OccurrenceModalProps {
  entity: Entity;
  entities: Entity[];
  relationships: Relationship[];
  onClose: () => void;
  onUpdate: (data: Record<string, string>[]) => void;
}

const OccurrenceModal: React.FC<OccurrenceModalProps> = ({ entity, entities, relationships, onClose, onUpdate }) => {
  const [records, setRecords] = useState<Record<string, string>[]>(entity.data || []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Calcula todas as opções disponíveis nas tabelas referenciadas por atributo (mapeando cada atributo)
  const referentialOptionsByAttr = useMemo(() => {
    const relatedEntities: Entity[] = [];
    relationships.forEach(rel => {
      if (rel.fromId === entity.id) {
        const other = entities.find(e => e.id === rel.toId);
        if (other) relatedEntities.push(other);
      } else if (rel.toId === entity.id) {
        const other = entities.find(e => e.id === rel.fromId);
        if (other) relatedEntities.push(other);
      }
    });

    const optionsMap: Record<string, { value: string, label: string }[]> = {};

    entity.attributes.forEach(attr => {
      if (attr.category === 'referential') {
        const attrBaseName = attr.name.toLowerCase();

        // Filtra considerando as tabelas onde o nome da coluna tem o prefixo da tabela (ou vice-versa)
        const matchingEntities = relatedEntities.filter(relEntity =>
          attrBaseName.startsWith(relEntity.name.toLowerCase()) ||
          attrBaseName.includes(relEntity.name.toLowerCase())
        );

        // Usa as tabelas que deram match no nome. Se não houver correspondência exata de nome, fallback para todas as relacionadas.
        const entitiesToUse = matchingEntities.length > 0 ? matchingEntities : relatedEntities;

        const options: { value: string, label: string }[] = [];

        entitiesToUse.forEach(relEntity => {
          const pkAttr = relEntity.attributes.find(a => a.isPK) || relEntity.attributes[0];
          const descAttr = relEntity.attributes.find(a => !a.isPK && a.category === 'descriptive')
            || relEntity.attributes.find(a => !a.isPK && a.name !== pkAttr?.name);

          if (!pkAttr) return;

          (relEntity.data || []).forEach(record => {
            const pkVal = record[pkAttr.name];
            if (pkVal && pkVal.trim() !== '') {
              const descVal = descAttr && record[descAttr.name] ? record[descAttr.name] : '';
              const label = descVal ? `${relEntity.name}: ${pkVal} - ${descVal}` : `${relEntity.name}: ${pkVal}`;
              options.push({ value: pkVal, label });
            }
          });
        });

        optionsMap[attr.name] = options;
      }
    });

    return optionsMap;
  }, [entity, entities, relationships]);

  const handleSave = () => {
    setErrorMsg(null);

    // Identificar quais colunas são PK
    const pkAttributes = entity.attributes.filter(a => a.isPK);

    // Se existir PK, fazemos a validação de unicidade
    if (pkAttributes.length > 0) {
      const seenPks = new Set<string>();

      for (const record of records) {
        // Verifica se a linha não está vazia
        const isEmpty = !Object.values(record).some(val => val && val.trim() !== '');
        if (isEmpty) continue;

        // Concatena os valores das chaves primárias (para suportar PKs compostas)
        const pkValueSignature = pkAttributes.map(attr => (record[attr.name] || '').trim()).join('|');

        // Se a assinatura de PK tiver algum valor (não for totalmente vazia)
        if (pkValueSignature.replace(/\|/g, '') !== '') {
          if (seenPks.has(pkValueSignature)) {
            const pkNames = pkAttributes.map(a => a.name).join(', ');
            setErrorMsg(`Existem registros com valores duplicados na Chave Primária (${pkNames}). Uma PK não pode se repetir.`);
            return; // Aborta o salvamento
          }
          seenPks.add(pkValueSignature);
        }
      }
    }

    // Filter out completely empty rows se passou pela validação
    const validRecords = records.filter(record => Object.values(record).some(val => val && val.trim() !== ''));
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
                            {attr.name}
                            {attr.isPK && <span className="text-amber-500 text-[10px]">(PK)</span>}
                            {attr.category === 'referential' && <span className="text-emerald-500 text-[10px]">(FK)</span>}
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
                        {entity.attributes.map((attr, colIndex) => {
                          const optionsForAttr = referentialOptionsByAttr[attr.name] || [];
                          return (
                            <td key={colIndex} className="p-2 border-r border-slate-100 last:border-r-0">
                              {attr.category === 'referential' && optionsForAttr.length > 0 ? (
                                <select
                                  value={record[attr.name] || ''}
                                  onChange={(e) => handleChange(rowIndex, attr.name, e.target.value)}
                                  className="w-full bg-transparent text-sm text-slate-700 font-medium outline-none focus:text-blue-600 cursor-pointer"
                                >
                                  <option value="" disabled className="text-slate-300">Selecionar...</option>
                                  {optionsForAttr.map((opt, i) => (
                                    <option key={i} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={record[attr.name] || ''}
                                  onChange={(e) => handleChange(rowIndex, attr.name, e.target.value)}
                                  placeholder={`Valor para ${attr.name}...`}
                                  className="w-full bg-transparent text-sm text-slate-700 font-medium placeholder:text-slate-300 outline-none focus:placeholder:text-blue-300"
                                />
                              )}
                            </td>
                          )
                        })}
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
        <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-3xl">
          <div className="flex-1 flex items-center">
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
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
    </div>
  );
};

export default OccurrenceModal;
