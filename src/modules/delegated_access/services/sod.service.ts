import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  roleAuthorizesInTenant,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  checkSodTransaction,
  evaluateSod,
  expandAtomPattern,
  mergeSodRules,
  summarizeSod,
  validateSodExceptionRequest,
  validateSodRuleDerivation,
  type GrantTargetFacts,
  type SodAction,
  type SodException,
  type SodFinding,
  type SodGrantInput,
  type SodRule,
  type SodScope,
  type SodSummary,
} from '../domain';
import type {
  CreateSodRuleDto,
  FourEyesRequestedDto,
  ListSodExceptionsResponseDto,
  ListSodFindingsResponseDto,
  ListSodRulesResponseDto,
  RequestSodExceptionDto,
  RevokeSodExceptionDto,
  SodExceptionViewDto,
  SodFindingViewDto,
  SodRuleViewDto,
  UpdateSodRuleDto,
} from '../dto';
import type { SodExceptions, SodRules } from '../entities';
import { SodRepository } from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { FourEyesExecutors, FourEyesService } from './four-eyes.service';
import { mapGovernanceDbError } from './governance-db-errors';
import { governanceError } from './governance-errors';
import { GovernanceSettingsService } from './governance-settings.service';
import { GovernanceAccessGate, type AdminView } from './governance-access.gate';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import { SupportPersonGrantsLoader } from './support-person-grants.loader';
import { TeamAdminPolicy } from './team-admin.policy';
import { AuditTrailService } from '../../audit/services/audit-trail.service';

/** Átomo que habilita a un administrador delegado a pedir excepciones de segregación de funciones. */
const REQUEST_EXCEPTION_ATOM = 'team.sod.exception.request';

const SCOPE_BY_CONCEPT = new Map<string, SodScope>([
  [DELEG.SOD_SCOPE_PERSON, 'PERSON'],
  [DELEG.SOD_SCOPE_PERSON_OVERLAP, 'PERSON_OVERLAP'],
  [DELEG.SOD_SCOPE_TRANSACTION, 'TRANSACTION'],
]);
const ACTION_BY_CONCEPT = new Map<string, SodAction>([
  [DELEG.SOD_ACTION_BLOCK, 'BLOCK'],
  [DELEG.SOD_ACTION_REQUIRE_APPROVAL, 'REQUIRE_APPROVAL'],
  [DELEG.SOD_ACTION_WARN, 'WARN'],
]);
const SCOPE_CONCEPT: Readonly<Record<SodScope, string>> = {
  PERSON: DELEG.SOD_SCOPE_PERSON,
  PERSON_OVERLAP: DELEG.SOD_SCOPE_PERSON_OVERLAP,
  TRANSACTION: DELEG.SOD_SCOPE_TRANSACTION,
};
const ACTION_CONCEPT: Readonly<Record<SodAction, string>> = {
  BLOCK: DELEG.SOD_ACTION_BLOCK,
  REQUIRE_APPROVAL: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
  WARN: DELEG.SOD_ACTION_WARN,
};

/** Un permiso que se quiere otorgar (todavía no existe). */
export interface ProposedSodGrant extends Partial<GrantTargetFacts> {
  /** Objetivo del permiso. */
  readonly targetKind: GrantTargetFacts['targetKind'];
  /** Átomos o alias que incluye. */
  readonly actions: readonly string[];
  /** `ALLOW` (por defecto) o `DENY`. */
  readonly effect?: 'ALLOW' | 'DENY';
  /** Fin de vigencia. */
  readonly validTo?: Date;
}

/** Qué se quiere otorgar a una persona. */
export interface SodGrantCheckInput {
  /** Persona que recibirá los permisos. */
  readonly userId: string;
  /** Permisos nuevos. */
  readonly proposed: readonly ProposedSodGrant[];
  /** Permisos actuales que los nuevos reemplazan (edición). */
  readonly replacesGrantIds?: readonly string[];
  /** Reloj; por defecto ahora. */
  readonly now?: Date;
}

/** Fila de regla → regla del dominio. */
function toSodRule(
  row: SodRules,
  codeById: ReadonlyMap<string, string>,
): SodRule {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    atomsA: Array.isArray(row.atomsAJson) ? (row.atomsAJson as string[]) : [],
    atomsB: Array.isArray(row.atomsBJson) ? (row.atomsBJson as string[]) : [],
    scope: SCOPE_BY_CONCEPT.get(row.scopeConceptId) ?? 'PERSON',
    action: ACTION_BY_CONCEPT.get(row.actionConceptId) ?? 'BLOCK',
    isHard: row.isHard,
    maxExceptionDays: row.maxExceptionDays ?? null,
    ...(row.rationaleText ? { rationale: row.rationaleText } : {}),
    ...(row.baseRuleId && codeById.get(row.baseRuleId)
      ? { baseRuleCode: codeById.get(row.baseRuleId) }
      : {}),
  };
}

/** Lo que devuelve la lectura de reglas: dominio, filas y cuáles son de plataforma. */
interface RulesBundle {
  readonly rules: SodRule[];
  readonly rowById: ReadonlyMap<string, SodRules>;
  readonly platformIds: ReadonlySet<string>;
}

function findingView(
  engagementId: string,
  userId: string,
  f: SodFinding,
): SodFindingViewDto {
  return {
    engagementId,
    userId,
    ruleCode: f.ruleCode,
    ruleName: f.ruleName,
    action: f.action,
    outcome: f.outcome,
    atomsA: [...f.atomsA],
    atomsB: [...f.atomsB],
    ...(f.exceptionId ? { exceptionId: f.exceptionId } : {}),
    ...(f.exceptionValidTo ? { exceptionValidTo: f.exceptionValidTo } : {}),
    admitsException: f.admitsException,
    message: describeFinding(f),
  };
}

function describeFinding(f: SodFinding): string {
  switch (f.outcome) {
    case 'BLOCKED':
      return `No puede tener a la vez estas funciones («${f.ruleName}»): se bloquea y no admite excepción.`;
    case 'EXCEPTION_REQUIRED':
      return `Estas funciones juntas («${f.ruleName}») necesitan una excepción justificada y aprobada.`;
    case 'EXCEPTED':
      return `Estas funciones («${f.ruleName}») están juntas por una excepción vigente.`;
    default:
      return `Advertencia: estas funciones juntas («${f.ruleName}») conviene separarlas.`;
  }
}

/** Hallazgo en la forma que viaja en `details.findings`. */
function findingDetail(f: SodFinding): Record<string, unknown> {
  return {
    ruleCode: f.ruleCode,
    ruleName: f.ruleName,
    action: f.action,
    outcome: f.outcome,
    atomsA: [...f.atomsA],
    atomsB: [...f.atomsB],
    admitsException: f.admitsException,
    message: describeFinding(f),
  };
}

/**
 * Segregación de funciones (CONTRATO-GOBIERNO §6.3): reglas, hallazgos,
 * excepciones y las comprobaciones que otros servicios llaman al otorgar o al
 * ejecutar una transacción.
 *
 * - **Al otorgar** ({@link SodService.assertGrantAllowed}): suma lo propuesto a lo
 *   que la persona ya posee (alias expandidos; las `DENY` no restan) y bloquea
 *   (422 `SOD_CONFLICT_BLOCKED`) o pide excepción (409 `SOD_EXCEPTION_REQUIRED`)
 *   SOLO por los conflictos que involucran lo que se otorga: un conflicto
 *   heredado no frena un otorgamiento que no lo toca (lo trata el barrido).
 * - **Excepciones:** crean un cuatro ojos `SOD_EXCEPTION`; al aprobarse nace la
 *   fila `ACTIVE` con `valid_to` obligatorio. Las reglas `is_hard` no admiten
 *   excepción.
 * - **Transacción:** {@link SodService.assertTransaction} impone las reglas
 *   `TRANSACTION` (quien decide ≠ quien pidió; quien certifica ≠ quien otorgó).
 */
@Injectable()
export class SodService {
  /**
   * @param em - Contexto de persistencia.
   * @param repo - Reglas y excepciones.
   * @param loader - Concesiones de las personas de apoyo.
   * @param fourEyes - Cuatro ojos (crea las solicitudes de excepción).
   * @param executors - Registro de ejecutores de cuatro ojos.
   * @param settings - Ajustes de gobierno (`maxSodExceptionDays`).
   * @param stepUp - Paso extra de la sesión.
   * @param audit - Cadena de auditoría.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param access - Alcance de quien consulta (administrador o delegado).
   * @param logger - Logger estructurado.
   * @param team - Política de administración delegada (quién pide excepciones).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SodRepository,
    private readonly loader: SupportPersonGrantsLoader,
    private readonly fourEyes: FourEyesService,
    executors: FourEyesExecutors,
    private readonly settings: GovernanceSettingsService,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly audit: AuditTrailService,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly access: GovernanceAccessGate,
    private readonly logger: PinoLogger,
    @Optional() private readonly team?: TeamAdminPolicy,
  ) {
    this.logger.setContext(SodService.name);
    executors.register({
      kind: 'SOD_EXCEPTION',
      execute: (tx, row, ctx) => this.executeException(tx, row, ctx),
    });
  }

  /**
   * Reglas efectivas de la organización: las de plataforma, con las propias que
   * las endurecen en su lugar, más las propias nuevas.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @returns Las reglas del dominio.
   */
  async rulesFor(em: EntityManager, tenantId: string): Promise<SodRule[]> {
    return (await this.bundle(em, tenantId)).rules;
  }

  /** Reglas con sus filas y la marca de plataforma. */
  private async bundle(
    em: EntityManager,
    tenantId: string,
  ): Promise<RulesBundle> {
    const all = await this.repo.findRulesVisible(em, tenantId);
    // Solo la versión más alta de cada código (plataforma y organización por separado).
    const latest = new Map<string, SodRules>();
    for (const row of all) {
      const key = `${row.tenantId ?? ''}:${row.code}`;
      const current = latest.get(key);
      if (!current || row.versionNumber > current.versionNumber)
        latest.set(key, row);
    }
    const rows = [...latest.values()];
    const codeById = new Map(rows.map((r) => [r.id, r.code]));
    const platformRows = rows.filter((r) => !r.tenantId);
    const orgRows = rows.filter((r) => !!r.tenantId);
    return {
      rules: mergeSodRules(
        platformRows.map((r) => toSodRule(r, codeById)),
        orgRows.map((r) => toSodRule(r, codeById)),
      ),
      rowById: new Map(rows.map((r) => [r.id, r])),
      platformIds: new Set(platformRows.map((r) => r.id)),
    };
  }

  /**
   * Reglas de la organización activa (`GET /org/governance/sod-rules`).
   *
   * @param actor - Quien consulta (el delegado necesita `team.members.view`).
   */
  async listRules(actor?: AuthenticatedUser): Promise<ListSodRulesResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    if (actor) await this.access.view(tx, actor, 'team.members.view');
    const bundle = await this.bundle(tx, tenantId);
    const items = bundle.rules.map((rule) => ruleView(rule, bundle));
    return { items, count: items.length };
  }

  /**
   * Crea una regla propia o endurece una de plataforma.
   *
   * @param dto - Código, conjuntos A y B, alcance, acción y excepción máxima.
   * @param actor - Quien la crea (paso extra obligatorio).
   * @returns La regla creada.
   */
  async createRule(
    dto: CreateSodRuleDto,
    actor: AuthenticatedUser,
  ): Promise<SodRuleViewDto> {
    const tenantId = this.scope.resolveTenant();
    this.assertSets(dto.scope, dto.atomsA, dto.atomsB);
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const bundle = await this.bundle(tx, tenantId);
      const base = dto.baseRuleCode
        ? bundle.rules.find(
            (r) =>
              r.code === dto.baseRuleCode && bundle.platformIds.has(r.id ?? ''),
          )
        : undefined;
      if (dto.baseRuleCode && !base) {
        throw governanceError(
          Reason.SOD_RULE_NOT_FOUND,
          'La regla de plataforma que quiere endurecer no existe.',
        );
      }
      const taken = bundle.rules.some((r) => r.code === dto.code);
      const isOwnRevision = !!base && base.code === dto.code;
      if (taken && !isOwnRevision) {
        throw governanceError(
          Reason.GOVERNANCE_RULE_DUPLICATE,
          'Ya existe una regla con ese código.',
        );
      }
      const maxExceptionDays = dto.isHard ? undefined : dto.maxExceptionDays;
      const derived: SodRule = {
        code: dto.code,
        name: dto.name,
        atomsA: dto.atomsA,
        atomsB: dto.atomsB,
        scope: dto.scope,
        action: dto.action,
        isHard: dto.isHard ?? false,
        maxExceptionDays: maxExceptionDays ?? null,
      };
      if (base) {
        const issues = validateSodRuleDerivation(base, derived);
        if (issues.length > 0) {
          throw governanceError(
            Reason.SOD_RULE_LOOSENS_BASE,
            'Una regla de la organización solo puede endurecer la de plataforma, no aflojarla.',
            { fields: issues.map((i) => i.field) },
          );
        }
      }
      const row = this.repo.createRule(tx, {
        tenantId,
        code: dto.code,
        name: dto.name,
        baseRuleId: base?.id,
        atomsA: dto.atomsA,
        atomsB: dto.atomsB,
        scopeConceptId: SCOPE_CONCEPT[dto.scope],
        actionConceptId: ACTION_CONCEPT[dto.action],
        isHard: dto.isHard ?? false,
        maxExceptionDays,
        rationaleText: dto.rationale,
        actorUserId: actor.id,
      });
      await this.flush(tx);
      const codeById = new Map<string, string>(
        base?.id ? [[base.id, base.code]] : [],
      );
      return ruleView(toSodRule(row, codeById), {
        rules: [],
        rowById: new Map([[row.id, row]]),
        platformIds: new Set(),
      });
    });
  }

  /**
   * Edita una regla propia (las de plataforma son de solo lectura).
   *
   * @param id - Regla.
   * @param dto - Cambios y `expectedRowVersion`.
   * @param actor - Quien la edita (paso extra obligatorio).
   * @returns La regla editada.
   */
  async updateRule(
    id: string,
    dto: UpdateSodRuleDto,
    actor: AuthenticatedUser,
  ): Promise<SodRuleViewDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const row = await this.repo.findRuleById(tx, id);
      if (!row || (row.tenantId && row.tenantId !== tenantId)) {
        throw governanceError(
          Reason.SOD_RULE_NOT_FOUND,
          'Regla no encontrada.',
        );
      }
      if (!row.tenantId) {
        throw governanceError(
          Reason.SOD_RULE_PLATFORM_READ_ONLY,
          'Las reglas de plataforma no se editan: cree una propia que la endurezca.',
        );
      }
      if (row.rowVersion !== dto.expectedRowVersion) {
        throw governanceError(
          Reason.ROW_VERSION_CONFLICT,
          'La regla cambió mientras la editaba: vuelva a abrirla.',
          { rowVersion: row.rowVersion },
        );
      }
      const bundle = await this.bundle(tx, tenantId);
      const codeById = new Map(
        [...bundle.rowById.values()].map((r) => [r.id, r.code]),
      );
      const current = toSodRule(row, codeById);
      const next: SodRule = {
        ...current,
        name: dto.name ?? current.name,
        atomsA: dto.atomsA ?? current.atomsA,
        atomsB: dto.atomsB ?? current.atomsB,
        scope: dto.scope ?? current.scope,
        action: dto.action ?? current.action,
        isHard: dto.isHard ?? current.isHard,
        maxExceptionDays:
          (dto.isHard ?? current.isHard)
            ? null
            : (dto.maxExceptionDays ?? current.maxExceptionDays ?? null),
        ...(dto.rationale !== undefined ? { rationale: dto.rationale } : {}),
      };
      this.assertSets(next.scope, next.atomsA, next.atomsB);
      const base = row.baseRuleId
        ? (bundle.rules.find((r) => r.id === row.baseRuleId) ??
          [...bundle.rowById.values()]
            .filter((r) => r.id === row.baseRuleId)
            .map((r) => toSodRule(r, codeById))[0])
        : undefined;
      if (base) {
        const issues = validateSodRuleDerivation(base, next);
        if (issues.length > 0) {
          throw governanceError(
            Reason.SOD_RULE_LOOSENS_BASE,
            'Una regla de la organización solo puede endurecer la de plataforma, no aflojarla.',
            { fields: issues.map((i) => i.field) },
          );
        }
      }
      row.name = next.name;
      row.atomsAJson = [...next.atomsA];
      row.atomsBJson = [...next.atomsB];
      row.scopeConceptId = SCOPE_CONCEPT[next.scope];
      row.actionConceptId = ACTION_CONCEPT[next.action];
      row.isHard = next.isHard;
      row.maxExceptionDays = next.maxExceptionDays ?? undefined;
      if (dto.rationale !== undefined) row.rationaleText = dto.rationale;
      touch(row, actor.id);
      await this.flush(tx);
      return ruleView(toSodRule(row, codeById), {
        rules: [],
        rowById: new Map([[row.id, row]]),
        platformIds: new Set(),
      });
    });
  }

  /**
   * Conflictos de hoy, con o sin excepción (`GET /org/governance/sod-findings`).
   * El administrador de seguridad ve toda la organización; un delegado, solo las
   * personas de su alcance.
   *
   * @param actor - Quien consulta.
   * @returns Un hallazgo por persona y regla.
   */
  async findings(
    actor?: AuthenticatedUser,
  ): Promise<ListSodFindingsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const view: AdminView = actor
      ? await this.access.view(tx, actor, 'audit.reports.governance.view')
      : { full: true };
    const items = await this.findingsOf(tx, tenantId, new Date(), view);
    return { items, count: items.length };
  }

  /**
   * Conflictos de hoy de una organización (también los usa el barrido y el tablero).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @returns Los hallazgos en orden estable.
   */
  async findingsOf(
    em: EntityManager,
    tenantId: string,
    now: Date,
    view: AdminView = { full: true },
  ): Promise<SodFindingViewDto[]> {
    const rules = await this.rulesFor(em, tenantId);
    const people = (await this.loader.load(em, tenantId)).filter((p) =>
      this.access.manages(view, p.grants),
    );
    const byUser = new Map<
      string,
      { engagementIds: string[]; grants: SodGrantInput[] }
    >();
    for (const p of people) {
      const entry = byUser.get(p.userId) ?? { engagementIds: [], grants: [] };
      entry.engagementIds.push(p.engagementId);
      entry.grants.push(...p.grants);
      byUser.set(p.userId, entry);
    }
    const exceptions = await this.exceptionsOf(
      em,
      tenantId,
      now,
      people.map((p) => p.engagementId),
      rules,
    );
    const out: SodFindingViewDto[] = [];
    for (const [userId, entry] of [...byUser.entries()].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const own = entry.engagementIds.flatMap((id) => exceptions.get(id) ?? []);
      for (const finding of evaluateSod(entry.grants, rules, own, now)) {
        out.push(findingView(entry.engagementIds[0], userId, finding));
      }
    }
    return out;
  }

  /**
   * Evalúa un conjunto de permisos de UNA persona contra las reglas y sus
   * excepciones vigentes, sin leer ni escribir sus permisos (lo usa el simulador
   * con el borrador). Solo lectura.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param input - Vínculos de la persona, permisos a evaluar y reloj.
   * @returns Los hallazgos del conjunto.
   */
  async evaluateGrants(
    em: EntityManager,
    tenantId: string,
    input: {
      readonly engagementIds: readonly string[];
      readonly grants: readonly SodGrantInput[];
      readonly now: Date;
    },
  ): Promise<SodFinding[]> {
    const rules = await this.rulesFor(em, tenantId);
    const exceptions = await this.exceptionsOf(
      em,
      tenantId,
      input.now,
      input.engagementIds,
      rules,
    );
    return evaluateSod(
      input.grants,
      rules,
      [...exceptions.values()].flat(),
      input.now,
    );
  }

  /**
   * Excepciones vigentes (`GET /org/governance/sod-exceptions`); un delegado ve
   * solo las de las personas de su alcance.
   *
   * @param actor - Quien consulta.
   */
  async listExceptions(
    actor?: AuthenticatedUser,
  ): Promise<ListSodExceptionsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const view: AdminView = actor
      ? await this.access.view(tx, actor, 'audit.reports.governance.view')
      : { full: true };
    let rows = await this.repo.findActiveExceptions(tx, tenantId, now);
    if (!view.full) {
      const people = await this.loader.load(tx, tenantId, {
        engagementIds: rows.map((r) => r.organizationUserAssignmentId),
      });
      const visible = new Set(
        people
          .filter((p) => this.access.manages(view, p.grants))
          .map((p) => p.engagementId),
      );
      rows = rows.filter((r) => visible.has(r.organizationUserAssignmentId));
    }
    const rules = await this.bundle(tx, tenantId);
    const items = rows.map((row) => exceptionView(row, rules.rowById));
    return { items, count: items.length };
  }

  /**
   * Pide una excepción (`POST /org/governance/sod-exceptions`): valida la
   * petición y crea el cuatro ojos `SOD_EXCEPTION` (202).
   *
   * @param dto - Vínculo, regla, justificación y fin.
   * @param actor - Quien la pide.
   * @returns Los datos de la solicitud creada.
   */
  async requestException(
    dto: RequestSodExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<FourEyesRequestedDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const now = new Date();
      await this.assertMayRequestException(tx, actor, tenantId, dto, now);
      const [person] = await this.loader.load(tx, tenantId, {
        engagementIds: [dto.engagementId],
      });
      if (!person) {
        throw governanceError(
          Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
          'Vínculo de apoyo no encontrado.',
        );
      }
      if (person.userId === actor.id) {
        throw governanceError(
          Reason.GUARDRAIL_SELF_ADMIN,
          'Nadie pide excepciones para sus propios permisos.',
        );
      }
      const rule = (await this.rulesFor(tx, tenantId)).find(
        (r) => r.code === dto.ruleCode,
      );
      if (!rule) {
        throw governanceError(
          Reason.SOD_RULE_NOT_FOUND,
          'Regla no encontrada.',
        );
      }
      await this.assertExceptionRequest(
        tx,
        tenantId,
        rule,
        dto.justification,
        dto.validTo,
      );
      const row = await this.fourEyes.requestAdministrative(tx, {
        tenantId,
        kind: 'SOD_EXCEPTION',
        actor,
        subjectUserId: person.userId,
        organizationUserAssignmentId: person.engagementId,
        approverKind: 'SECOND_APPROVER',
        payload: {
          engagementId: person.engagementId,
          ruleCode: rule.code,
          justification: dto.justification.trim(),
          validTo: new Date(dto.validTo).toISOString(),
        },
        reasonText: dto.justification.trim(),
      });
      await this.audit.record(tx, actor, {
        action: 'SOD_EXCEPTION_REQUESTED',
        entity: 'four_eyes_request',
        entityId: row.id,
        tenantId,
        success: true,
      });
      return {
        approvalId: row.id,
        status: 'PENDING',
        expiresAt: row.expiresAt,
        approverKind: 'SECOND_APPROVER',
      };
    });
  }

  /**
   * Quién puede pedir la excepción: `SECURITY_ADMIN` (alcance total) o un
   * administrador delegado vivo con `team.sod.exception.request` cuya jurisdicción
   * cubre a la persona (`TeamAdminPolicy`, §6.4); una persona fuera de su alcance
   * responde como inexistente. Sin la política (pruebas aisladas) rige la regla
   * anterior: solo `SECURITY_ADMIN`.
   */
  private async assertMayRequestException(
    tx: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    dto: RequestSodExceptionDto,
    now: Date,
  ): Promise<void> {
    if (!this.team) {
      if (!roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId)) {
        throw governanceError(
          Reason.ADMIN_SCOPE_EXCEEDED,
          'Las excepciones de segregación de funciones las pide un administrador de seguridad.',
        );
      }
      return;
    }
    const teamActor = await this.team.actorOf(
      tx,
      actor,
      tenantId,
      REQUEST_EXCEPTION_ATOM,
      now,
    );
    if (!teamActor.full) {
      await this.team.memberOf(
        tx,
        teamActor,
        tenantId,
        dto.engagementId,
        REQUEST_EXCEPTION_ATOM,
        now,
      );
    }
  }

  /**
   * Revoca una excepción vigente (`POST …/sod-exceptions/:id/revoke`).
   *
   * @param id - Excepción.
   * @param dto - Motivo.
   * @param actor - Quien la revoca.
   * @returns La excepción revocada.
   */
  async revokeException(
    id: string,
    dto: RevokeSodExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<SodExceptionViewDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const row = await this.repo.findExceptionById(tx, tenantId, id);
      if (!row) {
        throw governanceError(
          Reason.SOD_EXCEPTION_NOT_FOUND,
          'Excepción no encontrada.',
        );
      }
      if (row.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw governanceError(
          Reason.SOD_EXCEPTION_NOT_ACTIVE,
          'La excepción ya no está vigente.',
        );
      }
      this.repo.revokeException(row, actor.id, dto.reason, new Date());
      await this.flush(tx);
      await this.audit.record(tx, actor, {
        action: 'SOD_EXCEPTION_REVOKED',
        entity: 'sod_exception',
        entityId: row.id,
        tenantId,
        success: true,
      });
      const bundle = await this.bundle(tx, tenantId);
      return exceptionView(row, bundle.rowById);
    });
  }

  /**
   * Comprueba un otorgamiento contra la SoD (CONTRATO-GOBIERNO §6.3 «Al otorgar»).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param input - Persona y permisos propuestos.
   * @returns El resumen (con advertencias y exceptuados) si el otorgamiento puede seguir.
   * @throws DomainException 422 `SOD_CONFLICT_BLOCKED` o 409 `SOD_EXCEPTION_REQUIRED`
   *   con `details.findings`.
   */
  async assertGrantAllowed(
    em: EntityManager,
    tenantId: string,
    input: SodGrantCheckInput,
  ): Promise<SodSummary> {
    const now = input.now ?? new Date();
    const rules = await this.rulesFor(em, tenantId);
    const people = await this.loader.load(em, tenantId, {
      userId: input.userId,
    });
    const replaced = new Set(input.replacesGrantIds ?? []);
    const current = people
      .flatMap((p) => p.grants)
      .filter((g) => !replaced.has(g.grantId));
    const proposed: SodGrantInput[] = input.proposed.map((p, i) => ({
      grantId: `proposed:${i}`,
      targetKind: p.targetKind,
      expansionMode: p.expansionMode ?? 'DYNAMIC',
      practitionerProfileId: p.practitionerProfileId,
      practitionerRoleAssignmentId: p.practitionerRoleAssignmentId,
      healthcareServiceId: p.healthcareServiceId,
      careSpaceId: p.careSpaceId,
      practiceSiteId: p.practiceSiteId,
      careSpacePath: p.careSpacePath,
      careSpaceSiteId: p.careSpaceSiteId,
      snapshot: p.snapshot,
      active: true,
      validTo: p.validTo,
      actions: p.actions,
      effect: p.effect ?? 'ALLOW',
    }));
    const exceptions = await this.exceptionsOf(
      em,
      tenantId,
      now,
      people.map((p) => p.engagementId),
      rules,
    );
    const own = [...exceptions.values()].flat();
    const involved = (f: SodFinding): boolean =>
      [...f.grantIdsA, ...f.grantIdsB].some((id) => id.startsWith('proposed:'));
    const findings = evaluateSod(
      [...current, ...proposed],
      rules,
      own,
      now,
    ).filter(involved);
    const summary = summarizeSod(findings);
    if (summary.verdict === 'BLOCKED') {
      throw governanceError(
        Reason.SOD_CONFLICT_BLOCKED,
        'Ese permiso, junto con los que ya tiene la persona, rompe la separación de funciones y no se puede otorgar.',
        { findings: summary.blocked.map(findingDetail) },
      );
    }
    if (summary.verdict === 'EXCEPTION_REQUIRED') {
      throw governanceError(
        Reason.SOD_EXCEPTION_REQUIRED,
        'Ese permiso necesita una excepción justificada y aprobada por otra persona.',
        { findings: summary.exceptionRequired.map(findingDetail) },
      );
    }
    return summary;
  }

  /**
   * Impone una regla de transacción (`SodTransactionGuard`): la misma persona no
   * actúa en las dos puntas de un mismo hecho.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param input - Regla, quienes actuaron en el lado A y quien actúa en el B.
   * @throws DomainException 422 `SOD_CONFLICT_BLOCKED` (409 `SOD_EXCEPTION_REQUIRED` si la regla pide aprobación).
   */
  async assertTransaction(
    em: EntityManager,
    tenantId: string,
    input: {
      readonly ruleCode: string;
      readonly actorsA: ReadonlyArray<string | null | undefined>;
      readonly actorB: string;
    },
  ): Promise<void> {
    const rules = await this.rulesFor(em, tenantId);
    const violation = checkSodTransaction({ ...input, rules });
    if (!violation || violation.outcome === 'WARNING') return;
    if (violation.outcome === 'BLOCKED') {
      throw governanceError(
        Reason.SOD_CONFLICT_BLOCKED,
        'La misma persona no puede actuar en las dos puntas de este hecho.',
        { ruleCode: violation.ruleCode },
      );
    }
    throw governanceError(
      Reason.SOD_EXCEPTION_REQUIRED,
      'La misma persona no puede actuar en las dos puntas de este hecho sin una excepción aprobada.',
      { ruleCode: violation.ruleCode },
    );
  }

  /** Ejecuta la excepción aprobada, re-validando todo (corre en la transacción de la aprobación). */
  private async executeException(
    tx: EntityManager,
    row: {
      id: string;
      tenantId: string;
      organizationUserAssignmentId?: string;
      payloadJson: unknown;
    },
    ctx: {
      approverUserId: string;
      tenantId: string;
      now: Date;
      actor: AuthenticatedUser;
    },
  ): Promise<Record<string, unknown>> {
    const payload = (row.payloadJson ?? {}) as Record<string, unknown>;
    const invalid = (
      message: string,
      details?: Record<string, unknown>,
    ): never => {
      throw governanceError(Reason.FOUR_EYES_PAYLOAD_INVALID, message, details);
    };
    const engagementId =
      asText(payload.engagementId) || row.organizationUserAssignmentId || '';
    const [person] = await this.loader.load(tx, ctx.tenantId, {
      engagementIds: [engagementId],
    });
    if (!person) invalid('La persona ya no tiene vínculo en la organización.');
    const rules = await this.rulesFor(tx, ctx.tenantId);
    const rule = rules.find((r) => r.code === payload.ruleCode);
    if (!rule?.id) invalid('La regla ya no existe.');
    const issues = await this.exceptionIssues(
      tx,
      ctx.tenantId,
      rule as SodRule,
      asText(payload.justification),
      asText(payload.validTo),
      ctx.now,
    );
    if (issues.length > 0) {
      invalid('La excepción ya no es válida.', {
        issues: issues.map((i) => i.code),
      });
    }
    const active = await this.repo.findActiveExceptions(
      tx,
      ctx.tenantId,
      ctx.now,
      [engagementId],
    );
    if (active.some((e) => e.sodRuleId === rule!.id)) {
      invalid('Ya hay una excepción vigente de esa regla para la persona.');
    }
    const created = this.repo.createException(tx, {
      tenantId: ctx.tenantId,
      sodRuleId: rule!.id!,
      organizationUserAssignmentId: engagementId,
      fourEyesRequestId: row.id,
      justificationText: String(payload.justification),
      validFrom: ctx.now,
      validTo: new Date(String(payload.validTo)),
      actorUserId: ctx.approverUserId,
    });
    await this.outbox.publishDomainEvent(tx, {
      tenantId: ctx.tenantId,
      eventType: 'delegated_access.sod.exception_granted',
      aggregateType: 'sod_exception',
      aggregateId: created.id,
      payloadJson: {
        exceptionId: created.id,
        tenantId: ctx.tenantId,
        engagementId,
        ruleCode: rule!.code,
      },
      actorUserId: ctx.approverUserId,
    });
    await this.audit.record(tx, ctx.actor, {
      action: 'SOD_EXCEPTION_GRANTED',
      entity: 'sod_exception',
      entityId: created.id,
      tenantId: ctx.tenantId,
      success: true,
    });
    return { exceptionId: created.id };
  }

  private async assertExceptionRequest(
    tx: EntityManager,
    tenantId: string,
    rule: SodRule,
    justification: string,
    validTo: string,
  ): Promise<void> {
    const issues = await this.exceptionIssues(
      tx,
      tenantId,
      rule,
      justification,
      validTo,
      new Date(),
    );
    const first = issues[0];
    if (!first) return;
    throw governanceError(
      Reason[first.code as keyof typeof Reason],
      EXCEPTION_MESSAGES[first.code] ?? 'La excepción no es válida.',
      {
        issues: issues.map((i) => ({
          code: i.code,
          ...(i.limitDays ? { limitDays: i.limitDays } : {}),
        })),
      },
    );
  }

  private async exceptionIssues(
    tx: EntityManager,
    tenantId: string,
    rule: SodRule,
    justification: string,
    validTo: string,
    now: Date,
  ) {
    const settingMaxDays = (await this.settings.read(tx, tenantId)).settings
      .maxSodExceptionDays;
    const to = new Date(validTo);
    return validateSodExceptionRequest({
      rule,
      justification,
      validTo: Number.isNaN(to.getTime()) ? undefined : to,
      now,
      settingMaxDays,
    });
  }

  /** Excepciones vigentes por vínculo, con el código de su regla. */
  private async exceptionsOf(
    em: EntityManager,
    tenantId: string,
    now: Date,
    engagementIds: readonly string[],
    rules: readonly SodRule[],
  ): Promise<Map<string, SodException[]>> {
    const out = new Map<string, SodException[]>();
    if (engagementIds.length === 0) return out;
    const codeById = new Map(
      rules.filter((r) => r.id).map((r) => [r.id!, r.code]),
    );
    const rows = await this.repo.findActiveExceptions(
      em,
      tenantId,
      now,
      engagementIds,
    );
    for (const row of rows) {
      const ruleCode = codeById.get(row.sodRuleId);
      if (!ruleCode) continue;
      const list = out.get(row.organizationUserAssignmentId) ?? [];
      list.push({
        id: row.id,
        ruleCode,
        validFrom: row.validFrom,
        validTo: row.validTo,
        status: 'ACTIVE',
      });
      out.set(row.organizationUserAssignmentId, list);
    }
    return out;
  }

  /** Cada entrada de un conjunto es un átomo del catálogo, un patrón con comodín o (solo en `TRANSACTION`) un marcador `@…`. */
  private assertSets(
    scope: SodScope,
    atomsA: readonly string[],
    atomsB: readonly string[],
  ): void {
    for (const entry of [...atomsA, ...atomsB]) {
      const marker = entry.startsWith('@') && scope === 'TRANSACTION';
      if (!marker && expandAtomPattern(entry).length === 0) {
        throw governanceError(
          Reason.GOVERNANCE_RULE_INVALID,
          `«${entry}» no corresponde a ningún permiso del catálogo.`,
        );
      }
    }
  }

  private async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (err) {
      throw mapGovernanceDbError(err) ?? err;
    }
  }
}

/** Texto de un valor del cuerpo guardado (lo que no es texto es vacío). */
function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const EXCEPTION_MESSAGES: Readonly<Record<string, string>> = {
  SOD_RULE_HARD:
    'Esta regla no admite excepción: las dos funciones no pueden estar en la misma persona.',
  SOD_EXCEPTION_NOT_NEEDED: 'Esta regla solo advierte: no necesita excepción.',
  JUSTIFICATION_TOO_SHORT:
    'La justificación debe tener al menos 30 caracteres.',
  VALID_TO_REQUIRED: 'Indique hasta cuándo rige la excepción.',
  VALID_TO_NOT_IN_FUTURE: 'La fecha de fin de la excepción debe ser futura.',
  VALID_TO_EXCEEDS_LIMIT: 'La excepción dura más de lo permitido: acórtela.',
};

function ruleView(rule: SodRule, bundle: RulesBundle): SodRuleViewDto {
  const row = rule.id ? bundle.rowById.get(rule.id) : undefined;
  return {
    ...(rule.id ? { id: rule.id } : {}),
    code: rule.code,
    name: rule.name,
    atomsA: [...rule.atomsA],
    atomsB: [...rule.atomsB],
    scope: rule.scope,
    action: rule.action,
    isHard: rule.isHard,
    maxExceptionDays: rule.maxExceptionDays ?? null,
    ...(rule.rationale ? { rationale: rule.rationale } : {}),
    ...(rule.baseRuleCode ? { baseRuleCode: rule.baseRuleCode } : {}),
    platform: !!rule.id && bundle.platformIds.has(rule.id),
    ...(row ? { rowVersion: row.rowVersion } : {}),
  };
}

function exceptionView(
  row: SodExceptions,
  rules: ReadonlyMap<string, SodRules>,
): SodExceptionViewDto {
  const status =
    row.statusConceptId === CONCEPTS.STATE_ACTIVE
      ? 'ACTIVE'
      : row.statusConceptId === CONCEPTS.STATE_EXPIRED
        ? 'EXPIRED'
        : 'REVOKED';
  return {
    id: row.id,
    ruleCode: rules.get(row.sodRuleId)?.code ?? '',
    engagementId: row.organizationUserAssignmentId,
    justification: row.justificationText,
    validFrom: row.validFrom,
    validTo: row.validTo,
    status,
    ...(row.revokedAt ? { revokedAt: row.revokedAt } : {}),
  };
}
