
import React, { useState, useEffect } from 'react';
import { X, Heart, MessageSquare, Lightbulb, Send, CheckCircle2, Loader2, Star } from 'lucide-react';
import { fetchGlobalLikes, incrementGlobalLikes } from '../geminiService';

interface FeedbackModalProps {
  onClose: () => void;
}

type Tab = 'like' | 'comment' | 'suggestion';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('like');
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Estados para curtidas globais
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [isLoadingLikes, setIsLoadingLikes] = useState(true);

  // Carrega as curtidas globais do "servidor" ao montar o componente
  useEffect(() => {
    const loadLikes = async () => {
      setIsLoadingLikes(true);
      try {
        const count = await fetchGlobalLikes();
        setLikesCount(count);
      } catch (error) {
        console.error("Erro ao carregar curtidas globais", error);
      } finally {
        setIsLoadingLikes(false);
      }
    };

    const savedLike = localStorage.getItem('app-liked');
    if (savedLike) setIsLiked(true);
    
    loadLikes();
  }, []);

  const handleLike = async () => {
    if (isLiked) return; // Uma vez curtido, o usuário não pode descurtir globalmente nesta demo

    const nextState = true;
    setIsLiked(nextState);
    
    // Atualiza UI localmente imediatamente
    setLikesCount(prev => (prev !== null ? prev + 1 : 1));
    localStorage.setItem('app-liked', 'true');

    // Persiste no "servidor"
    try {
      await incrementGlobalLikes();
    } catch (error) {
      console.error("Falha ao persistir curtida no servidor", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulando envio de feedback/sugestão para backend/API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Feedback Hub</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Obrigado pelo carinho!</h3>
            <p className="text-slate-500 text-sm">Sua opinião nos ajuda a construir uma ferramenta cada vez melhor.</p>
          </div>
        ) : (
          <>
            <div className="px-4 mb-6">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('like')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'like' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Heart className={`w-4 h-4 ${activeTab === 'like' ? 'fill-blue-600' : ''}`} />
                  Curtir
                </button>
                <button 
                  onClick={() => setActiveTab('comment')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'comment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Comentar
                </button>
                <button 
                  onClick={() => setActiveTab('suggestion')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'suggestion' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Melhorias
                </button>
              </div>
            </div>

            <div className="px-8 pb-8">
              {activeTab === 'like' && (
                <div className="py-6 flex flex-col items-center text-center animate-in fade-in duration-300">
                  <button 
                    onClick={handleLike}
                    disabled={isLiked}
                    className={`group relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 active:scale-90 ${isLiked ? 'bg-red-50 text-red-500 border-red-100 border-2 cursor-default' : 'bg-slate-50 text-slate-300 border-slate-100 border-2 hover:border-red-200 hover:text-red-300'}`}
                  >
                    <Heart className={`w-10 h-10 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked && <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20" />}
                  </button>
                  <div className="mt-6">
                    {isLoadingLikes ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-200 mx-auto" />
                    ) : (
                      <span className="text-3xl font-black text-slate-800">{likesCount?.toLocaleString()}</span>
                    )}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pessoas amaram o app globalmente</p>
                  </div>
                  <p className="mt-6 text-sm text-slate-500 leading-relaxed italic">
                    {isLiked ? "Ficamos muito felizes que você está gostando!" : "O que achou da experiência? Dê um coração se estiver aprendendo bastante!"}
                  </p>
                </div>
              )}

              {activeTab === 'comment' && (
                <form onSubmit={handleSubmit} className="animate-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-500 mb-4">Conte-nos sua experiência geral com o DataModelerAI.</p>
                  <textarea 
                    autoFocus
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escreva aqui seu depoimento..."
                    className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    required
                  />
                  <button 
                    disabled={isSubmitting || !comment.trim()}
                    className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    Enviar Comentário
                  </button>
                </form>
              )}

              {activeTab === 'suggestion' && (
                <form onSubmit={handleSubmit} className="animate-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-500 mb-4">Tem alguma ideia de nova funcionalidade ou correção?</p>
                  <textarea 
                    autoFocus
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="Ex: Gostaria de ver exportação para PDF ou mais tipos de atributos..."
                    className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    required
                  />
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><Star className="w-4 h-4" /></div>
                    <p className="text-[11px] text-blue-700 leading-snug">
                      <strong>Sugestão VIP:</strong> Feedbacks técnicos são analisados por nossa IA para priorizar o desenvolvimento de novas ferramentas.
                    </p>
                  </div>
                  <button 
                    disabled={isSubmitting || !suggestion.trim()}
                    className="w-full mt-6 py-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    Sugerir Melhoria
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
