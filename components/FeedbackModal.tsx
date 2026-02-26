import React, { useState } from 'react';
import { X, Send, Smile, Frown, Meh, Heart, ThumbsUp, Lightbulb, Code } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

const REACTIONS = [
  { id: 'love', icon: Heart, label: 'Amei', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'good', icon: ThumbsUp, label: 'Muito Bom', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'idea', icon: Lightbulb, label: 'Tenho uma Ideia', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'neutral', icon: Meh, label: 'Neutro', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  { id: 'bad', icon: Frown, label: 'Pode Melhorar', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [reaction, setReaction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (message.length > 200) {
      alert('A mensagem deve ter no máximo 200 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedReaction = reaction ? REACTIONS.find(r => r.id === reaction)?.label : null;

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          reaction: selectedReaction
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.simulated) {
          alert('Feedback simulado com sucesso! (Configure as variáveis SMTP para envio real).');
        } else {
          alert('Feedback enviado com sucesso!');
        }
        onClose();
      } else {
        alert(`Erro ao enviar feedback: ${data.error || 'Tente novamente mais tarde.'}`);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao enviar feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800">Enviar Feedback</h3>
            <p className="text-slate-500 text-sm mt-1">Sua opinião nos ajuda a melhorar.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como podemos te chamar?"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs font-bold ${message.length > 200 ? 'text-red-500' : 'text-slate-400'}`}>
                {message.length}/200
              </span>
            </div>
            <textarea
              required
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte-nos sua experiência, sugira melhorias ou relate problemas..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 transition-all resize-none h-28"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-3">
              Reação (Opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {REACTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReaction(reaction === r.id ? null : r.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${reaction === r.id
                      ? `${r.bg} ${r.border} ${r.color} ring-2 ring-offset-1 ring-${r.color.split('-')[1]}-200`
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  <r.icon className="w-3.5 h-3.5" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Developer Info Badge */}
          <div className="mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              <Code className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700">Desenvolvido por Marcelo Mazon</span>
              <a href="mailto:marcelo.mazon@prof.sc.senac.br" className="text-[10px] font-bold text-blue-600 hover:underline">
                marcelo.mazon@prof.sc.senac.br
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim() || message.length > 200}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
