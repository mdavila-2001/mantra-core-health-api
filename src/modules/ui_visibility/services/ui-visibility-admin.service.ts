import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import { ROLE_CONCEPT_BY_CODE } from '../../iam/domain/role-mapping';
import type {
  CreateElementDto,
  CreateRuleDto,
  ElementsQueryDto,
  PreviewQueryDto,
  RulesQueryDto,
  SyncElementsDto,
  UiElementDraftDto,
  UpdateRuleDto,
} from '../dto/ui-visibility.dto';
import {
  elementNotFound,
  elementRetired,
  emptyUpdate,
  hierarchyCycle,
  invalidSubject,
  invalidValidity,
  keyExists,
  parentNotFound,
  protectedElement,
  previewSubjectNotFound,
  previewSubjectRequired,
  readDateKeyset,
  readKeyset,
  ruleDuplicate,
  ruleEnded,
  ruleNotFound,
  ruleVersionMismatch,
  syncInvalid,
  tenantScopeRequired,
} from '../ui-visibility.errors';
import {
  hiddenKeysOf,
  type ResolverSubject,
} from '../resolver/ui-visibility.resolver';
import { resolveForSubject } from './ui-visibility-resolution';
import {
  UiRuleDuplicateError,
  UiStaleRecordError,
  UiVisibilityStore,
  type ElementFilter,
  type ElementRecord,
  type RuleFilter,
  type RuleRecord,
} from '../repositories/ui-visibility.store';
import {
  UI_DEFAULT_PAGE_SIZE,
  UI_MAX_PAGE_SIZE,
  UI_ORG_TYPE_CODES,
  UI_PROTECTED_ROLES,
  isProtectedElementKey,
  type UiRuleSubjectType,
} from '../ui-visibility.constants';
import type {
  UiAdminActor,
  UiElementSyncResultView,
  UiElementView,
  UiPage,
  UiPreviewView,
  UiRuleView,
} from '../ui-visibility.types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GLOBAL_ROLE_CODES: ReadonlySet<string> = new Set(
  Object.keys(ROLE_CONCEPT_BY_CODE),
);

const clamp = (limit: number | undefined): number =>
  Math.min(Math.max(limit ?? UI_DEFAULT_PAGE_SIZE, 1), UI_MAX_PAGE_SIZE);

const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);
const parseDate = (v: string | null | undefined): Date | null =>
  v === undefined || v === null ? null : new Date(v);

/**
 * Administración del catálogo y de las reglas de visibilidad (CONTRATO.md).
 *
 * LA VISIBILIDAD NO ES AUTORIZACIÓN: nada de lo que se escribe acá concede acceso; sólo decide
 * qué se presenta. Alcance:
 *  - `SUPERADMIN` (plataforma) ve y toca todo.
 *  - Un administrador de organización (`SECURITY_ADMIN`) sólo ve y toca las reglas acotadas a SU
 *    organización (`scope_tenant_id`), y sólo puede crearlas sobre su organización (TENANT) o
 *    sobre usuarios miembros de ella (USER). Una regla ajena responde el mismo 404 que una
 *    inexistente; un sujeto fuera de su alcance, el mismo 422 que uno inexistente.
 *  - El catálogo es de plataforma y lo ven todos los administradores.
 */
@Injectable()
export class UiVisibilityAdminService {
  constructor(
    private readonly store: UiVisibilityStore,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UiVisibilityAdminService.name);
  }

  // ═══ Catálogo ══════════════════════════════════════════════════════════════
  async listElements(q: ElementsQueryDto): Promise<UiPage<UiElementView>> {
    const limit = clamp(q.limit);
    const filter: ElementFilter = {
      moduleCode: q.module,
      kind: q.kind,
      q: q.q || undefined,
      status: q.status,
    };
    const after = readKeyset(q.cursor);
    const now = new Date();
    const [rows, total] = await Promise.all([
      this.store.listElements(filter, after, limit + 1),
      this.store.countElements(filter),
    ]);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    const views = await this.toElementViews(page, now);
    return {
      items: views,
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ c: last.key, i: last.id })
          : null,
      total,
    };
  }

  /** Alta manual (source ADMIN). */
  async createElement(
    dto: CreateElementDto,
    actor: UiAdminActor,
  ): Promise<UiElementView> {
    const view = await this.store.transaction(async (tx) => {
      const [existing] = await tx.findElementsByKeys([dto.key]);
      if (existing) throw keyExists();
      let parentId: string | null = null;
      if (dto.parentKey) {
        const [parent] = await tx.findElementsByKeys([dto.parentKey]);
        if (!parent) throw parentNotFound();
        if (parent.status === 'RETIRED') throw elementRetired();
        parentId = parent.id;
      }
      const row = await tx.insertElement(
        {
          key: dto.key,
          kind: dto.kind,
          moduleCode: dto.moduleCode,
          parentElementId: parentId,
          label: dto.label,
          description: dto.description ?? null,
          defaultVisible: dto.defaultVisible ?? true,
          source: 'ADMIN',
        },
        actor.userId,
      );
      return (await this.toElementViews([row], new Date()))[0];
    });
    this.logger.info(
      {
        operation: 'ui-visibility.element.create',
        elementKey: view.key,
        actorId: actor.userId,
      },
      'UI element created',
    );
    return view;
  }

  /**
   * Sincroniza el registro del front. Idempotente por `key`: repetir el mismo lote no cambia
   * nada. Los CODE activos que el lote ya no trae pasan a RETIRED (no se borran; sus reglas se
   * conservan). Un lote vacío se rechaza: retiraría todo el catálogo por un registro roto.
   */
  async syncElements(
    dto: SyncElementsDto,
    actor: UiAdminActor,
  ): Promise<UiElementSyncResultView> {
    const drafts = this.dedupeDrafts(dto.elements);
    const result = await this.store.transaction((tx) =>
      this.applySync(tx, drafts, actor.userId),
    );
    this.logger.info(
      {
        operation: 'ui-visibility.element.sync',
        actorId: actor.userId,
        ...result,
      },
      'UI elements synced',
    );
    return result;
  }

  private dedupeDrafts(
    list: readonly UiElementDraftDto[],
  ): UiElementDraftDto[] {
    if (list.length === 0)
      throw syncInvalid(
        'El lote está vacío: sincronizarlo retiraría todo el catálogo',
      );
    const byKey = new Map<string, UiElementDraftDto>();
    for (const d of list) {
      const norm = {
        ...d,
        parentKey: d.parentKey ?? null,
        description: d.description ?? null,
      };
      const prev = byKey.get(norm.key);
      if (
        prev &&
        JSON.stringify(sortedDraft(prev)) !== JSON.stringify(sortedDraft(norm))
      )
        throw syncInvalid('El lote repite una clave con contenido distinto');
      byKey.set(norm.key, norm);
    }
    return [...byKey.values()];
  }

  private async applySync(
    tx: UiVisibilityStore,
    drafts: readonly UiElementDraftDto[],
    actorId: string,
  ): Promise<UiElementSyncResultView> {
    const all = await tx.listAllElements();
    const existingByKey = new Map(all.map((e) => [e.key, e]));
    const batchKeys = new Set(drafts.map((d) => d.key));

    // Un padre debe estar en el lote o ser un elemento ADMIN activo (el sync no lo toca).
    for (const d of drafts) {
      if (d.parentKey === null) continue;
      const adminParent = existingByKey.get(d.parentKey);
      const ok =
        batchKeys.has(d.parentKey) ||
        (adminParent?.source === 'ADMIN' && adminParent.status === 'ACTIVE');
      if (!ok) throw parentNotFound();
    }
    const ordered = topologicalOrder(drafts);

    const idByKey = new Map<string, string>(
      all.filter((e) => e.source === 'ADMIN').map((e) => [e.key, e.id]),
    );
    const result: UiElementSyncResultView = {
      created: 0,
      updated: 0,
      retired: 0,
      unchanged: 0,
    };

    for (const d of ordered) {
      const parentId =
        d.parentKey === null ? null : (idByKey.get(d.parentKey) ?? null);
      const current = existingByKey.get(d.key);
      if (!current) {
        const row = await tx.insertElement(
          {
            key: d.key,
            kind: d.kind,
            moduleCode: d.moduleCode,
            parentElementId: parentId,
            label: d.label,
            description: d.description,
            defaultVisible: d.defaultVisible,
            source: 'CODE',
          },
          actorId,
        );
        idByKey.set(d.key, row.id);
        result.created += 1;
        continue;
      }
      if (current.source === 'ADMIN') throw keyExists();
      idByKey.set(d.key, current.id);
      const same =
        current.status === 'ACTIVE' &&
        current.kind === d.kind &&
        current.moduleCode === d.moduleCode &&
        current.parentElementId === parentId &&
        current.label === d.label &&
        current.description === d.description &&
        current.defaultVisible === d.defaultVisible;
      if (same) {
        result.unchanged += 1;
        continue;
      }
      await tx.updateElement(
        current.id,
        {
          kind: d.kind,
          moduleCode: d.moduleCode,
          parentElementId: parentId,
          label: d.label,
          description: d.description,
          defaultVisible: d.defaultVisible,
          status: 'ACTIVE',
          retiredAt: null,
        },
        actorId,
      );
      result.updated += 1;
    }

    const now = new Date();
    for (const e of all) {
      if (e.source !== 'CODE' || e.status !== 'ACTIVE' || batchKeys.has(e.key))
        continue;
      await tx.updateElement(
        e.id,
        { status: 'RETIRED', retiredAt: now },
        actorId,
      );
      result.retired += 1;
    }
    return result;
  }

  // ═══ Reglas ════════════════════════════════════════════════════════════════
  async listRules(
    q: RulesQueryDto,
    actor: UiAdminActor,
  ): Promise<UiPage<UiRuleView>> {
    this.requireScope(actor);
    const limit = clamp(q.limit);
    const now = new Date();
    const filter: RuleFilter = {
      subjectType: q.subjectType,
      subjectId: q.subjectId,
      active: q.active,
      now,
      scopeTenantId: actor.isPlatform
        ? undefined
        : (actor.tenantId ?? undefined),
    };
    if (q.elementKey !== undefined) {
      const [element] = await this.store.findElementsByKeys([q.elementKey]);
      if (!element) throw elementNotFound();
      filter.elementId = element.id;
    }
    const after = readDateKeyset(q.cursor);
    const [rows, total] = await Promise.all([
      this.store.listRules(filter, after, limit + 1),
      this.store.countRules(filter),
    ]);
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return {
      items: await this.toRuleViews(page),
      nextCursor:
        rows.length > limit && last
          ? encodeKeysetCursor({ c: last.createdAt.toISOString(), i: last.id })
          : null,
      total,
    };
  }

  async createRule(
    dto: CreateRuleDto,
    actor: UiAdminActor,
  ): Promise<UiRuleView> {
    this.requireScope(actor);
    const now = new Date();
    const validFrom = parseDate(dto.validFrom);
    const validTo = parseDate(dto.validTo);
    this.assertValidity(validFrom, validTo, now);
    const subjectId = dto.subjectId ?? null;

    try {
      const view = await this.store.transaction(async (tx) => {
        const [element] = await tx.findElementsByKeys([dto.elementKey]);
        if (!element) throw elementNotFound();
        if (element.status === 'RETIRED') throw elementRetired();
        await this.assertSubject(tx, dto.subjectType, subjectId, actor);
        if (dto.effect === 'HIDE' && isProtectedElementKey(element.key))
          await this.assertNotAdminSubject(
            tx,
            dto.subjectType,
            subjectId,
            actor,
          );
        if (await tx.findOpenRule(element.id, dto.subjectType, subjectId))
          throw ruleDuplicate();
        const row = await tx.insertRule(
          {
            elementId: element.id,
            effect: dto.effect,
            subjectType: dto.subjectType,
            subjectId,
            scopeTenantId: actor.isPlatform ? null : actor.tenantId,
            validFrom,
            validTo,
            reason: dto.reason,
          },
          actor.userId,
        );
        return (
          await this.toRuleViews([row], new Map([[element.id, element.key]]))
        )[0];
      });
      this.logger.info(
        {
          operation: 'ui-visibility.rule.create',
          ruleId: view.id,
          elementKey: view.elementKey,
          actorId: actor.userId,
        },
        'UI rule created',
      );
      return view;
    } catch (error) {
      if (error instanceof UiRuleDuplicateError) throw ruleDuplicate();
      throw error;
    }
  }

  async updateRule(
    id: string,
    expectedVersion: number,
    dto: UpdateRuleDto,
    actor: UiAdminActor,
  ): Promise<UiRuleView> {
    this.requireScope(actor);
    try {
      const view = await this.store.transaction(async (tx) => {
        const rule = await this.loadInScope(tx, id, actor);
        if (rule.endedAt !== null) throw ruleEnded();
        if (rule.rowVersion !== expectedVersion)
          throw ruleVersionMismatch(expectedVersion, rule.rowVersion);
        if (
          dto.effect === undefined &&
          dto.validFrom === undefined &&
          dto.validTo === undefined &&
          dto.reason === undefined
        )
          throw emptyUpdate();

        const resultingEffect = dto.effect ?? rule.effect;
        if (resultingEffect === 'HIDE') {
          const [element] = await tx.findElementsByIds([rule.elementId]);
          if (element && isProtectedElementKey(element.key))
            await this.assertNotAdminSubject(
              tx,
              rule.subjectType,
              rule.subjectId,
              actor,
            );
        }

        const validFrom =
          dto.validFrom === undefined
            ? rule.validFrom
            : parseDate(dto.validFrom);
        const validTo =
          dto.validTo === undefined ? rule.validTo : parseDate(dto.validTo);
        const now = new Date();
        // Sólo se revalida la vigencia si el cliente la toca: una regla antigua con una ventana
        // que ya caducó puede seguir editando su motivo sin que se le exija reabrirla.
        if (dto.validFrom !== undefined || dto.validTo !== undefined)
          this.assertValidity(validFrom, validTo, now);

        const changes = {
          effect:
            dto.effect !== undefined && dto.effect !== rule.effect
              ? dto.effect
              : undefined,
          validFrom: sameDate(validFrom, rule.validFrom)
            ? undefined
            : validFrom,
          validTo: sameDate(validTo, rule.validTo) ? undefined : validTo,
          reason:
            dto.reason !== undefined && dto.reason !== rule.reason
              ? dto.reason
              : undefined,
        };
        const noop = Object.values(changes).every((v) => v === undefined);
        const row = noop
          ? rule
          : await tx.updateRule(id, expectedVersion, changes, actor.userId);
        return (await this.toRuleViews([row]))[0];
      });
      this.logger.info(
        {
          operation: 'ui-visibility.rule.update',
          ruleId: id,
          actorId: actor.userId,
        },
        'UI rule updated',
      );
      return view;
    } catch (error) {
      if (error instanceof UiStaleRecordError)
        throw ruleVersionMismatch(expectedVersion);
      throw error;
    }
  }

  /** Termina la regla (`validTo` = ahora). Idempotente: terminar una terminada devuelve la misma. */
  async endRule(id: string, actor: UiAdminActor): Promise<UiRuleView> {
    this.requireScope(actor);
    const view = await this.store.transaction(async (tx) => {
      const rule = await this.loadInScope(tx, id, actor);
      if (rule.endedAt !== null) return (await this.toRuleViews([rule]))[0];
      const now = new Date();
      const keepsValidTo =
        rule.validTo !== null && rule.validTo.getTime() <= now.getTime();
      const row = await tx
        .updateRule(
          id,
          rule.rowVersion,
          { endedAt: now, ...(keepsValidTo ? {} : { validTo: now }) },
          actor.userId,
        )
        .catch((error: unknown) => {
          // Otra persona tocó la regla entre la lectura y la escritura.
          if (error instanceof UiStaleRecordError)
            throw ruleVersionMismatch(rule.rowVersion);
          throw error;
        });
      return (await this.toRuleViews([row]))[0];
    });
    this.logger.info(
      {
        operation: 'ui-visibility.rule.end',
        ruleId: id,
        actorId: actor.userId,
      },
      'UI rule ended',
    );
    return view;
  }

  // ═══ Vista previa «ver como» ═══════════════════════════════════════════════
  async preview(
    q: PreviewQueryDto,
    actor: UiAdminActor,
  ): Promise<UiPreviewView> {
    this.requireScope(actor);
    if ((q.userId === undefined) === (q.roleCode === undefined))
      throw previewSubjectRequired();
    const now = new Date();
    const tenantId = actor.tenantId;
    const orgType = tenantId
      ? await this.store.orgTypeOfTenant(tenantId)
      : null;

    let subject: ResolverSubject;
    let described: UiPreviewView['subject'];
    if (q.userId !== undefined) {
      const labels = await this.store.userLabels([q.userId]);
      const label = labels.get(q.userId);
      if (label === undefined) throw previewSubjectNotFound();
      if (
        !actor.isPlatform &&
        !(tenantId && (await this.store.userInTenant(q.userId, tenantId)))
      )
        throw previewSubjectNotFound();
      const roles = await this.store.effectiveRoleCodes(
        q.userId,
        tenantId,
        now,
      );
      subject = { userId: q.userId, tenantId, roles, orgType };
      described = { type: 'USER', id: q.userId, label };
    } else {
      const code = q.roleCode as string;
      const names = await this.store.roleNames([code]);
      if (!names.has(code) && !GLOBAL_ROLE_CODES.has(code))
        throw previewSubjectNotFound();
      subject = { userId: null, tenantId, roles: [code], orgType };
      described = { type: 'ROLE', id: code, label: names.get(code) ?? code };
    }

    const entries = await resolveForSubject(this.store, subject, now);
    const hidden = new Set(hiddenKeysOf(entries));
    return {
      subject: described,
      entries: entries
        .filter((e) => hidden.has(e.elementKey))
        .map((e) => ({
          elementKey: e.elementKey,
          hidden: true,
          winningRuleId: e.winningRuleId,
          reason: e.reason,
          ancestorKey: e.ancestorKey,
        })),
    };
  }

  /** Un actor de organización sin organización no tiene alcance: nunca se degrada a «ver todo». */
  private requireScope(actor: UiAdminActor): void {
    if (!actor.isPlatform && actor.tenantId === null)
      throw tenantScopeRequired();
  }

  // ═══ Apoyo ═════════════════════════════════════════════════════════════════
  private assertValidity(from: Date | null, to: Date | null, now: Date): void {
    if (from && to && to.getTime() <= from.getTime())
      throw invalidValidity('validTo debe ser posterior a validFrom');
    if (to && to.getTime() <= now.getTime())
      throw invalidValidity(
        'validTo ya pasó: para dejar de aplicar una regla, termínela',
      );
  }

  /** Carga la regla y la acota al alcance del actor; fuera de él, el mismo 404 que una inexistente. */
  private async loadInScope(
    tx: UiVisibilityStore,
    id: string,
    actor: UiAdminActor,
  ): Promise<RuleRecord> {
    const rule = await tx.findRule(id);
    if (!rule) throw ruleNotFound();
    if (!actor.isPlatform && rule.scopeTenantId !== actor.tenantId)
      throw ruleNotFound();
    return rule;
  }

  /**
   * Anti-bloqueo: un HIDE sobre una pantalla de gobierno no puede alcanzar a administradores.
   * Rechaza ALL, ROLE SUPERADMIN/SECURITY_ADMIN y USER con rol de administración. TENANT y
   * ORG_TYPE se admiten: el resolutor igual protege a los administradores de ese conjunto.
   */
  private async assertNotAdminSubject(
    tx: UiVisibilityStore,
    type: UiRuleSubjectType,
    subjectId: string | null,
    actor: UiAdminActor,
  ): Promise<void> {
    if (type === 'ALL') throw protectedElement();
    if (type === 'ROLE' && subjectId && UI_PROTECTED_ROLES.includes(subjectId))
      throw protectedElement();
    if (type === 'USER' && subjectId) {
      const roles = await tx.effectiveRoleCodes(
        subjectId,
        actor.tenantId,
        new Date(),
      );
      if (roles.some((r) => UI_PROTECTED_ROLES.includes(r)))
        throw protectedElement();
    }
  }

  /** La forma del sujeto, su existencia y su alcance. Todo fallo es el mismo 422 `UI_RULE_INVALID_SUBJECT`. */
  private async assertSubject(
    tx: UiVisibilityStore,
    type: UiRuleSubjectType,
    subjectId: string | null,
    actor: UiAdminActor,
  ): Promise<void> {
    const bad = (m: string) => invalidSubject(m);
    if (type === 'ALL') {
      if (subjectId !== null) throw bad('ALL no lleva sujeto');
      if (!actor.isPlatform) throw bad('El sujeto está fuera de su alcance');
      return;
    }
    if (subjectId === null || subjectId.length === 0)
      throw bad('Falta el sujeto de la regla');

    switch (type) {
      case 'USER': {
        if (!UUID_RE.test(subjectId)) throw bad('El usuario no es válido');
        const found = await tx.userLabels([subjectId]);
        if (!found.has(subjectId))
          throw bad('El usuario no existe o está fuera de su alcance');
        if (
          !actor.isPlatform &&
          !(
            actor.tenantId && (await tx.userInTenant(subjectId, actor.tenantId))
          )
        )
          throw bad('El usuario no existe o está fuera de su alcance');
        return;
      }
      case 'TENANT': {
        if (!UUID_RE.test(subjectId)) throw bad('La organización no es válida');
        if (!actor.isPlatform && subjectId !== actor.tenantId)
          throw bad('La organización no existe o está fuera de su alcance');
        const found = await tx.tenantLabels([subjectId]);
        if (!found.has(subjectId))
          throw bad('La organización no existe o está fuera de su alcance');
        return;
      }
      case 'ROLE': {
        if (!actor.isPlatform) throw bad('El sujeto está fuera de su alcance');
        const names = await tx.roleNames([subjectId]);
        if (!names.has(subjectId) && !GLOBAL_ROLE_CODES.has(subjectId))
          throw bad('El rol no existe');
        return;
      }
      case 'ORG_TYPE': {
        if (!actor.isPlatform) throw bad('El sujeto está fuera de su alcance');
        if (!UI_ORG_TYPE_CODES.includes(subjectId))
          throw bad('El tipo de organización no existe');
        return;
      }
      default:
        throw bad('Tipo de sujeto no válido');
    }
  }

  private async toElementViews(
    rows: readonly ElementRecord[],
    now: Date,
  ): Promise<UiElementView[]> {
    const parentIds = [
      ...new Set(
        rows.flatMap((r) => (r.parentElementId ? [r.parentElementId] : [])),
      ),
    ];
    const [parents, counts] = await Promise.all([
      this.store.findElementsByIds(parentIds),
      this.store.countActiveRules(
        rows.map((r) => r.id),
        now,
      ),
    ]);
    const keyById = new Map(parents.map((p) => [p.id, p.key]));
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      kind: r.kind,
      moduleCode: r.moduleCode,
      parentKey: r.parentElementId
        ? (keyById.get(r.parentElementId) ?? null)
        : null,
      label: r.label,
      description: r.description,
      defaultVisible: r.defaultVisible,
      source: r.source,
      status: r.status,
      activeRuleCount: counts.get(r.id) ?? 0,
    }));
  }

  private async toRuleViews(
    rows: readonly RuleRecord[],
    knownKeys: ReadonlyMap<string, string> = new Map(),
  ): Promise<UiRuleView[]> {
    const missing = [
      ...new Set(
        rows.map((r) => r.elementId).filter((id) => !knownKeys.has(id)),
      ),
    ];
    const elements = await this.store.findElementsByIds(missing);
    const keyById = new Map<string, string>([
      ...knownKeys,
      ...elements.map((e) => [e.id, e.key] as const),
    ]);

    const ofType = (t: UiRuleSubjectType) => [
      ...new Set(
        rows
          .filter((r) => r.subjectType === t && r.subjectId)
          .map((r) => r.subjectId as string),
      ),
    ];
    const creators = [
      ...new Set(
        rows.flatMap((r) => (r.createdByUserId ? [r.createdByUserId] : [])),
      ),
    ];
    const [users, tenants, roles, authors] = await Promise.all([
      this.store.userLabels(ofType('USER')),
      this.store.tenantLabels(ofType('TENANT')),
      this.store.roleNames(ofType('ROLE')),
      this.store.userLabels(creators),
    ]);
    const labelOf = (r: RuleRecord): string | null => {
      if (!r.subjectId) return null;
      switch (r.subjectType) {
        case 'USER':
          return users.get(r.subjectId) ?? null;
        case 'TENANT':
          return tenants.get(r.subjectId) ?? null;
        case 'ROLE':
          return roles.get(r.subjectId) ?? r.subjectId;
        case 'ORG_TYPE':
          return r.subjectId;
        default:
          return null;
      }
    };
    return rows.map((r) => ({
      id: r.id,
      elementKey: keyById.get(r.elementId) ?? '',
      effect: r.effect,
      subjectType: r.subjectType,
      subjectId: r.subjectId,
      subjectLabel: labelOf(r),
      validFrom: iso(r.validFrom),
      validTo: iso(r.validTo),
      reason: r.reason,
      version: r.rowVersion,
      createdAt: r.createdAt.toISOString(),
      createdByLabel: r.createdByUserId
        ? (authors.get(r.createdByUserId) ?? null)
        : null,
    }));
  }
}

const sameDate = (a: Date | null, b: Date | null): boolean =>
  (a === null && b === null) ||
  (a !== null && b !== null && a.getTime() === b.getTime());

const sortedDraft = (d: UiElementDraftDto) => ({
  key: d.key,
  kind: d.kind,
  moduleCode: d.moduleCode,
  parentKey: d.parentKey ?? null,
  label: d.label,
  description: d.description ?? null,
  defaultVisible: d.defaultVisible,
});

/** Padres antes que hijos; un ciclo es un 422 `UI_ELEMENT_HIERARCHY_CYCLE`. */
export function topologicalOrder(
  drafts: readonly UiElementDraftDto[],
): UiElementDraftDto[] {
  const byKey = new Map(drafts.map((d) => [d.key, d]));
  const out: UiElementDraftDto[] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (d: UiElementDraftDto): void => {
    const s = state.get(d.key);
    if (s === 'done') return;
    if (s === 'visiting') throw hierarchyCycle();
    state.set(d.key, 'visiting');
    const parent = d.parentKey ? byKey.get(d.parentKey) : undefined;
    if (parent) visit(parent);
    state.set(d.key, 'done');
    out.push(d);
  };
  for (const d of drafts) visit(d);
  return out;
}
