import { defineModuleConcepts } from '../../common/seed/concept-seed';
import { CONCEPTS } from '../../common';
import { AUD } from '../audit/audit.concepts';

/** Quien puede leer las vistas de calidad de datos y de solicitudes de privacidad. */
export const GOVERNANCE_READ_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DPO',
  'AUDITOR',
  'DATA_STEWARD',
] as const;

/** Quien puede resolver o descartar una incidencia de calidad. Los auditores sólo leen. */
export const QUALITY_RESOLVE_ROLES = [
  'GOVERNANCE_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'DATA_STEWARD',
  'PLATFORM_ADMIN',
] as const;

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Estados de una incidencia de calidad que el módulo `health_data` no declara: sólo existía
 * `QUALITY_ISSUE_OPEN`. Se declaran aquí con el patrón de conceptos por módulo; hay que añadir
 * `GOVERNANCE_ADMIN_CONCEPT_SEEDS` al agregador `common/seed/module-concepts.ts` para que la fila
 * exista en `terminology.catalog_concepts` (la FK `status_concept_id` la exige).
 */
export const { seeds: GOVERNANCE_ADMIN_CONCEPT_SEEDS, ids: GOV } =
  defineModuleConcepts('governance_admin', {
    ISSUE_RESOLVED: {
      code: 'QUAL_ISSUE_RESOLVED',
      display: 'Quality issue resolved',
    },
    ISSUE_DISMISSED: {
      code: 'QUAL_ISSUE_DISMISSED',
      display: 'Quality issue dismissed',
    },
  });

export const ISSUE_STATUSES = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_CONCEPT: Readonly<Record<IssueStatus, string>> = {
  OPEN: CONCEPTS.QUALITY_ISSUE_OPEN,
  RESOLVED: GOV.ISSUE_RESOLVED,
  DISMISSED: GOV.ISSUE_DISMISSED,
};

export const SEVERITIES = ['FATAL', 'ERROR', 'WARNING', 'INFORMATION'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_CONCEPT: Readonly<Record<Severity, string>> = {
  FATAL: CONCEPTS.ISSUE_SEV_FATAL,
  ERROR: CONCEPTS.ISSUE_SEV_ERROR,
  WARNING: CONCEPTS.ISSUE_SEV_WARNING,
  INFORMATION: CONCEPTS.ISSUE_SEV_INFORMATION,
};

export const DSAR_STATUSES = [
  'RECEIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
] as const;
export type DsarStatus = (typeof DSAR_STATUSES)[number];

export const DSAR_STATUS_CONCEPT: Readonly<Record<DsarStatus, string>> = {
  RECEIVED: AUD.DSAR_RECEIVED,
  IN_PROGRESS: AUD.DSAR_IN_PROGRESS,
  COMPLETED: AUD.DSAR_COMPLETED,
  REJECTED: AUD.DSAR_REJECTED,
};

export const DSAR_TYPES = [
  'ACCESS',
  'ERASURE',
  'RECTIFICATION',
  'PORTABILITY',
  'OBJECTION',
] as const;
export type DsarType = (typeof DSAR_TYPES)[number];

export const DSAR_TYPE_CONCEPT: Readonly<Record<DsarType, string>> = {
  ACCESS: AUD.DSAR_TYPE_ACCESS,
  ERASURE: AUD.DSAR_TYPE_ERASURE,
  RECTIFICATION: AUD.DSAR_TYPE_RECTIFICATION,
  PORTABILITY: AUD.DSAR_TYPE_PORTABILITY,
  OBJECTION: AUD.DSAR_TYPE_OBJECTION,
};

export const DSAR_JURISDICTIONS = ['PE', 'EU', 'US'] as const;
export type DsarJurisdiction = (typeof DSAR_JURISDICTIONS)[number];

export const DSAR_JURISDICTION_CONCEPT: Readonly<
  Record<DsarJurisdiction, string>
> = {
  PE: AUD.JURISDICTION_PE,
  EU: AUD.JURISDICTION_EU,
  US: AUD.JURISDICTION_US,
};

/**
 * Transiciones que `PATCH /privacy/dsar/:id` admite hoy (ver `ComplianceService.updateDsar`):
 * el estado terminal no admite más. La lista que se publica en el detalle sale de aquí, de modo
 * que la pantalla no la reconstruye por su cuenta.
 */
export const DSAR_TRANSITIONS: Readonly<
  Record<DsarStatus, readonly DsarStatus[]>
> = {
  RECEIVED: ['IN_PROGRESS', 'COMPLETED', 'REJECTED'],
  IN_PROGRESS: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
};

/** Invierte un mapa código → concepto; lo desconocido no se adivina. */
export function codeOfConcept<T extends string>(
  map: Readonly<Record<T, string>>,
  conceptId: string,
): T | null {
  for (const [code, id] of Object.entries(map) as [T, string][]) {
    if (id === conceptId) return code;
  }
  return null;
}
