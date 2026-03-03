import React, { useState, useEffect } from 'react';
import { X, Key, Bot, ShieldAlert, Cpu, Sparkles } from 'lucide-react';
import { AIConfig, AIProvider, getConfig, saveConfig } from '../utils/configService';

interface SettingsModalProps {
    onClose: () => void;
    onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave }) => {
    const [config, setConfig] = useState<AIConfig>({ provider: 'default', apiKey: '' });
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        setConfig(getConfig());
    }, []);

    const handleSave = () => {
        saveConfig(config);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Motor de IA</h2>
                            <p className="text-xs text-slate-500 font-medium">Configure as chaves e provedores</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Selecione o Provedor</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            <button
                                onClick={() => setConfig({ ...config, provider: 'default' })}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${config.provider === 'default'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Bot className={`w-8 h-8 ${config.provider === 'default' ? 'text-blue-600' : 'text-slate-400'}`} />
                                <div>
                                    <div className={`font-bold text-sm ${config.provider === 'default' ? 'text-blue-900' : 'text-slate-700'}`}>Padrão do Sistema</div>
                                    <div className={`text-[10px] ${config.provider === 'default' ? 'text-blue-600' : 'text-slate-500'}`}>Sujeito a limite diário</div>
                                </div>
                            </button>

                            <button
                                onClick={() => setConfig({ ...config, provider: 'gemini' })}
                                className={`p-4 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${config.provider === 'gemini'
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Sparkles className={`w-8 h-8 ${config.provider === 'gemini' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <div>
                                    <div className={`font-bold text-sm ${config.provider === 'gemini' ? 'text-emerald-900' : 'text-slate-700'}`}>Google Gemini</div>
                                    <div className={`text-[10px] ${config.provider === 'gemini' ? 'text-emerald-600' : 'text-slate-500'}`}>Chave própria (Uso Ilimitado)</div>
                                </div>
                            </button>

                            <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center gap-3 text-left opacity-60 cursor-not-allowed relative overflow-hidden group">
                                <div className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Em breve</div>
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <span className="text-slate-400 font-bold text-xs">GPT</span>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-500">OpenAI</div>
                                    <div className="text-[10px] text-slate-400">Pausado temporariamente</div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center gap-3 text-left opacity-60 cursor-not-allowed relative overflow-hidden group">
                                <div className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Em breve</div>
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <span className="text-slate-400 font-bold text-xs">CLA</span>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-500">Anthropic</div>
                                    <div className="text-[10px] text-slate-400">Pausado temporariamente</div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {config.provider !== 'default' && (
                        <div className="space-y-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                            <label className="text-sm font-bold text-slate-700 block">Sua Chave de API (API Key)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={config.apiKey}
                                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                    placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                                    className="block w-full pl-10 pr-12 py-3 border-2 border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:text-sm font-medium transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <span className="text-xs font-bold text-blue-600 hover:text-blue-800">
                                        {showKey ? 'Ocultar' : 'Mostrar'}
                                    </span>
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 flex items-start gap-1 mt-2 leading-tight">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                Sua chave fica armazenada apenas no seu navegador (localStorage) e não é enviada para nossos servidores.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95">
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
