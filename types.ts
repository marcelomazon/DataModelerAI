
export type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:N';

export type AttributeCategory = 'identifier' | 'descriptive' | 'multivalued' | 'composite' | 'referential';

export interface Attribute {
  name: string;
  isPK: boolean;
  category?: AttributeCategory;
}

export interface Entity {
  id: string;
  name: string;
  attributes: Attribute[];
  position: { x: number; y: number };
  isCollapsed?: boolean;
}

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  cardinality: Cardinality;
  name?: string;
  controlPointOffset?: { x: number; y: number };
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  details: {
    entities: string;
    attributes: string;
    relationships: string;
  };
}

export interface ModelData {
  entities: Entity[];
  relationships: Relationship[];
  caseStudy: string;
}
