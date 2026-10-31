import type {
  UiElementKind,
  UiElementSource,
  UiElementStatus,
  UiRuleEffect,
  UiRuleSubjectType,
} from '../ui-visibility.constants';
import type { ResolverSubject } from '../resolver/ui-visibility.resolver';

/**
 * Puerto de persistencia del módulo `ui_visibility`. El servicio habla con este contrato y
 * no con el ORM: la implementación real es `MikroOrmUiVisibilityStore`; las pruebas de
 * servicio usan un doble en memoria (declarado como tal, ver `testing/in-memory-store.ts`).
 */

export interface ElementRecord {
  id: string;
  key: string;
  kind: UiElementKind;
  moduleCode: string;
  parentElementId: string | null;
  label: string;
  description: string | null;
  defaultVisible: boolean;
  source: UiElementSource;
  status: UiElementStatus;
  retiredAt: Date | null;
  rowVersion: number;
}

export interface NewElement {
  key: string;
  kind: UiElementKind;
  moduleCode: string;
  parentElementId: string | null;
  label: string;
  description: string | null;
  defaultVisible: boolean;
  source: UiElementSource;
}

export interface ElementPatch {
  kind?: UiElementKind;
  moduleCode?: string;
  parentElementId?: string | null;
  label?: string;
  description?: string | null;
  defaultVisible?: boolean;
  status?: UiElementStatus;
  retiredAt?: Date | null;
}

export interface ElementFilter {
  moduleCode?: string;
  kind?: UiElementKind;
  q?: string;
  status?: UiElementStatus;
}

export interface RuleRecord {
  id: string;
  elementId: string;
  effect: UiRuleEffect;
  subjectType: UiRuleSubjectType;
  subjectId: string | null;
  scopeTenantId: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  endedAt: Date | null;
  reason: string;
  createdAt: Date;
  createdByUserId: string | null;
  rowVersion: number;
}

export interface NewRule {
  elementId: string;
  effect: UiRuleEffect;
  subjectType: UiRuleSubjectType;
  subjectId: string | null;
  scopeTenantId: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  reason: string;
}

export interface RulePatch {
  effect?: UiRuleEffect;
  validFrom?: Date | null;
  validTo?: Date | null;
  endedAt?: Date | null;
  reason?: string;
}

export interface RuleFilter {
  elementId?: string;
  subjectType?: UiRuleSubjectType;
  subjectId?: string;
  /** true: en vigor ahora; false: terminada, vencida o futura. */
  active?: boolean;
  now: Date;
  /** Si viene, sólo reglas cuyo `scope_tenant_id` es esa organización. */
  scopeTenantId?: string;
}

/** Cursor keyset: `c` es la clave de orden de la última fila; `i`, su id. */
export interface KeysetPosition {
  c: string;
  i: string;
}

/** La terna elemento + sujeto ya tiene una regla sin terminar (índice único parcial). */
export class UiRuleDuplicateError extends Error {
  constructor() {
    super('ui_rule_duplicate');
    this.name = 'UiRuleDuplicateError';
  }
}

/** La fila cambió desde la versión que el cliente leyó. */
export class UiStaleRecordError extends Error {
  constructor() {
    super('ui_stale_record');
    this.name = 'UiStaleRecordError';
  }
}

export abstract class UiVisibilityStore {
  /** Ejecuta `work` en una transacción; dentro, el almacén recibido escribe y lee de ella. */
  abstract transaction<T>(
    work: (tx: UiVisibilityStore) => Promise<T>,
  ): Promise<T>;

  // ── Catálogo ───────────────────────────────────────────────────────────────
  /** Una fila de más que `limit` para saber si hay página siguiente. Orden: `key`, `id`. */
  abstract listElements(
    filter: ElementFilter,
    after: KeysetPosition | null,
    limit: number,
  ): Promise<ElementRecord[]>;
  abstract countElements(filter: ElementFilter): Promise<number>;
  abstract findElementsByKeys(
    keys: readonly string[],
  ): Promise<ElementRecord[]>;
  abstract findElementsByIds(ids: readonly string[]): Promise<ElementRecord[]>;
  abstract listAllElements(): Promise<ElementRecord[]>;
  abstract insertElement(
    data: NewElement,
    actorId: string,
  ): Promise<ElementRecord>;
  abstract updateElement(
    id: string,
    patch: ElementPatch,
    actorId: string,
  ): Promise<ElementRecord>;
  /** Reglas en vigor ahora, por elemento (informativo para el catálogo). */
  abstract countActiveRules(
    elementIds: readonly string[],
    now: Date,
  ): Promise<Map<string, number>>;

  // ── Reglas ─────────────────────────────────────────────────────────────────
  abstract findRule(id: string): Promise<RuleRecord | null>;
  /** Una fila de más que `limit`. Orden: `createdAt` desc, `id` desc. */
  abstract listRules(
    filter: RuleFilter,
    after: KeysetPosition | null,
    limit: number,
  ): Promise<RuleRecord[]>;
  abstract countRules(filter: RuleFilter): Promise<number>;
  abstract findOpenRule(
    elementId: string,
    subjectType: UiRuleSubjectType,
    subjectId: string | null,
  ): Promise<RuleRecord | null>;
  /** @throws UiRuleDuplicateError si la terna ya tiene una regla sin terminar. */
  abstract insertRule(data: NewRule, actorId: string): Promise<RuleRecord>;
  /** @throws UiStaleRecordError si `expectedVersion` no es la vigente. */
  abstract updateRule(
    id: string,
    expectedVersion: number,
    patch: RulePatch,
    actorId: string,
  ): Promise<RuleRecord>;
  /**
   * Reglas sin terminar que PODRÍAN aplicar al sujeto (su usuario, su organización, sus roles,
   * su tipo de organización o ALL). La vigencia y la precedencia las decide el resolutor.
   * Se excluyen las reglas acotadas a una organización distinta de `subject.tenantId`.
   */
  abstract listOpenRulesForSubject(
    subject: ResolverSubject,
  ): Promise<RuleRecord[]>;

  // ── Búsquedas de apoyo ─────────────────────────────────────────────────────
  abstract userLabels(ids: readonly string[]): Promise<Map<string, string>>;
  abstract tenantLabels(ids: readonly string[]): Promise<Map<string, string>>;
  /** Código de rol → nombre. */
  abstract roleNames(codes: readonly string[]): Promise<Map<string, string>>;
  abstract userInTenant(userId: string, tenantId: string): Promise<boolean>;
  /** Código del tipo de la organización; `null` si no existe. */
  abstract orgTypeOfTenant(tenantId: string): Promise<string | null>;
  /** Roles que el usuario ejerce (globales + de negocio vigentes) en esa organización. */
  abstract effectiveRoleCodes(
    userId: string,
    tenantId: string | null,
    now: Date,
  ): Promise<string[]>;
}
