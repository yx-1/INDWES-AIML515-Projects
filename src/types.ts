export type JurisdictionKey = 'austin' | 'seattle' | 'los_angeles';
export type PermitCategoryKey = 'deck_patio' | 'remodel' | 'adu' | 'electrical_upgrade';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Small Residential Contractor' | 'Permit Coordinator' | 'Small Construction Business Owner';
  company?: string;
}

export interface JurisdictionOption {
  key: JurisdictionKey;
  name: string;
  state: string;
  department: string;
  portalName: string;
  codeStandard: string;
}

export interface CategoryOption {
  key: PermitCategoryKey;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  typicalReviewTime: string;
}

export interface PermitDocument {
  documentName: string;
  description: string;
  isMandatory: boolean;
}

export interface SourceReference {
  title: string;
  codeReference: string;
  urlOrDocRef: string;
  department: string;
}

export interface PermitAnswer {
  summary: string;
  requiredDocuments: PermitDocument[];
  keyThresholds: string[];
  sources: SourceReference[];
  cautionaryNotice: string;
}

export interface SearchRecord {
  id: string;
  timestamp: number;
  jurisdiction: string;
  jurisdictionKey: JurisdictionKey;
  category: string;
  categoryKey: PermitCategoryKey;
  question: string;
  answer: PermitAnswer;
  mode: 'ai-generated' | 'verified-reference';
  feedback?: {
    rating: 'helpful' | 'not_helpful';
    comment?: string;
    submittedAt: number;
  };
}
