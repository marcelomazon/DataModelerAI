
import { GoogleGenAI, Type } from "@google/genai";
import { ModelData, EvaluationResult } from "./types";

export type Difficulty = 'basic' | 'intermediate' | 'advanced';
export type DatabaseType = 'mysql' | 'postgres';

export const generateScenario = async (difficulty: Difficulty): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const descriptions = {
    basic: "2 a 3 entidades simples, focado em conceitos fundamentais.",
    intermediate: "4 a 7 entidades, incluindo a necessidade de entidades associativas (muitos-para-muitos).",
    advanced: "mais de 7 entidades, envolvendo situações complexas de interpretação de cardinalidades, auto-relacionamento e desafios de normalização."
  };

  const prompt = `
    Aja como um professor de banco de dados experiente e um excelente redator. 
    Crie um "Estudo de Caso" inédito para um exercício de modelagem de dados.
    Nível de Dificuldade: ${difficulty.toUpperCase()} (${descriptions[difficulty]})
    
    REGRAS DE CONTEÚDO E IDIOMA:
    1. Escreva o texto TOTALMENTE EM PROSA (texto corrido), organizado em parágrafos narrativos.
    2. O texto DEVE seguir rigorosamente a norma culta da língua portuguesa brasileira (pt-BR).
    3. GARANTA que toda a acentuação, ortografia e pontuação estejam perfeitas.
    4. NÃO use listas, tópicos, hífens, asteriscos ou numeração para descrever requisitos.
    5. O texto deve descrever o funcionamento cotidiano de uma organização e suas necessidades de informação de forma fluida.
    6. As regras de negócio devem estar imersas na narrativa para que o aluno precise interpretar o texto e identificar por conta própria as entidades, seus atributos essenciais e as cardinalidades dos relacionamentos.
    7. Evite nomes óbvios de tabelas; foque em descrever os processos.

    REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
    1. NÃO use NENHUMA formatação Markdown (negrito, itálico, hashtags para títulos).
    2. O resultado deve ser TEXTO PURO (plain text).
    3. Responda APENAS com o texto do cenário, sem introduções ou conclusões.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Erro ao gerar cenário.";
};

export const evaluateModel = async (data: ModelData): Promise<EvaluationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aja como um professor especialista em modelagem de dados (DER/MER).
    
    ESTUDO DE CASO:
    "${data.caseStudy}"
    
    O ALUNO MODELOU O SEGUINTE:
    Entidades e Atributos: ${JSON.stringify(data.entities.map(e => ({ 
      name: e.name, 
      attrs: e.attributes.map(a => `${a.name}${a.isPK ? ' (PK)' : ''}`) 
    })))}
    Relacionamentos: ${JSON.stringify(data.relationships.map(r => ({ 
      from: data.entities.find(e => e.id === r.fromId)?.name, 
      to: data.entities.find(e => e.id === r.toId)?.name,
      cardinality: r.cardinality 
    })))}

    Avalie se o modelo do aluno reflete corretamente as regras de negócio do estudo de caso.
    Considere se o aluno identificou corretamente as Chaves Primárias (PK).
    Atribua uma nota de 0 a 100.
    Forneça feedback construtivo em português (pt-BR) com acentuação correta.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          details: {
            type: Type.OBJECT,
            properties: {
              entities: { type: Type.STRING },
              attributes: { type: Type.STRING },
              relationships: { type: Type.STRING }
            },
            required: ["score", "feedback", "details"]
          }
        },
        required: ["score", "feedback", "details"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  try {
    return JSON.parse(jsonStr) as EvaluationResult;
  } catch (e) {
    throw new Error("Falha ao processar a avaliação da AI.");
  }
};

export const generateSQL = async (data: ModelData, dbType: DatabaseType = 'mysql'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const mysqlRules = `
    REGRAS ESPECÍFICAS PARA MYSQL:
    1. Use a sintaxe de criação de tabelas do MySQL.
    2. Utilize AUTO_INCREMENT para chaves primárias numéricas se apropriado.
    3. Inclua 'ENGINE=InnoDB' nas criações de tabela.
    4. Trate corretamente os relacionamentos N:N criando tabelas associativas.
    5. Defina as chaves estrangeiras (FOREIGN KEY) com as restrições de integridade necessárias.
  `;

  const postgresRules = `
    REGRAS ESPECÍFICAS PARA POSTGRESQL:
    1. Use a sintaxe de criação de tabelas do PostgreSQL.
    2. Utilize SERIAL ou BIGSERIAL para chaves primárias autoincrementais.
    3. Trate corretamente os relacionamentos N:N criando tabelas associativas.
    4. Use aspas duplas para nomes de tabelas ou colunas apenas se forem palavras reservadas (preferencialmente mantenha snake_case).
    5. Defina as chaves estrangeiras (FOREIGN KEY) com as restrições de integridade necessárias.
  `;

  const prompt = `
    Aja como um desenvolvedor de banco de dados especialista. Converta o seguinte modelo de dados (entidades e relacionamentos) em um script SQL DDL compatível com ${dbType === 'mysql' ? 'MySQL' : 'PostgreSQL'}.
    
    ${dbType === 'mysql' ? mysqlRules : postgresRules}
    
    6. Inclua comentários explicativos no código em português (pt-BR) com acentuação correta.
    
    DADOS DO MODELO:
    ${JSON.stringify({
      entities: data.entities.map(e => ({ name: e.name, attrs: e.attributes })),
      relationships: data.relationships
    })}

    Responda APENAS com o código SQL pronto para execução, sem blocos de código Markdown ou texto extra.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || `-- Erro ao gerar SQL para ${dbType}`;
};

export const getGuidedHint = async (data: ModelData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Aja como um mentor de modelagem de dados. O aluno está tentando resolver este estudo de caso:
    "${data.caseStudy}"

    Modelo atual do aluno:
    Entidades: ${data.entities.map(e => e.name).join(", ")}
    Relacionamentos: ${data.relationships.length} criados.

    Não dê a resposta completa. Dê uma DICA CURTA (máximo 2 frases) para ajudar o aluno a dar o próximo passo ou corrigir um erro provável.
    Foque em: uma entidade que falta, um atributo chave esquecido ou uma cardinalidade que parece errada.
    Responda em português brasileiro (pt-BR) com acentuação correta.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "Continue analisando os requisitos cuidadosamente.";
};
