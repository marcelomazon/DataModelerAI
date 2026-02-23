
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, ArrowLeft, Sparkles, Key, Download, X, FileJson, 
  Image as ImageIcon, FileText, Ban, ZoomIn, ZoomOut, 
  Maximize, Grid3X3, Loader2, Database, BookOpen, 
  Lightbulb, ChevronDown, Underline, Strikethrough, 
  Eraser, Type, Minus, Plus as PlusIcon, Copy, Bold, Table
} from 'lucide-react';
import { Entity, Relationship, Attribute } from '../types';
import EntityCard from './EntityCard';
import RelationshipLine from './RelationshipLine';
import { generateSQL, getGuidedHint, DatabaseType } from '../geminiService';
import { toPng } from 'html-to-image';
import SQLModal from './SQLModal';
import DataDictionaryModal from './DataDictionaryModal';
import OccurrenceModal from './OccurrenceModal';

interface SandboxProps {
  caseStudy: string;
  entities: Entity[];
  setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  relationships: Relationship[];
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  onEvaluate: () => void;
  isEvaluating: boolean;
  onBack: () => void;
}

type ExportType = 'json' | 'png' | 'txt';

const Sandbox: React.FC<SandboxProps> = ({ 
  caseStudy, entities, setEntities, relationships, setRelationships, onEvaluate, isEvaluating, onBack
}) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkStartId, setLinkStartId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState(`modelo-dados-${new Date().toISOString().slice(0, 10)}`);
  const [exportType, setExportType] = useState<ExportType>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [useSnap, setUseSnap] = useState(true);
  
  // Estados para Formatação do Estudo de Caso
  const [formattedCaseStudy, setFormattedCaseStudy] = useState(caseStudy);
  const [caseStudyFontSize, setCaseStudyFontSize] = useState(12);
  const [isFormattingOpen, setIsFormattingOpen] = useState(false);
  
  // Novas ferramentas
  const [showSQLModal, setShowSQLModal] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [showDBMenu, setShowDBMenu] = useState(false);
  const [isGeneratingSQL, setIsGeneratingSQL] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [selectedDB, setSelectedDB] = useState<DatabaseType>('mysql');
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mainAreaRef = useRef<HTMLElement>(null);
  const dbMenuRef = useRef<HTMLDivElement>(null);
  const studyTextRef = useRef<HTMLDivElement>(null);

  // Sincroniza o texto formatado quando um novo caso é gerado
  useEffect(() => {
    setFormattedCaseStudy(caseStudy);
  }, [caseStudy]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dbMenuRef.current && !dbMenuRef.current.contains(event.target as Node)) {
        setShowDBMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (studyTextRef.current) {
      setFormattedCaseStudy(studyTextRef.current.innerHTML);
    }
  };

  const clearFormatting = () => {
    setFormattedCaseStudy(caseStudy);
    setCaseStudyFontSize(12);
    if (studyTextRef.current) {
      studyTextRef.current.innerHTML = caseStudy;
    }
  };

  const addEntity = (name = 'Nova Entidade', attributeNames: string[] = []) => {
    const id = Math.random().toString(36).substr(2, 9);
    const attributes: Attribute[] = attributeNames.map(attrName => ({ 
      name: attrName.toLowerCase(), 
      isPK: false, 
      category: 'descriptive' 
    }));
    
    let spawnX = (window.innerWidth / 2 - 400 - transform.x) / transform.k;
    let spawnY = (window.innerHeight / 2 - 100 - transform.y) / transform.k;

    if (useSnap) {
      spawnX = Math.round(spawnX / 20) * 20;
      spawnY = Math.round(spawnY / 20) * 20;
    }

    const newEntity: Entity = {
      id,
      name,
      attributes,
      position: { x: spawnX, y: spawnY }
    };
    setEntities(prev => [...prev, newEntity]);
    setSelectedEntityId(id);
    return id;
  };

  const handleUpdateEntityData = (entityId: string, data: Record<string, string>[]) => {
    setEntities(prev => prev.map(e => e.id === entityId ? { ...e, data } : e));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const delta = -e.deltaY * zoomSpeed;
      const newK = Math.min(Math.max(transform.k + delta, 0.2), 3);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gx = (mouseX - transform.x) / transform.k;
        const gy = (mouseY - transform.y) / transform.k;
        setTransform({ k: newK, x: mouseX - gx * newK, y: mouseY - gy * newK });
      }
    } else if (!isLinking) {
      setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, [transform, isLinking]);

  const handleZoom = (delta: number) => {
    const newK = Math.min(Math.max(transform.k + delta, 0.2), 3);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const gx = (centerX - transform.x) / transform.k;
      const gy = (centerY - transform.y) / transform.k;
      setTransform({ k: newK, x: centerX - gx * newK, y: centerY - gy * newK });
    }
  };

  const resetView = () => {
    if (entities.length === 0) {
      setTransform({ x: 0, y: 0, k: 1 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    entities.forEach(e => {
      minX = Math.min(minX, e.position.x);
      minY = Math.min(minY, e.position.y);
      maxX = Math.max(maxX, e.position.x + 256);
      maxY = Math.max(maxY, e.position.y + 300);
    });
    const padding = 60;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const k = Math.min(rect.width / (maxX - minX + padding * 2), rect.height / (maxY - minY + padding * 2), 1.2);
      setTransform({ k, x: rect.width / 2 - ((minX + maxX) / 2) * k, y: rect.height / 2 - ((minY + maxY) / 2) * k });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setTransform(prev => ({ ...prev, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const handleGenerateSQL = async (dbType: DatabaseType) => {
    if (entities.length === 0) return alert("Crie entidades primeiro!");
    setSelectedDB(dbType);
    setShowDBMenu(false);
    setIsGeneratingSQL(true);
    try {
      const sql = await generateSQL({ entities, relationships, caseStudy }, dbType);
      setGeneratedSQL(sql);
      setShowSQLModal(true);
    } catch (err) {
      alert("Erro ao gerar SQL.");
    } finally {
      setIsGeneratingSQL(false);
    }
  };

  const handleGetHint = async () => {
    setIsGettingHint(true);
    try {
      const hint = await getGuidedHint({ entities, relationships, caseStudy });
      setActiveHint(hint);
    } catch (err) {
      alert("Erro ao buscar dica.");
    } finally {
      setIsGettingHint(false);
    }
  };

  const handleFinalExport = async () => {
    setIsExporting(true);
    setShowExportModal(false);

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (exportType === 'json') {
        const blob = new Blob([JSON.stringify({ entities, relationships, caseStudy }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportType === 'txt') {
        let content = `ESTUDO DE CASO:\n${caseStudy}\n\nENTIDADES:\n`;
        entities.forEach(e => {
          content += `- ${e.name}: ${e.attributes.map(a => a.name + (a.isPK ? '(PK)' : '')).join(', ')}\n`;
        });
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFileName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportType === 'png' && canvasRef.current) {
        const dataUrl = await toPng(canvasRef.current, {
          backgroundColor: '#f1f5f9', 
          style: { transform: 'none', left: '0', top: '0', position: 'relative' },
          width: Math.max(...entities.map(e => e.position.x + 300)) + 100,
          height: Math.max(...entities.map(e => e.position.y + 400)) + 100,
          filter: (node) => !node.classList?.contains('no-export')
        });
        const link = document.createElement('a');
        link.download = `${exportFileName}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao gerar arquivo de exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex flex-col mr-2">
            <h2 className="text-lg font-black text-slate-900 leading-tight">Sandbox de Modelagem</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Ativo</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black border border-slate-200">V1.12</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-1" />
          
          {!isLinking ? (
            <div className="flex items-center gap-2">
              <button onClick={() => addEntity()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95">
                <Plus className="w-4 h-4" />
                <span>Entidade</span>
              </button>
              <button 
                onClick={() => selectedEntityId && setShowOccurrenceModal(true)} 
                disabled={!selectedEntityId}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedEntityId ? "Simular Ocorrências (Dados)" : "Selecione uma entidade para simular ocorrências"}
              >
                <Table className={`w-4 h-4 ${selectedEntityId ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className="hidden xl:inline">Ocorrências</span>
              </button>
            </div>
          ) : (
            <button onClick={() => { setIsLinking(false); setLinkStartId(null); }} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-sm transition-all animate-pulse">
              <Ban className="w-4 h-4" />
              <span>Cancelar Link</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowDictModal(true)} title="Gerar dicionário de dados" className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition-colors">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span className="hidden xl:inline text-xs font-bold text-slate-600">Dicionário</span>
          </button>
          
          <div className="relative" ref={dbMenuRef}>
            <button 
              onClick={() => !isGeneratingSQL && setShowDBMenu(!showDBMenu)} 
              disabled={isGeneratingSQL} 
              title="Gerar script SQL DDL" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {isGeneratingSQL ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Database className="w-4 h-4 text-slate-600" />}
              <span className="hidden xl:inline text-xs font-bold text-slate-600">SQL DDL</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showDBMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showDBMenu && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                <p className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Selecione o SGBD:</p>
                <button 
                  onClick={() => handleGenerateSQL('mysql')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  MySQL
                  <span className="text-[10px] text-slate-400 font-normal">v8.0+</span>
                </button>
                <button 
                  onClick={() => handleGenerateSQL('postgres')}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  PostgreSQL
                  <span className="text-[10px] text-slate-400 font-normal">v14+</span>
                </button>
              </div>
            )}
          </div>

          <button onClick={() => setShowExportModal(true)} title="Exportar modelo de dados" className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-100 transition-colors">
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden lg:inline text-xs font-bold text-slate-600">Exportar</span>
          </button>
          <button onClick={onEvaluate} disabled={isEvaluating} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition-all">
            {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Avaliar Modelo
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative" ref={containerRef} onWheel={handleWheel}>
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col hidden lg:block z-20 relative">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Estudo de Caso</h3>
                 <div className="flex items-center gap-1">
                   <button onClick={() => setIsFormattingOpen(!isFormattingOpen)} title={isFormattingOpen ? "Ocultar formatação" : "Exibir formatação"} className={`p-1.5 rounded-lg transition-all ${isFormattingOpen ? 'bg-blue-50 text-blue-600 shadow-inner' : 'hover:bg-slate-100 text-slate-400 hover:text-blue-600'}`}>
                     <Type className="w-3.5 h-3.5" />
                   </button>
                   <button onClick={() => navigator.clipboard.writeText(caseStudy)} title="Copiar texto original" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all">
                     <Copy className="w-3.5 h-3.5" />
                   </button>
                 </div>
              </div>

              {/* Barra de Ferramentas de Formatação */}
              {isFormattingOpen && (
                <div className="mb-3 p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1 items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1 border-r border-slate-200 pr-1">
                    <button onClick={() => applyFormat('foreColor', '#3b82f6')} className="w-4 h-4 rounded-full bg-blue-500 hover:scale-110 transition-transform" title="Azul" />
                    <button onClick={() => applyFormat('foreColor', '#ef4444')} className="w-4 h-4 rounded-full bg-red-500 hover:scale-110 transition-transform" title="Vermelho" />
                    <button onClick={() => applyFormat('foreColor', '#22c55e')} className="w-4 h-4 rounded-full bg-green-500 hover:scale-110 transition-transform" title="Verde" />
                    <button onClick={() => applyFormat('foreColor', '#1e293b')} className="w-4 h-4 rounded-full bg-slate-800 hover:scale-110 transition-transform" title="Padrão" />
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-1">
                    <button onClick={() => applyFormat('bold')} className="p-1 rounded hover:bg-slate-200 text-slate-600" title="Negrito">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => applyFormat('underline')} className="p-1 rounded hover:bg-slate-200 text-slate-600" title="Sublinhar">
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => applyFormat('strikeThrough')} className="p-1 rounded hover:bg-slate-200 text-slate-600" title="Riscado">
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-r border-slate-200 pr-1">
                    <button onClick={() => setCaseStudyFontSize(prev => Math.max(8, prev - 1))} className="p-1 rounded hover:bg-slate-200 text-slate-600" title="Reduzir Tamanho do Texto">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setCaseStudyFontSize(prev => Math.min(24, prev + 1))} className="p-1 rounded hover:bg-slate-200 text-slate-600" title="Aumentar Tamanho do Texto">
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button onClick={clearFormatting} className="p-1 rounded hover:bg-red-50 text-red-500" title="Limpar todas as formatações">
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div 
                ref={studyTextRef}
                contentEditable
                suppressContentEditableWarning
                onKeyDown={(e) => {
                  if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
                    e.preventDefault();
                  }
                }}
                className="bg-slate-50 p-4 rounded-xl text-slate-600 italic leading-relaxed border max-h-96 overflow-y-auto outline-none transition-all selection:bg-blue-200"
                style={{ fontSize: `${caseStudyFontSize}px` }}
                dangerouslySetInnerHTML={{ __html: formattedCaseStudy }}
              />
            </div>

            <div className="mb-8">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-amber-700 uppercase flex items-center gap-1.5 tracking-widest"><Lightbulb className="w-3.5 h-3.5" /> Mentor IA</span>
                  <button onClick={handleGetHint} disabled={isGettingHint} className="text-[9px] font-black text-amber-600 hover:underline disabled:opacity-50 px-2 py-1 bg-white rounded-lg border border-amber-100">Pedir Dica</button>
                </div>
                <p className="text-[11px] text-amber-800 italic leading-snug">
                  {isGettingHint ? "Analisando seu progresso..." : activeHint || "Dificuldades? Peça uma dica para a IA analisar seu modelo."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main ref={mainAreaRef} className="flex-1 bg-slate-100 relative overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown}>
          <div className="absolute inset-0 canvas-grid pointer-events-none" style={{ backgroundPosition: `${transform.x}px ${transform.y}px`, backgroundSize: `${20 * transform.k}px ${20 * transform.k}px` }} />
          <div ref={canvasRef} className="absolute inset-0 origin-top-left" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
            {entities.map(entity => (
              <EntityCard
                key={entity.id} entity={entity} isSelected={selectedEntityId === entity.id} isLinking={isLinking && linkStartId === entity.id} isExporting={isExporting} 
                onClick={() => {
                  if (isLinking && linkStartId && linkStartId !== entity.id) {
                    setRelationships(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), fromId: linkStartId, toId: entity.id, cardinality: '1:N', controlPointOffset: { x: 0, y: 0 } }]);
                    setIsLinking(false);
                    setLinkStartId(null);
                  } else setSelectedEntityId(entity.id);
                }}
                onUpdate={(data) => setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, ...data } : e))}
                onDelete={() => setEntities(prev => prev.filter(e => e.id !== entity.id))}
                onStartLink={() => { setIsLinking(true); setLinkStartId(entity.id); }}
                canvasRef={canvasRef} zoom={transform.k} useSnap={useSnap}
              />
            ))}
            <svg className="absolute inset-0 w-[10000px] h-[10000px] pointer-events-none overflow-visible">
              {relationships.map(rel => {
                const from = entities.find(e => e.id === rel.fromId);
                const to = entities.find(e => e.id === rel.toId);
                if (!from || !to) return null;
                return (<RelationshipLine key={rel.id} from={from} to={to} rel={rel} entities={entities} relationships={relationships} isExporting={isExporting} onUpdate={(id, d) => setRelationships(prev => prev.map(r => r.id === id ? {...r, ...d} : r))} onDelete={(id) => setRelationships(prev => prev.filter(r => r.id !== id))} canvasRef={canvasRef} />);
              })}
            </svg>
          </div>
          
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-1 flex flex-col">
              <button onClick={() => setUseSnap(!useSnap)} className={`p-3 rounded-xl ${useSnap ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><Grid3X3 className="w-5 h-5" /></button>
              <button onClick={() => handleZoom(0.1)} className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><ZoomIn className="w-5 h-5" /></button>
              <button onClick={() => handleZoom(-0.1)} className="p-3 text-slate-600 hover:bg-slate-50 transition-colors"><ZoomOut className="w-5 h-5" /></button>
            </div>
            <button onClick={resetView} className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"><Maximize className="w-5 h-5" /></button>
          </div>
        </main>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800">Exportar Modelo</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-black text-slate-500 uppercase mb-3">Nome do Arquivo</label>
              <input type="text" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold outline-none focus:border-blue-500 transition-all" />
            </div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-3">Formato de Saída</label>
            <div className="grid grid-cols-3 gap-3 mb-8">
              <button onClick={() => setExportType('json')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${exportType === 'json' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-500 hover:border-slate-200'}`}><FileJson className="w-6 h-6" /><span className="text-[10px] font-black uppercase">JSON</span></button>
              <button onClick={() => setExportType('png')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${exportType === 'png' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-500 hover:border-slate-200'}`}><ImageIcon className="w-6 h-6" /><span className="text-[10px] font-black uppercase">PNG</span></button>
              <button onClick={() => setExportType('txt')} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${exportType === 'txt' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 text-slate-500 hover:border-slate-200'}`}><FileText className="w-6 h-6" /><span className="text-[10px] font-black uppercase">Texto</span></button>
            </div>
            <button onClick={handleFinalExport} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase shadow-xl transition-all transform active:scale-[0.98]">Baixar Arquivo</button>
          </div>
        </div>
      )}

      {showSQLModal && <SQLModal sql={generatedSQL} dbType={selectedDB} onClose={() => setShowSQLModal(false)} />}
      {showDictModal && <DataDictionaryModal entities={entities} onClose={() => setShowDictModal(false)} />}
      
      {showOccurrenceModal && selectedEntityId && (
        <OccurrenceModal 
          entity={entities.find(e => e.id === selectedEntityId)!} 
          onClose={() => setShowOccurrenceModal(false)} 
          onUpdate={(data) => handleUpdateEntityData(selectedEntityId, data)} 
        />
      )}

      {isExporting && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg font-black text-slate-800 animate-pulse">Processando exportação...</p>
        </div>
      )}
    </div>
  );
};

export default Sandbox;
