
import React, { useState, useRef } from 'react';
import { Network, Rocket, Sparkles, ChevronDown, Loader2, Upload } from 'lucide-react';
import { generateScenario, Difficulty } from '../geminiService';
import { ModelData } from '../types';

interface HomeProps {
  onStart: (text: string) => void;
  onImport: (data: ModelData) => void;
}

const Home: React.FC<HomeProps> = ({ onStart, onImport }) => {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examples = [
    "Um sistema de biblioteca precisa gerenciar livros, autores e empréstimos. Cada livro tem um título e ISBN. Um autor pode escrever vários livros. Um usuário pode fazer vários empréstimos.",
    "Uma clínica médica deseja controlar consultas. Pacientes agendam consultas com médicos. Médicos têm nome, especialidade e CRM. Pacientes têm nome, CPF e convênio. Uma consulta gera uma receita médica, com numero, data e descrição.",
  ];

  const handleGenerate = async (diff: Difficulty) => {
    setIsGenerating(true);
    setShowDifficultyMenu(false);
    try {
      const scenario = await generateScenario(diff);
      setInput(scenario);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar cenário. Verifique sua chave API ou conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.entities && json.relationships && json.caseStudy) {
          onImport(json);
        } else {
          alert("Arquivo JSON inválido. Certifique-se de que é um modelo exportado por este aplicativo.");
        }
      } catch (err) {
        alert("Erro ao ler o arquivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
      />
      <div className="bg-blue-600 p-4 rounded-2xl mb-8 shadow-xl shadow-blue-200">
        <Network className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        DataModeler<span className="text-blue-600">AI</span>
      </h1>
      <p className="text-xl text-slate-600 mb-12 max-w-2xl">
        Transforme requisitos textuais em diagramas de entidades e relacionamentos, com dicas inteligentes e feedbacks em tempo real.
      </p>

      <div className="w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between mb-3">
          <label className="text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Insira o Estudo de Caso (Cenário)
          </label>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
              title="Continuar edição de um arquivo exportado"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar Modelo
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDifficultyMenu(!showDifficultyMenu)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isGenerating ? 'Gerando...' : 'Gerar Cenário'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showDifficultyMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDifficultyMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => handleGenerate('basic')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 flex flex-col"
                  >
                    <span className="font-bold">Básico</span>
                    <span className="text-[10px] text-slate-400">2-3 entidades simples</span>
                  </button>
                  <button
                    onClick={() => handleGenerate('intermediate')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 flex flex-col border-y border-slate-50"
                  >
                    <span className="font-bold">Intermediário</span>
                    <span className="text-[10px] text-slate-400">4-7 entidades, N:N</span>
                  </button>
                  <button
                    onClick={() => handleGenerate('advanced')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 flex flex-col"
                  >
                    <span className="font-bold">Avançado</span>
                    <span className="text-[10px] text-slate-400">7+ entidades, normalização</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex: Uma oficina mecânica deseja um banco de dados para gerenciar ordens de serviço..."
          className="w-full h-48 p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none text-slate-800 text-lg"
        />
        
        <div className="mt-4 flex flex-wrap gap-2 mb-8">
          <span className="text-sm text-slate-500 py-1">Exemplos:</span>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setInput(ex)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors"
            >
              Exemplo {i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => input.trim() && onStart(input)}
          disabled={!input.trim() || isGenerating}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-blue-200 disabled:shadow-none"
        >
          <Rocket className="w-6 h-6" />
          Iniciar Modelagem
        </button>
      </div>
    </div>
  );
};

export default Home;
