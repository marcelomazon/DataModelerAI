
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Entity, Relationship, Cardinality } from '../types';
import { Trash2, Edit3 } from 'lucide-react';

interface RelationshipLineProps {
  from: Entity;
  to: Entity;
  rel: Relationship;
  entities: Entity[];
  relationships: Relationship[];
  isExporting: boolean;
  onUpdate: (id: string, data: Partial<Relationship>) => void;
  onDelete: (id: string) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const RelationshipLine: React.FC<RelationshipLineProps> = ({ 
  from, to, rel, entities, relationships, isExporting, onUpdate, onDelete, canvasRef 
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [editValue, setEditValue] = useState(rel.name || '');
  const popoverTimeoutRef = useRef<number | null>(null);
  
  const CARD_WIDTH = 256; 
  const BORDER_WIDTH = 2; 
  const CROWFOOT_SIZE = 15; 
  const isSelf = from.id === to.id;
  
  // CONSTANTES DE PIXEL RÍGIDAS
  const HEADER_H = 37;
  const PADDING_V = 12; 
  const ATTR_H = 27;    
  const ATTR_GAP = 6;   
  const FORM_MT = 12;   
  const FORM_PT = 12;   
  const BORDER_T = 1;   
  const FORM_EL_H = 32; 
  const CARD_BORDERS = BORDER_WIDTH * 2; 

  const getCardHeight = (entity: Entity) => {
    if (entity.isCollapsed) return HEADER_H + CARD_BORDERS;
    
    const N = entity.attributes.length;
    const listHeight = N > 0 ? (ATTR_H * N + ATTR_GAP * (N - 1)) : 0;
    const attrAreaHeight = Math.max(40, listHeight);
    
    let totalHeight = CARD_BORDERS + HEADER_H + PADDING_V + attrAreaHeight + PADDING_V;

    if (!isExporting) {
      const formHeight = FORM_MT + FORM_PT + BORDER_T + FORM_EL_H;
      totalHeight += formHeight;
    }

    return totalHeight;
  };

  const getFace = (source: Entity, target: Entity) => {
    if (source.id === target.id) return 'right';
    const h1 = getCardHeight(source);
    const h2 = getCardHeight(target);
    const c1x = source.position.x + CARD_WIDTH / 2;
    const c1y = source.position.y + h1 / 2;
    const c2x = target.position.x + CARD_WIDTH / 2;
    const c2y = target.position.y + h2 / 2;
    const dx = c2x - c1x;
    const dy = c2y - c1y;
    
    if (Math.abs(dx) > Math.abs(dy) * 1.1) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'bottom' : 'top';
  };

  const connectionInfo = useMemo(() => {
    const faceFrom = getFace(from, to);
    const faceTo = isSelf ? 'top' : getFace(to, from);

    const getFaceGroup = (entityId: string, face: string) => {
      return relationships
        .filter(r => {
          const isF = r.fromId === entityId;
          const isT = r.toId === entityId;
          if (!isF && !isT) return false;
          const ent = entities.find(e => e.id === entityId);
          const otherId = isF ? r.toId : r.fromId;
          const other = entities.find(e => e.id === otherId);
          if (!ent || !other) return false;
          return getFace(ent, other) === face;
        })
        .sort((a, b) => a.id.localeCompare(b.id));
    };

    const groupFrom = getFaceGroup(from.id, faceFrom);
    const groupTo = getFaceGroup(to.id, faceTo);
    const indexFrom = groupFrom.findIndex(r => r.id === rel.id);
    const indexTo = groupTo.findIndex(r => r.id === rel.id);

    return { 
      faceFrom, 
      faceTo, 
      offsetFrom: (indexFrom - (groupFrom.length - 1) / 2) * 20, 
      offsetTo: (indexTo - (groupTo.length - 1) / 2) * 20 
    };
  }, [from, to, rel.id, entities, relationships, isSelf]);

  const { faceFrom, faceTo, offsetFrom, offsetTo } = connectionInfo;
  const h1 = getCardHeight(from);
  const h2 = getCardHeight(to);

  const getConnectionPoints = () => {
    let p1 = { x: 0, y: 0 };
    let p2 = { x: 0, y: 0 };
    
    const hasCrowStart = rel.cardinality === 'N:1' || rel.cardinality === 'N:N';
    const hasCrowEnd = rel.cardinality === '1:N' || rel.cardinality === 'N:N';
    const offS = hasCrowStart ? CROWFOOT_SIZE : 0;
    const offE = hasCrowEnd ? CROWFOOT_SIZE : 0;

    if (faceFrom === 'right') p1 = { x: from.position.x + CARD_WIDTH + offS, y: from.position.y + h1 / 2 + offsetFrom };
    else if (faceFrom === 'left') p1 = { x: from.position.x - offS, y: from.position.y + h1 / 2 + offsetFrom };
    else if (faceFrom === 'top') p1 = { x: from.position.x + CARD_WIDTH / 2 + offsetFrom, y: from.position.y - offS };
    else p1 = { x: from.position.x + CARD_WIDTH / 2 + offsetFrom, y: from.position.y + h1 + offS };

    if (isSelf) {
      p2 = { x: to.position.x + CARD_WIDTH + offE, y: to.position.y + 20 + offsetTo };
    } else {
      if (faceTo === 'right') p2 = { x: to.position.x + CARD_WIDTH + offE, y: to.position.y + h2 / 2 + offsetTo };
      else if (faceTo === 'left') p2 = { x: to.position.x - offE, y: to.position.y + h2 / 2 + offsetTo };
      else if (faceTo === 'top') p2 = { x: to.position.x + CARD_WIDTH / 2 + offsetTo, y: to.position.y - offE };
      else p2 = { x: to.position.x + CARD_WIDTH / 2 + offsetTo, y: to.position.y + h2 + offE };
    }

    return { p1, p2, dir: (faceFrom === 'left' || faceFrom === 'right') ? 'h' : 'v' };
  };

  const { p1, p2, dir } = getConnectionPoints();
  const userOffset = rel.controlPointOffset || { x: 0, y: 0 };
  
  let cp1, cp2;
  if (isSelf) {
    cp1 = { x: p1.x + 80 + userOffset.x, y: p1.y + userOffset.y };
    cp2 = { x: p1.x + 80 + userOffset.x, y: p1.y - 120 + userOffset.y };
  } else {
    const curvature = 60;
    cp1 = {
      x: p1.x + (dir === 'h' ? (faceFrom === 'left' ? -curvature : curvature) : 0) + userOffset.x,
      y: p1.y + (dir === 'v' ? (faceFrom === 'top' ? -curvature : curvature) : 0) + userOffset.y
    };
    cp2 = {
      x: p2.x + (dir === 'h' ? (faceTo === 'left' ? -curvature : curvature) : 0) + userOffset.x,
      y: p2.y + (dir === 'v' ? (faceTo === 'top' ? -curvature : curvature) : 0) + userOffset.y
    };
  }

  const pathData = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  const mid = isSelf ? { x: p1.x + 80 + userOffset.x, y: p1.y - 50 + userOffset.y } : { x: (p1.x + p2.x) / 2 + userOffset.x, y: (p1.y + p2.y) / 2 + userOffset.y };

  const handleSaveName = () => {
    onUpdate(rel.id, { name: editValue.trim() || undefined });
    setIsEditingName(false);
  };

  const handleMouseEnter = () => {
    if (isExporting) return;
    if (popoverTimeoutRef.current) window.clearTimeout(popoverTimeoutRef.current);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    popoverTimeoutRef.current = window.setTimeout(() => {
      setShowPopover(false);
    }, 300);
  };

  const labelText = rel.name ? `${rel.name} (${rel.cardinality})` : rel.cardinality;
  const labelWidth = Math.max(44, labelText.length * 7 + 16);

  return (
    <g className="group pointer-events-auto">
      <defs>
        <marker 
          id={`crowfoot-${rel.id}`} 
          viewBox="0 0 20 20" 
          markerUnits="userSpaceOnUse" 
          markerWidth="20" 
          markerHeight="20" 
          refX="0" 
          refY="10" 
          orient="auto-start-reverse"
        >
          <path d="M 0 10 L 15 2 M 0 10 L 15 18 M 0 10 L 15 10" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </marker>
      </defs>

      <path d={pathData} fill="none" stroke="transparent" strokeWidth="20" />
      
      <path 
        d={pathData} 
        fill="none" 
        stroke="#64748b" 
        strokeWidth="1.5" 
        markerStart={(rel.cardinality === 'N:1' || rel.cardinality === 'N:N') ? `url(#crowfoot-${rel.id})` : undefined} 
        markerEnd={(rel.cardinality === '1:N' || rel.cardinality === 'N:N') ? `url(#crowfoot-${rel.id})` : undefined} 
        className={isExporting ? "" : "group-hover:stroke-blue-500 transition-colors"} 
      />
      
      {!isExporting && (
        <g className={`opacity-0 group-hover:opacity-100 transition-opacity`}>
           <foreignObject x={mid.x - 20} y={mid.y - 30} width="40" height="40" className="pointer-events-none">
             <div className="flex justify-center pointer-events-auto">
                <button onClick={() => onDelete(rel.id)} className="p-2 bg-white border border-red-100 text-red-500 rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all transform hover:scale-110">
                  <Trash2 className="w-3 h-3" />
                </button>
             </div>
           </foreignObject>
        </g>
      )}

      <g 
        className={isExporting ? "" : "cursor-pointer"} 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={(e) => { e.stopPropagation(); !isExporting && setIsEditingName(true); }}
      >
        {!isEditingName || isExporting ? (
          <>
            <rect x={mid.x - labelWidth / 2} y={mid.y + 14} width={labelWidth} height={22} rx="11" fill="white" stroke="#e2e8f0" strokeWidth="1" className="shadow-sm transition-colors group-hover:stroke-blue-300" />
            <text x={mid.x} y={mid.y + 26} textAnchor="middle" dominantBaseline="middle" fill="#475569" fontSize="10" fontWeight="900" className="select-none uppercase tracking-tighter transition-colors group-hover:fill-blue-600">
              {labelText}
            </text>
            
            {showPopover && !isExporting && (
              <foreignObject x={mid.x - 70} y={mid.y + 36} width="140" height="60" className="pointer-events-none overflow-visible">
                <div 
                  className="flex flex-col items-center animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-auto"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                   <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-slate-200" />
                   
                   <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl flex overflow-hidden p-0.5">
                      {(['1:1', '1:N', 'N:1', 'N:N'] as Cardinality[]).map(type => (
                        <button 
                          key={type} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onUpdate(rel.id, { cardinality: type }); 
                            setShowPopover(false); 
                          }} 
                          className={`text-[9px] px-2.5 py-1.5 font-black transition-colors rounded-lg ${rel.cardinality === type ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-blue-50 text-slate-600'}`}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                </div>
              </foreignObject>
            )}
          </>
        ) : (
          <foreignObject x={mid.x - 60} y={mid.y + 12} width="120" height="32">
            <div className="flex items-center bg-white border-2 border-blue-500 rounded-lg shadow-xl px-2">
              <Edit3 className="w-3 h-3 text-blue-400 mr-1" />
              <input 
                autoFocus className="w-full h-7 text-[10px] font-bold outline-none px-2" value={editValue} 
                onChange={(e) => setEditValue(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} placeholder="Verbo..." 
              />
            </div>
          </foreignObject>
        )}
      </g>
    </g>
  );
};

export default RelationshipLine;
