export type AIProvider = 'default' | 'gemini' | 'openai' | 'anthropic';

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
}

const CONFIG_STORAGE_KEY = 'data-modeler-ai-config';

export const getDefaultConfig = (): AIConfig => ({
    provider: 'default',
    apiKey: '',
});

export const getConfig = (): AIConfig => {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Fallback in case of older structure or corrupted data
            if (parsed && typeof parsed.provider === 'string') {
                return parsed as AIConfig;
            }
        } catch (e) {
            console.error("Erro ao carregar configurações da IA do Storage:", e);
        }
    }
    return getDefaultConfig();
};

export const saveConfig = (config: AIConfig): void => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const getActiveApiKey = (): string | undefined => {
    const config = getConfig();
    console.log("DEBUG getActiveApiKey:", {
        provider: config.provider,
        hasConfigKey: !!config.apiKey,
        envKeyExists: !!process.env.API_KEY,
        envKeyLength: process.env.API_KEY ? process.env.API_KEY.length : 0,
        envKeyPrefix: process.env.API_KEY ? process.env.API_KEY.substring(0, 7) : 'none'
    });
    if (config.provider === 'default' || config.apiKey.trim() === '') {
        return process.env.API_KEY?.trim();
    }
    return config.apiKey.trim();
};

export const hasCustomKey = (): boolean => {
    const config = getConfig();
    return config.provider !== 'default' && config.apiKey.trim() !== '';
};
