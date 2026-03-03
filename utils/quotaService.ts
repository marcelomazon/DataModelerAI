export const MAX_MENTOR_USES = 5;
export const MAX_EVALUATE_USES = 3;
export const MAX_SCENARIO_USES = 5;
export const MAX_SQL_USES = 3;

const QUOTA_STORAGE_KEY = 'data-modeler-ai-quota';

export interface QuotaData {
    date: string;
    mentorUses: number;
    evaluateUses: number;
    scenarioUses: number;
    sqlUses: number;
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const getQuota = (): QuotaData => {
    const today = getTodayDateString();
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);

    let quota: QuotaData;
    if (stored) {
        try {
            quota = JSON.parse(stored);
            // Reset if date is different from today
            if (quota.date !== today) {
                quota = { date: today, mentorUses: 0, evaluateUses: 0, scenarioUses: 0, sqlUses: 0 };
                saveQuota(quota);
            }

            // Fallback para assegurar que propriedades novas como sqlUses (adicionadas depois) existam
            if (quota.sqlUses === undefined) {
                quota.sqlUses = 0;
                saveQuota(quota);
            }
        } catch (e) {
            quota = { date: today, mentorUses: 0, evaluateUses: 0, scenarioUses: 0, sqlUses: 0 };
        }
    } else {
        quota = { date: today, mentorUses: 0, evaluateUses: 0, scenarioUses: 0, sqlUses: 0 };
        saveQuota(quota);
    }

    return quota;
};

const saveQuota = (quota: QuotaData) => {
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quota));
};

import { hasCustomKey } from './configService';

export const canUseMentor = (): boolean => hasCustomKey() || getQuota().mentorUses < MAX_MENTOR_USES;
export const canUseEvaluate = (): boolean => hasCustomKey() || getQuota().evaluateUses < MAX_EVALUATE_USES;
export const canUseScenario = (): boolean => hasCustomKey() || getQuota().scenarioUses < MAX_SCENARIO_USES;
export const canUseSQL = (): boolean => hasCustomKey() || getQuota().sqlUses < MAX_SQL_USES;

export const incrementMentor = (): void => {
    const quota = getQuota();
    quota.mentorUses++;
    saveQuota(quota);
};

export const incrementEvaluate = (): void => {
    const quota = getQuota();
    quota.evaluateUses++;
    saveQuota(quota);
};

export const incrementScenario = (): void => {
    const quota = getQuota();
    quota.scenarioUses++;
    saveQuota(quota);
};

export const incrementSQL = (): void => {
    const quota = getQuota();
    quota.sqlUses++;
    saveQuota(quota);
};
