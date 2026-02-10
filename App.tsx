
import React, { useState, useEffect } from 'react';
import { Entity, Relationship, EvaluationResult, ModelData } from './types';
import Sandbox from './components/Sandbox';
import Home from './components/Home';
import EvaluationModal from './components/EvaluationModal';
import { evaluateModel } from './geminiService';

const STORAGE_KEY = 'data-modeler-tutor-state';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'sandbox'>('home');
  const [caseStudy, setCaseStudy] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar estado inicial do localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { view: savedView, caseStudy: savedCase, entities: savedEntities, relationships: savedRels } = JSON.parse(savedState);
        setView(savedView || 'home');
        setCaseStudy(savedCase || '');
        setEntities(savedEntities || []);
        setRelationships(savedRels || []);
      } catch (e) {
        console.error("Erro ao carregar estado salvo:", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salvar estado sempre que houver mudanças
  useEffect(() => {
    if (isLoaded) {
      const stateToSave = {
        view,
        caseStudy,
        entities,
        relationships
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [view, caseStudy, entities, relationships, isLoaded]);

  const handleStartModeling = (text: string) => {
    setCaseStudy(text);
    setView('sandbox');
    // Limpa o modelo ao iniciar um novo caso
    setEntities([]);
    setRelationships([]);
    setEvaluation(null);
  };

  const handleImportModel = (data: ModelData) => {
    setCaseStudy(data.caseStudy);
    setEntities(data.entities);
    setRelationships(data.relationships);
    setView('sandbox');
    setEvaluation(null);
  };

  const handleEvaluate = async () => {
    if (entities.length === 0) {
      alert("Crie ao menos uma entidade para avaliar!");
      return;
    }
    
    setIsEvaluating(true);
    try {
      const result = await evaluateModel({ entities, relationships, caseStudy });
      setEvaluation(result);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('429')) {
        alert("Limite de cota excedido (Erro 429). Por favor, use o ícone de chave no cabeçalho para configurar sua própria chave da Gemini API.");
      } else {
        alert("Erro ao avaliar o modelo. Tente novamente.");
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!isLoaded) return null; // Evita flash de conteúdo antes de carregar o estado

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'home' ? (
        <Home onStart={handleStartModeling} onImport={handleImportModel} />
      ) : (
        <Sandbox 
          caseStudy={caseStudy}
          entities={entities}
          setEntities={setEntities}
          relationships={relationships}
          setRelationships={setRelationships}
          onEvaluate={handleEvaluate}
          isEvaluating={isEvaluating}
          onBack={() => setView('home')}
        />
      )}

      {evaluation && (
        <EvaluationModal 
          result={evaluation} 
          onClose={() => setEvaluation(null)} 
        />
      )}
    </div>
  );
};

export default App;
