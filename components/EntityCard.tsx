
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Link2, GripHorizontal, Key, ChevronDown, FileText, Layers, Component, Hash, ChevronRight, Check, GripVertical, Settings2 } from 'lucide-react';
import { Entity, Attribute, AttributeCategory } from '../types';

interface EntityCardProps {
  entity: Entity;
  isSelected: boolean;
  isLinking: boolean;
  isExporting: boolean;
  onClick: () => void;
  onUpdate: (data: Partial<Entity>) => void;
  onDelete: () => void;
  onStartLink: () => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
  useSnap?: boolean;
}

const CATEGORIES: { id: AttributeCategory; label: string; icon: any; color: string; bgColor: string; borderColor: string; marker: string }[] = [
  { id: 'identifier', label: 'Identificador', icon: Key, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', marker: '(PK)' },
  { id: 'descriptive', label: 'Descritivo', icon: FileText, color: 'text-slate-500', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', marker: '' },
  { id: 'multivalued', label: 'Multivalorado', icon: Layers, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', marker: '[ ]' },
  { id: 'composite', label: 'Composto', icon: Component, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', marker: '(...)' },
  { id: 'referential', label: 'Referencial', icon: Hash, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', marker: '(FK)' },
];

const EntityCard: React.FC<EntityCardProps> = ({ 
  entity, isSelected, isLinking, isExporting, onClick, onUpdate, onDelete, onStartLink, canvasRef, zoom = 1, useSnap = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingAttrIndex, setEditingAttrIndex] = useState<number | null>(null);
  const [editingAttrValue, setEditingAttrValue] = useState('');
  const [openCategoryMenuIdx, setOpenCategoryMenuIdx] = useState<number | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [draggedAttrIndex, setDraggedAttrIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenCategoryMenuIdx(null);
      }
      const target = event.target as HTMLElement;
      if (!target.closest(`.entity-card-${entity.id}`)) {
        setIsConfirmingDelete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [entity.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExporting) return;
    e.stopPropagation();
    if (!canvasRef.current) return;
    
    setIsDragging(true);
    onClick();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let localX = (e.clientX - rect.left) / zoom - dragOffset.x;
    let localY = (e.clientY - rect.top) / zoom - dragOffset.y;
    
    if (useSnap) {
      localX = Math.round(localX / 20) * 20;
      localY = Math.round(localY / 20) * 20;
    }
    
    onUpdate({ position: { x: localX, y: localY } });
  }, [isDragging, canvasRef, onUpdate, zoom, dragOffset, useSnap]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const addAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAttrName.trim()) {
      const newAttr: Attribute = { name: newAttrName.trim().toLowerCase(), isPK: false, category: 'descriptive' };
      onUpdate({ attributes: [...entity.attributes, newAttr] });
      setNewAttrName('');
    }
  };

  const removeAttribute = (index: number) => {
    onUpdate({ attributes: entity.attributes.filter((_, i) => i !== index) });
  };

  const updateAttributeCategory = (index: number, category: AttributeCategory) => {
    const newAttributes = [...entity.attributes];
    newAttributes[index] = { 
      ...newAttributes[index], 
      category, 
      isPK: category === 'identifier' 
    };
    onUpdate({ attributes: newAttributes });
    setOpenCategoryMenuIdx(null);
  };

  const startEditingAttribute = (index: number, value: string) => {
    if (isExporting) return;
    setEditingAttrIndex(index);
    setEditingAttrValue(value);
  };

  const saveAttributeEdit = () => {
    if (editingAttrIndex !== null) {
      const newAttributes = [...entity.attributes];
      if (editingAttrValue.trim()) {
        newAttributes[editingAttrIndex] = { ...newAttributes[editingAttrIndex], name: editingAttrValue.trim().toLowerCase() };
        onUpdate({ attributes: newAttributes });
      } else {
        removeAttribute(editingAttrIndex);
      }
      setEditingAttrIndex(null);
      setEditingAttrValue('');
    }
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ isCollapsed: !entity.isCollapsed });
  };

  const handleAttrDragStart = (e: React.DragEvent, index: number) => {
    if (isExporting) {
        e.preventDefault();
        return;
    }
    setDraggedAttrIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAttrDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedAttrIndex === null || draggedAttrIndex === index) return;
    
    const newAttributes = [...entity.attributes];
    const item = newAttributes[draggedAttrIndex];
    newAttributes.splice(draggedAttrIndex, 1);
    newAttributes.splice(index, 0, item);
    
    onUpdate({ attributes: newAttributes });
    setDraggedAttrIndex(index);
  };

  return (
    <div
      className={`absolute w-64 bg-white rounded-xl shadow-lg border-2 transition-shadow overflow-visible cursor-default select-none entity-card-${entity.id} ${
        isSelected && !isExporting ? 'border-blue-500 ring-4 ring-blue-100 shadow-xl' : 'border-slate-200'
      } ${isLinking && !isExporting ? 'border-blue-500 animate-pulse' : ''}`}
      style={{ left: entity.position.x, top: entity.position.y, boxSizing: 'border-box' }}
      onClick={(e) => { e.stopPropagation(); !isExporting && onClick(); }}
    >
      <div 
        className={`px-[12px] py-[8px] border-b flex items-center justify-between cursor-move rounded-t-lg transition-colors h-[37px] ${isSelected && !isExporting ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-800'}`}
        onMouseDown={handleMouseDown}
        style={{ boxSizing: 'border-box' }}
      >
        <div className="flex items-center gap-[6px] flex-1 min-w-0">
          {!isExporting && (
            <button 
              onClick={toggleCollapse}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-black/10 transition-colors shrink-0 no-export"
            >
              {entity.isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          
          {!isExporting && <GripHorizontal className="w-3.5 h-3.5 opacity-60 shrink-0 no-export" />}
          
          {isEditingName && !isExporting ? (
            <input
              autoFocus
              className="bg-white text-slate-800 px-2 h-6 rounded w-full outline-none text-xs font-bold"
              value={entity.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="font-bold truncate text-sm flex items-center gap-[6px]" onDoubleClick={() => !isExporting && setIsEditingName(true)}>
              {entity.name}
              {(entity.isCollapsed || isExporting) && entity.attributes.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected && !isExporting ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {entity.attributes.length}
                </span>
              )}
            </span>
          )}
        </div>
        
        {!isExporting && (
          <div className="flex items-center gap-1 ml-2 shrink-0 no-export">
            {!isConfirmingDelete ? (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); onStartLink(); }} 
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="Relacionar"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }} 
                  className="p-1 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }} className={`p-1 rounded-md transition-colors ${isSelected ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!entity.isCollapsed && (
        <div className="p-[12px] flex flex-col animate-in fade-in slide-in-from-top-1 duration-200" style={{ boxSizing: 'border-box' }}>
          <div 
            className={`flex flex-col gap-[6px] min-h-[40px] ${isConfirmingDelete && !isExporting ? 'opacity-30 pointer-events-none grayscale' : ''}`}
            style={{ boxSizing: 'border-box' }}
          >
            {entity.attributes.map((attr, idx) => {
              const currentCatId = attr.category || (attr.isPK ? 'identifier' : 'descriptive');
              const cat = CATEGORIES.find(c => c.id === currentCatId) || CATEGORIES[1];
              const isMenuOpen = openCategoryMenuIdx === idx;

              return (
                <div 
                  key={idx} 
                  draggable={!isExporting && editingAttrIndex !== idx}
                  onDragStart={(e) => handleAttrDragStart(e, idx)}
                  onDragOver={(e) => handleAttrDragOver(e, idx)}
                  onDragEnd={() => setDraggedAttrIndex(null)}
                  className={`relative group flex items-center justify-between border px-[8px] py-[4px] rounded-lg text-xs text-slate-700 transition-all h-[27px] ${cat.bgColor} ${cat.borderColor} ${draggedAttrIndex === idx ? 'opacity-40 scale-95' : ''}`}
                  style={{ boxSizing: 'border-box' }}
                >
                  <div className="flex items-center gap-[8px] flex-1 min-w-0">
                    {!isExporting && (
                      <div className="text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing no-export">
                        <GripVertical className="w-3 h-3" />
                      </div>
                    )}
                    
                    <div className="relative shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); !isExporting && setOpenCategoryMenuIdx(isMenuOpen ? null : idx); }}
                        className={`p-0.5 rounded-md bg-white shadow-sm border border-slate-200/50 transition-transform ${!isExporting ? 'hover:scale-110 active:scale-95' : ''} ${cat.color}`}
                      >
                        <cat.icon className={`w-3 h-3 ${attr.isPK ? 'fill-current opacity-70' : ''}`} />
                      </button>

                      {isMenuOpen && !isExporting && (
                        <div 
                          ref={menuRef}
                          className="absolute left-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 no-export"
                        >
                          <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Classificar como:</p>
                          {CATEGORIES.map(c => (
                            <button
                              key={c.id}
                              onClick={() => updateAttributeCategory(idx, c.id)}
                              className={`w-full text-left px-4 py-2 text-[11px] font-bold flex items-center gap-3 transition-colors ${currentCatId === c.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                              <div className={`p-1 rounded bg-white border ${c.color} ${c.borderColor}`}>
                                <c.icon className="w-3 h-3" />
                              </div>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingAttrIndex === idx && !isExporting ? (
                        <input
                          autoFocus
                          className="w-full bg-white border border-blue-400 rounded px-1 py-0.5 outline-none text-[11px] font-medium"
                          value={editingAttrValue}
                          onChange={(e) => setEditingAttrValue(e.target.value)}
                          onBlur={saveAttributeEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveAttributeEdit()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 cursor-text" onDoubleClick={(e) => { e.stopPropagation(); startEditingAttribute(idx, attr.name); }}>
                          <span className={`truncate text-[11px] leading-tight ${attr.isPK ? 'font-black text-slate-900 underline underline-offset-2' : 'font-medium'}`}>
                            {attr.name}
                          </span>
                          {cat.marker && <span className={`text-[9px] font-black opacity-40 ${cat.color}`}>{cat.marker}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isExporting && editingAttrIndex !== idx && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeAttribute(idx); }} 
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all no-export"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {!isExporting && (
            <form 
              onSubmit={addAttribute} 
              className="flex gap-2 mt-[12px] pt-[12px] mb-0 border-t border-slate-100 no-export"
              style={{ boxSizing: 'border-box' }}
            >
              <input
                placeholder="Novo Atributo..."
                className="min-w-0 flex-1 h-[32px] text-[11px] font-medium border border-slate-200 rounded-xl px-3 outline-none focus:border-blue-400 transition-all"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
              />
              <button type="submit" disabled={!newAttrName.trim()} className="shrink-0 w-[32px] h-[32px] bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm flex items-center justify-center border border-slate-100">
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default EntityCard;
