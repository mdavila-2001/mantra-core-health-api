/** Lateralidad del sitio anatómico. */
export type Laterality = 'LEFT' | 'RIGHT' | 'BILATERAL';
export const LATERALITIES = ['LEFT', 'RIGHT', 'BILATERAL'] as const;

/** Gravedad de un evento clínico. */
export type ClinicalSeverity = 'ROUTINE' | 'MINOR' | 'MAJOR' | 'CRITICAL';
export const CLINICAL_SEVERITIES = [
  'ROUTINE',
  'MINOR',
  'MAJOR',
  'CRITICAL',
] as const;
