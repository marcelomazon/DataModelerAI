
import React, { useState, useEffect } from 'react';
import { Entity, Relationship, EvaluationResult, ModelData } from './types';
import Sandbox from './components/Sandbox';
import Home from './components/Home';
import EvaluationModal from './components/EvaluationModal';
import FeedbackModal from './components/FeedbackModal';
import SettingsModal from './components/SettingsModal';
import { evaluateModel } from './geminiService';
import { MessageCircle, Settings } from 'lucide-react';
import { canUseEvaluate, incrementEvaluate, getQuota, QuotaData } from './utils/quotaService';

const STORAGE_KEY = 'data-modeler-tutor-state';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'sandbox'>('home');
  const [caseStudy, setCaseStudy] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [quota, setQuota] = useState<QuotaData>(getQuota());

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

    if (!canUseEvaluate()) {
      alert("Você atingiu o limite diário de avaliações. Tente novamente amanhã ou configure sua própria chave da API.");
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await evaluateModel({ entities, relationships, caseStudy });
      setEvaluation(result);
      incrementEvaluate();
      setQuota(getQuota()); // Update state to reflect new token count
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
        <Home
          onStart={handleStartModeling}
          onImport={handleImportModel}
          onContinue={() => setView('sandbox')}
          hasActiveModel={entities.length > 0 || caseStudy.trim() !== ''}
        />
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
          quota={quota}
          onQuotaUpdate={() => setQuota(getQuota())}
        />
      )}

      {evaluation && (
        <EvaluationModal
          result={evaluation}
          onClose={() => setEvaluation(null)}
        />
      )}

      {/* Floating Settings Button */}
      <button
        onClick={() => setShowSettingsModal(true)}
        className="fixed bottom-24 left-6 z-50 p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 group flex items-center gap-2"
        title="Configurações de IA"
      >
        <Settings className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm">
          Ajustes IA
        </span>
      </button>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSave={() => setQuota(getQuota())}
        />
      )}

      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 group flex items-center gap-2"
        title="Enviar Feedback"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold text-sm">
          Feedback
        </span>
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal onClose={() => setShowFeedbackModal(false)} />
      )}
    </div>
  );
};

export default App;
