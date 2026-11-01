import { Injectable } from '@nestjs/common';
import {
  // Valor, no `type`: el constructor lo inyecta y Nest lee su metadata.
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/postgresql';
import { OptimisticLockError, type FilterQuery } from '@mikro-orm/core';
import { CONCEPTS } from '../../../common';
import { AuthzEffectiveRolesService } from '../../authz/services/authz-effective-roles.service';
import { DIR } from '../../directory/directory.concepts';
import { TENANT_TYPE_CODE_BY_CONCEPT_ID } from '../../directory/directory.concepts';
import { TenantMemberships, Tenants } from '../../directory/entities';
import { conceptIdsToRoleCodes } from '../../iam/domain/role-mapping';
import { UserGlobalRoles, Users } from '../../iam/entities';
import { Roles } from '../../authz/entities';
import { UiVisibilityElements, UiVisibilityRules } from '../entities';
import type { ResolverSubject } from '../resolver/ui-visibility.resolver';
import type {
  UiElementKind,
  UiElementSource,
  UiElementStatus,
  UiRuleEffect,
  UiRuleSubjectType,
} from '../ui-visibility.constants';
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
} from './ui-visibility.store';

/** Escapa `%`, `_` y `\` para un `ILIKE` literal. */
const likePattern = (q: string): string => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

const toElement = (e: UiVisibilityElements): ElementRecord => ({
  id: e.id,
  key: e.key,
  kind: e.kind as UiElementKind,
  moduleCode: e.moduleCode,
  parentElementId: e.parentElementId ?? null,
  label: e.label,
  description: e.description ?? null,
  defaultVisible: e.defaultVisible,
  source: e.source as UiElementSource,
  status: e.status as UiElementStatus,
  retiredAt: e.retiredAt ?? null,
  rowVersion: e.rowVersion,
});

const toRule = (r: UiVisibilityRules): RuleRecord => ({
  id: r.id,
  elementId: r.elementId,
  effect: r.effect as UiRuleEffect,
  subjectType: r.subjectType as UiRuleSubjectType,
  subjectId: r.subjectId ?? null,
  scopeTenantId: r.scopeTenantId ?? null,
  validFrom: r.validFrom ?? null,
  validTo: r.validTo ?? null,
  endedAt: r.endedAt ?? null,
  reason: r.reason,
  createdAt: r.createdAt,
  createdByUserId: r.createdByUserId ?? null,
  rowVersion: r.rowVersion,
});

/** Condición «en vigor ahora» (la misma que `isRuleInForce` del resolutor). */
export function inForce(now: Date): FilterQuery<UiVisibilityRules> {
  return {
    endedAt: null,
    $and: [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validTo: null }, { validTo: { $gt: now } }] },
    ],
  };
}

export function ruleWhere(filter: RuleFilter): FilterQuery<UiVisibilityRules> {
  const and: FilterQuery<UiVisibilityRules>[] = [];
  if (filter.elementId !== undefined) and.push({ elementId: filter.elementId });
  if (filter.subjectType !== undefined)
    and.push({ subjectType: filter.subjectType });
  if (filter.subjectId !== undefined) and.push({ subjectId: filter.subjectId });
  if (filter.scopeTenantId !== undefined)
    and.push({ scopeTenantId: filter.scopeTenantId });
  if (filter.active === true) and.push(inForce(filter.now));
  if (filter.active === false) and.push({ $not: inForce(filter.now) });
  return and.length === 0 ? {} : { $and: and };
}

export function elementWhere(
  filter: ElementFilter,
): FilterQuery<UiVisibilityElements> {
  const and: FilterQuery<UiVisibilityElements>[] = [];
  if (filter.moduleCode !== undefined)
    and.push({ moduleCode: filter.moduleCode });
  if (filter.kind !== undefined) and.push({ kind: filter.kind });
  if (filter.status !== undefined) and.push({ status: filter.status });
  if (filter.q) {
    const pattern = likePattern(filter.q);
    and.push({
      $or: [{ key: { $ilike: pattern } }, { label: { $ilike: pattern } }],
    });
  }
  return and.length === 0 ? {} : { $and: and };
}

/**
 * Implementación del puerto sobre MikroORM/PostgreSQL. Las lecturas fuera de transacción usan
 * un `fork()` por llamada (sin mapa de identidad compartido entre peticiones).
 *
 * NO tiene prueba contra una base real en este cambio (ver REPORTE de la entrega): la lógica
 * de negocio se prueba con el doble en memoria; esta clase es traducción a consultas.
 */
@Injectable()
export class MikroOrmUiVisibilityStore extends UiVisibilityStore {
  /** Transacción en curso: sólo la fija {@link transaction} sobre la copia que entrega a `work`. */
  private bound: EntityManager | null = null;

  constructor(
    private readonly root: EntityManager,
    private readonly effectiveRoles: AuthzEffectiveRolesService,
  ) {
    super();
  }

  private get em(): EntityManager {
    return this.bound ?? this.root.fork();
  }

  transaction<T>(work: (tx: UiVisibilityStore) => Promise<T>): Promise<T> {
    if (this.bound) return work(this);
    return this.root.transactional((tx) => {
      const scoped = new MikroOrmUiVisibilityStore(
        this.root,
        this.effectiveRoles,
      );
      scoped.bound = tx;
      return work(scoped);
    });
  }

  // ── Catálogo ───────────────────────────────────────────────────────────────
  async listElements(
    filter: ElementFilter,
    after: KeysetPosition | null,
    limit: number,
  ): Promise<ElementRecord[]> {
    const where = elementWhere(filter);
    const full: FilterQuery<UiVisibilityElements> = after
      ? {
          $and: [
            where,
            {
              $or: [
                { key: { $gt: after.c } },
                { key: after.c, id: { $gt: after.i } },
              ],
            },
          ],
        }
      : where;
    const rows = await this.em.find(UiVisibilityElements, full, {
      orderBy: { key: 'ASC', id: 'ASC' },
      limit,
    });
    return rows.map(toElement);
  }

  countElements(filter: ElementFilter): Promise<number> {
    return this.em.count(UiVisibilityElements, elementWhere(filter));
  }

  async findElementsByKeys(keys: readonly string[]): Promise<ElementRecord[]> {
    if (keys.length === 0) return [];
    const rows = await this.em.find(UiVisibilityElements, {
      key: { $in: [...keys] },
    });
    return rows.map(toElement);
  }

  async findElementsByIds(ids: readonly string[]): Promise<ElementRecord[]> {
    if (ids.length === 0) return [];
    const rows = await this.em.find(UiVisibilityElements, {
      id: { $in: [...ids] },
    });
    return rows.map(toElement);
  }

  async listAllElements(): Promise<ElementRecord[]> {
    const rows = await this.em.find(
      UiVisibilityElements,
      {},
      { orderBy: { key: 'ASC' } },
    );
    return rows.map(toElement);
  }

  async insertElement(
    data: NewElement,
    actorId: string,
  ): Promise<ElementRecord> {
    const em = this.em;
    const now = new Date();
    const row = em.create(
      UiVisibilityElements,
      {
        key: data.key,
        kind: data.kind,
        moduleCode: data.moduleCode,
        parentElementId: data.parentElementId ?? undefined,
        label: data.label,
        description: data.description ?? undefined,
        defaultVisible: data.defaultVisible,
        source: data.source,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorId,
        updatedByUserId: actorId,
      },
      { partial: true },
    );
    await em.flush();
    return toElement(row);
  }

  async updateElement(
    id: string,
    patch: ElementPatch,
    actorId: string,
  ): Promise<ElementRecord> {
    const em = this.em;
    const row = await em.findOneOrFail(UiVisibilityElements, { id });
    if (patch.kind !== undefined) row.kind = patch.kind;
    if (patch.moduleCode !== undefined) row.moduleCode = patch.moduleCode;
    if (patch.parentElementId !== undefined)
      row.parentElementId = patch.parentElementId ?? undefined;
    if (patch.label !== undefined) row.label = patch.label;
    if (patch.description !== undefined)
      row.description = patch.description ?? undefined;
    if (patch.defaultVisible !== undefined)
      row.defaultVisible = patch.defaultVisible;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.retiredAt !== undefined)
      row.retiredAt = patch.retiredAt ?? undefined;
    row.updatedAt = new Date();
    row.updatedByUserId = actorId;
    await em.flush();
    return toElement(row);
  }

  async countActiveRules(
    elementIds: readonly string[],
    now: Date,
  ): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (elementIds.length === 0) return out;
    const rows = await this.em.find(
      UiVisibilityRules,
      { $and: [{ elementId: { $in: [...elementIds] } }, inForce(now)] },
      { fields: ['elementId'] },
    );
    for (const r of rows) out.set(r.elementId, (out.get(r.elementId) ?? 0) + 1);
    return out;
  }

  // ── Reglas ─────────────────────────────────────────────────────────────────
  async findRule(id: string): Promise<RuleRecord | null> {
    const row = await this.em.findOne(UiVisibilityRules, { id });
    return row ? toRule(row) : null;
  }

  async listRules(
    filter: RuleFilter,
    after: KeysetPosition | null,
    limit: number,
  ): Promise<RuleRecord[]> {
    const where = ruleWhere(filter);
    const full: FilterQuery<UiVisibilityRules> = after
      ? {
          $and: [
            where,
            {
              $or: [
                { createdAt: { $lt: new Date(after.c) } },
                { createdAt: new Date(after.c), id: { $lt: after.i } },
              ],
            },
          ],
        }
      : where;
    const rows = await this.em.find(UiVisibilityRules, full, {
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit,
    });
    return rows.map(toRule);
  }

  countRules(filter: RuleFilter): Promise<number> {
    return this.em.count(UiVisibilityRules, ruleWhere(filter));
  }

  async findOpenRule(
    elementId: string,
    subjectType: UiRuleSubjectType,
    subjectId: string | null,
  ): Promise<RuleRecord | null> {
    const row = await this.em.findOne(UiVisibilityRules, {
      elementId,
      subjectType,
      subjectId,
      endedAt: null,
    });
    return row ? toRule(row) : null;
  }

  async insertRule(data: NewRule, actorId: string): Promise<RuleRecord> {
    const em = this.em;
    const now = new Date();
    const row = em.create(
      UiVisibilityRules,
      {
        elementId: data.elementId,
        effect: data.effect,
        subjectType: data.subjectType,
        subjectId: data.subjectId ?? undefined,
        scopeTenantId: data.scopeTenantId ?? undefined,
        validFrom: data.validFrom ?? undefined,
        validTo: data.validTo ?? undefined,
        reason: data.reason,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorId,
        updatedByUserId: actorId,
      },
      { partial: true },
    );
    try {
      await em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException)
        throw new UiRuleDuplicateError();
      throw error;
    }
    return toRule(row);
  }

  async updateRule(
    id: string,
    expectedVersion: number,
    patch: RulePatch,
    actorId: string,
  ): Promise<RuleRecord> {
    const em = this.em;
    const row = await em.findOneOrFail(UiVisibilityRules, { id });
    if (row.rowVersion !== expectedVersion) throw new UiStaleRecordError();
    if (patch.effect !== undefined) row.effect = patch.effect;
    if (patch.validFrom !== undefined)
      row.validFrom = patch.validFrom ?? undefined;
    if (patch.validTo !== undefined) row.validTo = patch.validTo ?? undefined;
    if (patch.endedAt !== undefined) row.endedAt = patch.endedAt ?? undefined;
    if (patch.reason !== undefined) row.reason = patch.reason;
    row.updatedAt = new Date();
    row.updatedByUserId = actorId;
    try {
      await em.flush();
    } catch (error) {
      if (error instanceof OptimisticLockError) throw new UiStaleRecordError();
      throw error;
    }
    return toRule(row);
  }

  async listOpenRulesForSubject(
    subject: ResolverSubject,
  ): Promise<RuleRecord[]> {
    const applies: FilterQuery<UiVisibilityRules>[] = [{ subjectType: 'ALL' }];
    if (subject.userId)
      applies.push({ subjectType: 'USER', subjectId: subject.userId });
    if (subject.tenantId)
      applies.push({ subjectType: 'TENANT', subjectId: subject.tenantId });
    if (subject.roles.length > 0)
      applies.push({
        subjectType: 'ROLE',
        subjectId: { $in: [...subject.roles] },
      });
    if (subject.orgType)
      applies.push({ subjectType: 'ORG_TYPE', subjectId: subject.orgType });
    const and: FilterQuery<UiVisibilityRules>[] = [
      { endedAt: null },
      { $or: applies },
    ];
    and.push(
      subject.tenantId
        ? {
            $or: [{ scopeTenantId: null }, { scopeTenantId: subject.tenantId }],
          }
        : { scopeTenantId: null },
    );
    const rows = await this.em.find(UiVisibilityRules, { $and: and });
    return rows.map(toRule);
  }

  // ── Búsquedas de apoyo ─────────────────────────────────────────────────────
  async userLabels(ids: readonly string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.em.find(
      Users,
      { id: { $in: [...ids] } },
      { fields: ['id', 'displayName'] },
    );
    return new Map(rows.map((u) => [u.id, u.displayName]));
  }

  async tenantLabels(ids: readonly string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();
    const rows = await this.em.find(Tenants, { id: { $in: [...ids] } });
    return new Map(
      rows.map((t) => [t.id, t.tradeName || t.legalName || t.code]),
    );
  }

  async roleNames(codes: readonly string[]): Promise<Map<string, string>> {
    if (codes.length === 0) return new Map();
    const rows = await this.em.find(Roles, {
      code: { $in: [...codes] },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const out = new Map<string, string>();
    for (const r of rows) if (!out.has(r.code)) out.set(r.code, r.name);
    return out;
  }

  async userInTenant(userId: string, tenantId: string): Promise<boolean> {
    const count = await this.em.count(TenantMemberships, {
      userId,
      tenantId,
      statusConceptId: {
        $in: [DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE],
      },
    });
    return count > 0;
  }

  async orgTypeOfTenant(tenantId: string): Promise<string | null> {
    const tenant = await this.em.findOne(Tenants, { id: tenantId });
    if (!tenant) return null;
    return TENANT_TYPE_CODE_BY_CONCEPT_ID[tenant.tenantTypeConceptId] ?? null;
  }

  /** Mismo cálculo que el login (`IamAuthService.mergeRoleCodes`): globales + de negocio, con su ámbito. */
  async effectiveRoleCodes(
    userId: string,
    tenantId: string | null,
    now: Date,
  ): Promise<string[]> {
    const em = this.em;
    const globals = await em.find(UserGlobalRoles, {
      userId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const global = conceptIdsToRoleCodes(globals.map((g) => g.roleConceptId));
    const assignments = await this.effectiveRoles.scopedAssignmentsForUser(
      em,
      userId,
      now,
    );
    const business = assignments
      .filter((a) => a.tenantId === undefined || a.tenantId === tenantId)
      .map((a) => a.code);
    return [...new Set([...global, ...business])].sort();
  }
}
