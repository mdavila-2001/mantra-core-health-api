import { randomUUID } from 'node:crypto';
import { isRuleInForce } from '../resolver/ui-visibility.resolver';
import {
  UiRuleDuplicateError,
  UiStaleRecordError,
  UiVisibilityStore,
  type ElementFilter,
  type ElementPatch,
  type ElementRecord,
  type KeysetPosition,
  type NewElement,
  type NewRule,
  type RuleFilter,
  type RulePatch,
  type RuleRecord,
} from '../repositories/ui-visibility.store';
import type { ResolverSubject } from '../resolver/ui-visibility.resolver';
import type { UiRuleSubjectType } from '../ui-visibility.constants';

/** Como la implementación real: una clave `undefined` del parche significa «no tocar»; `null`, «limpiar». */
const defined = <T extends object>(patch: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<T>;

/**
 * DOBLE DE PRUEBA del puerto `UiVisibilityStore` (regla 65: declarado como doble, nunca presentado
 * como la base real). Reproduce las invariantes que la base impone con índices y CHECK:
 *  - unicidad de `key`;
 *  - unicidad de la terna elemento + sujeto entre las reglas NO terminadas (`UiRuleDuplicateError`);
 *  - bloqueo optimista por `rowVersion` (`UiStaleRecordError`);
 *  - atomicidad de `transaction` (copia de trabajo; si `work` lanza, nada se aplica).
 * Lo que NO reproduce es SQL: cualquier error de consulta de la implementación real queda sin ver.
 */
export class InMemoryUiVisibilityStore extends UiVisibilityStore {
  elements = new Map<string, ElementRecord>();
  rules = new Map<string, RuleRecord>();
  users = new Map<string, string>();
  tenants = new Map<string, { name: string; orgType: string | null }>();
  memberships = new Set<string>();
  roleCatalog = new Map<string, string>();
  userRoles = new Map<string, { code: string; tenantId?: string }[]>();
  authors = new Map<string, string>();
  /** Contador de escrituras, para demostrar que una repetición idempotente no escribe. */
  writes = 0;

  private clock: () => Date = () => new Date();
  setClock(clock: () => Date): void {
    this.clock = clock;
  }

  async transaction<T>(
    work: (tx: UiVisibilityStore) => Promise<T>,
  ): Promise<T> {
    const snapshot = {
      elements: new Map([...this.elements].map(([k, v]) => [k, { ...v }])),
      rules: new Map([...this.rules].map(([k, v]) => [k, { ...v }])),
      writes: this.writes,
    };
    try {
      return await work(this);
    } catch (error) {
      this.elements = snapshot.elements;
      this.rules = snapshot.rules;
      this.writes = snapshot.writes;
      throw error;
    }
  }

  // ── Catálogo ───────────────────────────────────────────────────────────────
  private filteredElements(filter: ElementFilter): ElementRecord[] {
    const q = filter.q?.toLowerCase();
    return [...this.elements.values()]
      .filter(
        (e) =>
          filter.moduleCode === undefined || e.moduleCode === filter.moduleCode,
      )
      .filter((e) => filter.kind === undefined || e.kind === filter.kind)
      .filter((e) => filter.status === undefined || e.status === filter.status)
      .filter(
        (e) =>
          !q ||
          e.key.toLowerCase().includes(q) ||
          e.label.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        a.key < b.key ? -1 : a.key > b.key ? 1 : a.id < b.id ? -1 : 1,
      );
  }

  async listElements(
    filter: ElementFilter,
    after: KeysetPosition | null,
    limit: number,
  ) {
    return this.filteredElements(filter)
      .filter(
        (e) =>
          !after || e.key > after.c || (e.key === after.c && e.id > after.i),
      )
      .slice(0, limit);
  }

  async countElements(filter: ElementFilter) {
    return this.filteredElements(filter).length;
  }

  async findElementsByKeys(keys: readonly string[]) {
    return [...this.elements.values()].filter((e) => keys.includes(e.key));
  }

  async findElementsByIds(ids: readonly string[]) {
    return [...this.elements.values()].filter((e) => ids.includes(e.id));
  }

  async listAllElements() {
    return [...this.elements.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  }

  async insertElement(
    data: NewElement,
    _actorId?: string,
  ): Promise<ElementRecord> {
    if ([...this.elements.values()].some((e) => e.key === data.key))
      throw new Error(
        'duplicate key value violates unique constraint "uq_ui_visibility_elements_key"',
      );
    const row: ElementRecord = {
      id: randomUUID(),
      ...data,
      status: 'ACTIVE',
      retiredAt: null,
      rowVersion: 1,
    };
    this.elements.set(row.id, row);
    this.writes += 1;
    return { ...row };
  }

  async updateElement(
    id: string,
    patch: ElementPatch,
    _actorId?: string,
  ): Promise<ElementRecord> {
    const row = this.elements.get(id);
    if (!row) throw new Error('element not found');
    Object.assign(row, defined(patch), { rowVersion: row.rowVersion + 1 });
    this.writes += 1;
    return { ...row };
  }

  async countActiveRules(elementIds: readonly string[], now: Date) {
    const out = new Map<string, number>();
    for (const r of this.rules.values()) {
      if (elementIds.includes(r.elementId) && isRuleInForce(r, now))
        out.set(r.elementId, (out.get(r.elementId) ?? 0) + 1);
    }
    return out;
  }

  // ── Reglas ─────────────────────────────────────────────────────────────────
  async findRule(id: string) {
    const r = this.rules.get(id);
    return r ? { ...r } : null;
  }

  private filteredRules(filter: RuleFilter): RuleRecord[] {
    return [...this.rules.values()]
      .filter(
        (r) =>
          filter.elementId === undefined || r.elementId === filter.elementId,
      )
      .filter(
        (r) =>
          filter.subjectType === undefined ||
          r.subjectType === filter.subjectType,
      )
      .filter(
        (r) =>
          filter.subjectId === undefined || r.subjectId === filter.subjectId,
      )
      .filter(
        (r) =>
          filter.scopeTenantId === undefined ||
          r.scopeTenantId === filter.scopeTenantId,
      )
      .filter(
        (r) =>
          filter.active === undefined ||
          isRuleInForce(r, filter.now) === filter.active,
      )
      .sort((a, b) =>
        a.createdAt.getTime() !== b.createdAt.getTime()
          ? b.createdAt.getTime() - a.createdAt.getTime()
          : a.id < b.id
            ? 1
            : -1,
      );
  }

  async listRules(
    filter: RuleFilter,
    after: KeysetPosition | null,
    limit: number,
  ) {
    return this.filteredRules(filter)
      .filter((r) => {
        if (!after) return true;
        const c = new Date(after.c).getTime();
        return (
          r.createdAt.getTime() < c ||
          (r.createdAt.getTime() === c && r.id < after.i)
        );
      })
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async countRules(filter: RuleFilter) {
    return this.filteredRules(filter).length;
  }

  async findOpenRule(
    elementId: string,
    subjectType: UiRuleSubjectType,
    subjectId: string | null,
  ) {
    const r = [...this.rules.values()].find(
      (x) =>
        x.elementId === elementId &&
        x.subjectType === subjectType &&
        x.subjectId === subjectId &&
        x.endedAt === null,
    );
    return r ? { ...r } : null;
  }

  async insertRule(data: NewRule, actorId: string): Promise<RuleRecord> {
    const open = [...this.rules.values()].some(
      (x) =>
        x.elementId === data.elementId &&
        x.subjectType === data.subjectType &&
        x.subjectId === data.subjectId &&
        x.endedAt === null,
    );
    if (open) throw new UiRuleDuplicateError();
    const row: RuleRecord = {
      id: randomUUID(),
      ...data,
      endedAt: null,
      createdAt: this.clock(),
      createdByUserId: actorId,
      rowVersion: 1,
    };
    this.rules.set(row.id, row);
    this.writes += 1;
    return { ...row };
  }

  async updateRule(
    id: string,
    expectedVersion: number,
    patch: RulePatch,
    _actorId?: string,
  ): Promise<RuleRecord> {
    const row = this.rules.get(id);
    if (!row) throw new Error('rule not found');
    if (row.rowVersion !== expectedVersion) throw new UiStaleRecordError();
    Object.assign(row, defined(patch), { rowVersion: row.rowVersion + 1 });
    this.writes += 1;
    return { ...row };
  }

  async listOpenRulesForSubject(subject: ResolverSubject) {
    return [...this.rules.values()]
      .filter((r) => r.endedAt === null)
      .filter(
        (r) => r.scopeTenantId === null || r.scopeTenantId === subject.tenantId,
      )
      .map((r) => ({ ...r }));
  }

  // ── Apoyo ──────────────────────────────────────────────────────────────────
  async userLabels(ids: readonly string[]) {
    const all = new Map([...this.users, ...this.authors]);
    return new Map(
      ids.filter((i) => all.has(i)).map((i) => [i, all.get(i) as string]),
    );
  }

  async tenantLabels(ids: readonly string[]) {
    return new Map(
      ids
        .filter((i) => this.tenants.has(i))
        .map((i) => [i, this.tenants.get(i)!.name]),
    );
  }

  async roleNames(codes: readonly string[]) {
    return new Map(
      codes
        .filter((c) => this.roleCatalog.has(c))
        .map((c) => [c, this.roleCatalog.get(c) as string]),
    );
  }

  async userInTenant(userId: string, tenantId: string) {
    return this.memberships.has(`${userId}|${tenantId}`);
  }

  async orgTypeOfTenant(tenantId: string) {
    return this.tenants.get(tenantId)?.orgType ?? null;
  }

  async effectiveRoleCodes(userId: string, tenantId: string | null) {
    const rows = this.userRoles.get(userId) ?? [];
    return [
      ...new Set(
        rows
          .filter((r) => r.tenantId === undefined || r.tenantId === tenantId)
          .map((r) => r.code),
      ),
    ].sort();
  }
}
