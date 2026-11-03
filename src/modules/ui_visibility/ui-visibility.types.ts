import type {
  UiElementKind,
  UiElementSource,
  UiElementStatus,
  UiRuleEffect,
  UiRuleSubjectType,
} from './ui-visibility.constants';

/**
 * Formas de respuesta del contrato (CONTRATO.md). Son copia fiel de
 * `mantra-core-health/src/app/core/data-access/ui-visibility/ui-visibility.types.ts`:
 * si cambia allí, cambia aquí en el mismo trabajo.
 */

export interface UiElementView {
  id: string;
  key: string;
  kind: UiElementKind;
  moduleCode: string;
  parentKey: string | null;
  label: string;
  description: string | null;
  defaultVisible: boolean;
  source: UiElementSource;
  status: UiElementStatus;
  activeRuleCount: number;
}

export interface UiRuleView {
  id: string;
  elementKey: string;
  effect: UiRuleEffect;
  subjectType: UiRuleSubjectType;
  subjectId: string | null;
  subjectLabel: string | null;
  validFrom: string | null;
  validTo: string | null;
  reason: string;
  version: number;
  createdAt: string;
  createdByLabel: string | null;
}

export interface UiPage<T> {
  items: T[];
  nextCursor: string | null;
  total: number | null;
}

export interface MyUiVisibilityView {
  hiddenKeys: string[];
  version: string;
  generatedAt: string;
}

export interface UiPreviewEntryView {
  elementKey: string;
  hidden: boolean;
  winningRuleId: string | null;
  reason: 'RULE' | 'DEFAULT' | 'ANCESTOR_HIDDEN';
  ancestorKey: string | null;
}

export interface UiPreviewView {
  subject: { type: 'USER' | 'ROLE'; id: string; label: string };
  entries: UiPreviewEntryView[];
}

export interface UiElementSyncResultView {
  created: number;
  updated: number;
  retired: number;
  unchanged: number;
}

/** Quién actúa y con qué alcance (lo arma el controlador desde el token y el contexto de tenant). */
export interface UiAdminActor {
  readonly userId: string;
  /** `SUPERADMIN` de plataforma: ve y toca todo. */
  readonly isPlatform: boolean;
  /** Organización activa del request; `null` si no hay (sólo un SUPERADMIN sin cabecera). */
  readonly tenantId: string | null;
}
