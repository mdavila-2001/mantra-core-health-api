import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  getAuditRequestContext,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DELEG } from '../delegated_access.concepts';
import {
  AUTO_SCENARIOS_MAX,
  PERMISSION_ATOM_BY_CODE,
  SIMULATION_MAX_SCENARIOS,
  classifyChange,
  effectiveAtoms,
  evaluateSupportAccessV2,
  moveRequiresFourEyes,
  primaryAtomOf,
  privilegeDelta,
  summarizeImpact,
  describeGrant,
  type EngagementFacts,
  type ExplainResponse,
  type OrgCeilingRule,
  type ScenarioDecision,
  type ScenarioResult,
  type SimulateResponse,
  type SimulationScenario,
  type SodFinding,
  type SupportAccessContext,
  type SupportAccessFacts,
  type SupportAccessQuery,
  type SupportAtomCode,
  type SupportEvaluationResult,
  type SupportGrantFacts,
  type SupportCondition,
  type ValidationIssue,
} from '../domain';
import type {
  ExplainAccessDto,
  ExplainMyAccessDto,
  ExplainTeamAccessDto,
  SimulateAccessDto,
} from '../dto';
import {
  GovernanceRulesRepository,
  RoleTemplatesRepository,
  SupportAccessRepository,
  isPatientLinkedToTenant,
  type CareSpaceInfo,
  type EngagementRecord,
} from '../repositories';
import {
  buildExplainResponse,
  grantFactsOfDraft,
  type DraftWithEnd,
  simulationTokenOf,
  validateDraft,
} from './access-explain.support';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { GovernanceAccessGate, type AdminView } from './governance-access.gate';
import { inTenantTransaction } from './governance-tx';
import { SodService } from './sod.service';
import { SupportAccessContextLoader } from './support-access-context.loader';
import { SupportAccessPolicy } from './support-access.policy';
import { SupportDecisionPipeline } from './support-decision-pipeline';
import { SupportPersonGrantsLoader } from './support-person-grants.loader';

export {
  simulationTokenOf,
  verifySimulationToken,
} from './access-explain.support';

/** Texto de motivo que se supone cuando se pregunta «¿y si hubiera motivo?». */
const ASSUMED_REASON =
  'Motivo supuesto para explicar la decisión (¿y si hubiera motivo?).';
/** Identificador de aprobación que se supone en el «¿y si me aprobaran?»: nunca existe en la base. */
const ASSUMED_APPROVAL_ID = 'assumed-approval';

/** Una pregunta resuelta contra la organización: lo que el motor necesita saber del objetivo. */
interface ResolvedQuery {
  readonly label?: string;
  readonly action: string;
  readonly practitionerProfileId?: string;
  readonly practitionerRoleAssignmentIds?: readonly string[];
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly careSpacePath?: string;
  readonly careSpaceSiteId?: string;
  readonly context: SupportAccessContext;
}

/** Explicación para la propia persona o el doctor: sin arreglos administrativos y con `askAdmin`. */
export type SelfExplainResponse = Omit<ExplainResponse, 'adminFixes'> & {
  askAdmin: string;
};

/** Cómo se resuelve a quien se explica. */
interface ExplainMode {
  /** `true` solo para la propia persona: su IP, sesión y equipo sí cuentan. */
  readonly requestContext: boolean;
  /** Autoservicio: sin datos de terceros ni arreglos administrativos. */
  readonly self: boolean;
}

/**
 * «Explicar decisión» y «Simular antes de guardar» (CONTRATO-GOBIERNO §5).
 *
 * Usa el MISMO motor que decide (`evaluateSupportAccessV2`) con las mismas reglas
 * de la organización y los mismos hechos (PIP), pero **sin efectos**: siempre en
 * modo `peek`, no consume contadores ni aprobaciones, no registra decisiones y
 * no escribe nada (el único asiento es el `ACCESS_EXPLAINED`/`ACCESS_SIMULATED`
 * de la ruta). Para explicar a OTRA persona no se usan la IP, la sesión ni el
 * equipo de quien pregunta: lo que no se puede saber queda indeterminado
 * (cierra) o se supone con `assume`.
 *
 * Quien pregunta es `SECURITY_ADMIN` (toda la organización) o un delegado con el
 * átomo `audit.decisions.explain` sobre una persona de su alcance; fuera de eso,
 * 404 uniforme.
 */
@Injectable()
export class AccessExplainService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Vínculos, asignaciones, servicios y espacios.
   * @param policy - Política (carga los hechos de los vínculos).
   * @param pipeline - Reglas de la organización (caché).
   * @param loader - PIP de hechos perezosos.
   * @param gate - Alcance de quien pregunta.
   * @param people - Concesiones actuales de las personas.
   * @param sod - Segregación de funciones.
   * @param rulesRepo - Reglas `CEILING` de la organización.
   * @param templates - Plantillas de rol.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly policy: SupportAccessPolicy,
    private readonly pipeline: SupportDecisionPipeline,
    private readonly loader: SupportAccessContextLoader,
    private readonly gate: GovernanceAccessGate,
    private readonly people: SupportPersonGrantsLoader,
    private readonly sod: SodService,
    private readonly rulesRepo: GovernanceRulesRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessExplainService.name);
  }

  /**
   * Explica una decisión sobre una persona (`POST /org/access/explain`).
   *
   * @param dto - Persona (vínculo o cuenta), acción, objetivo, hora y supuestos.
   * @param actor - Quien pregunta.
   * @returns La decisión, su traza y lo que falta.
   */
  async explain(
    dto: ExplainAccessDto,
    actor: AuthenticatedUser,
  ): Promise<ExplainResponse> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const view = await this.viewFor(tx, actor, ['audit.decisions.explain']);
    const record = await this.subject(tx, tenantId, dto);
    return this.explainOne(tx, tenantId, record, dto, view, {
      requestContext: false,
      self: false,
    });
  }

  /**
   * La propia persona pregunta «¿por qué no puedo?» (`POST /me/support-access/explain`).
   *
   * @param dto - Organización y pregunta (sin `userId`: es quien llama).
   * @param actor - La persona de apoyo.
   * @returns La explicación sin arreglos administrativos (`askAdmin` en su lugar).
   */
  async explainMine(
    dto: ExplainMyAccessDto,
    actor: AuthenticatedUser,
  ): Promise<SelfExplainResponse & { tenantId: string }> {
    return inTenantTransaction(this.em, dto.tenantId, async (tx) => {
      const records = await this.access.findEngagements(tx, {
        userId: actor.id,
        tenantId: dto.tenantId,
      });
      if (records.length === 0) throw this.notFound();
      const out = await this.explainOne(
        tx,
        dto.tenantId,
        records[0],
        { ...dto, engagementId: undefined, userId: actor.id },
        { full: true },
        { requestContext: true, self: true },
      );
      const { adminFixes, ...rest } = out;
      return {
        ...rest,
        askAdmin: askAdminText(adminFixes ?? []),
        tenantId: dto.tenantId,
      };
    });
  }

  /**
   * El doctor pregunta por alguien de SU equipo y solo sobre SU agenda
   * (`POST /me/practitioner/support-team/explain`); cualquier otra pregunta es 404.
   *
   * @param dto - Persona y pregunta sobre una agenda del doctor.
   * @param actor - El doctor.
   * @returns La explicación sin arreglos administrativos.
   */
  async explainTeam(
    dto: ExplainTeamAccessDto,
    actor: AuthenticatedUser,
  ): Promise<SelfExplainResponse> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const profileId = actor.practitionerProfileId;
    if (!profileId || !dto.practitionerRoleAssignmentId) throw this.notFound();
    const roles = await this.access.findRoleAssignments(tx, [
      dto.practitionerRoleAssignmentId,
    ]);
    const role = roles.get(dto.practitionerRoleAssignmentId);
    if (
      !role ||
      role.tenantId !== tenantId ||
      role.practitionerProfileId !== profileId
    ) {
      throw this.notFound();
    }
    const record = await this.subject(tx, tenantId, dto);
    const facts = await this.policy.loadFacts(tx, [record]);
    if (
      !facts[0]?.acceptances.some((a) => a.practitionerProfileId === profileId)
    ) {
      throw this.notFound();
    }
    const out = await this.explainOne(
      tx,
      tenantId,
      record,
      dto,
      { full: true },
      {
        requestContext: false,
        self: true,
      },
    );
    const { adminFixes, ...rest } = out;
    return { ...rest, askAdmin: askAdminText(adminFixes ?? []) };
  }

  /**
   * Simula un borrador de permisos contra escenarios (`POST /org/access/simulate`).
   * Los errores del borrador viajan en `validation`, no como 4xx.
   *
   * @param dto - Vínculo, borrador, escenarios y si se agregan los automáticos.
   * @param actor - Quien simula.
   * @returns Validación, gobierno, resumen, escenarios antes/después e impacto.
   */
  async simulate(
    dto: SimulateAccessDto,
    actor: AuthenticatedUser,
  ): Promise<SimulateResponse> {
    const tenantId = this.scope.resolveTenant();
    const userScenarios = dto.scenarios ?? [];
    if (userScenarios.length > SIMULATION_MAX_SCENARIOS) {
      throw governanceError(
        Reason.SIMULATION_TOO_LARGE,
        `La simulación admite hasta ${SIMULATION_MAX_SCENARIOS} escenarios.`,
        { max: SIMULATION_MAX_SCENARIOS },
      );
    }
    const draft = dto.draft as unknown as DraftWithEnd;
    const tx = this.em.fork({ keepTransactionContext: true });
    const view = await this.viewFor(tx, actor, [
      'audit.decisions.explain',
      'team.grants.assign',
    ]);
    const record = await this.subject(tx, tenantId, {
      engagementId: dto.engagementId,
    });
    const now = new Date();
    const [person] = await this.people.load(tx, tenantId, {
      engagementIds: [record.assignment.id],
    });
    if (!this.gate.manages(view, person?.grants ?? [])) throw this.notFound();

    const currentFacts = await this.policy.loadFacts(tx, [record]);
    const base = currentFacts[0];
    const roleIds = [
      ...new Set(
        draft.grants
          .map((g) => g.practitionerRoleAssignmentId)
          .filter((x): x is string => !!x),
      ),
    ];
    const roles = await this.access.findRoleAssignments(tx, roleIds);
    const profileOfRole = (id: string): string | undefined =>
      roles.get(id)?.practitionerProfileId;
    const draftGrants = draft.grants.map((g, i) =>
      grantFactsOfDraft(g, i, profileOfRole),
    );
    const removed = new Set(draft.removeGrantIds ?? []);
    const replaced = new Set(
      draft.grants.map((g) => g.id).filter((x): x is string => !!x),
    );
    const after: SupportGrantFacts[] =
      draft.mode === 'REPLACE'
        ? draftGrants
        : [
            ...base.grants.filter(
              (g) => !removed.has(g.grantId) && !replaced.has(g.grantId),
            ),
            ...draftGrants,
          ];
    const template = await this.templateOf(tx, record);
    const templateAfter = draft.templateCode ?? template;
    const afterFacts: EngagementFacts[] = [
      {
        ...base,
        grants: after,
        ...(templateAfter ? { templateCode: templateAfter } : {}),
      },
    ];

    // Validación del borrador y gobierno (nunca lanza por el borrador).
    const orgCeiling = await this.ceilingRules(tx, tenantId, now);
    const errors: ValidationIssue[] = validateDraft(draft, {
      templateCode: templateAfter ?? '',
      now,
      orgCeilingRules: orgCeiling,
      delegatedAdmin: !roleAuthorizesInTenant(
        actor,
        'SECURITY_ADMIN',
        tenantId,
      ),
    });
    const warnings: ValidationIssue[] = [];
    const sodFindings = await this.sod.evaluateGrants(tx, tenantId, {
      engagementIds: [record.assignment.id],
      grants: after,
      now,
    });
    const draftIds = new Set(draftGrants.map((g) => g.grantId));
    sodFindings.forEach((f) => {
      const involved = [...f.grantIdsA, ...f.grantIdsB].find((id) =>
        draftIds.has(id),
      );
      if (!involved) return;
      const index = draftGrants.findIndex((g) => g.grantId === involved);
      const path = `grants[${index}]`;
      if (f.outcome === 'BLOCKED') {
        errors.push({
          code: 'SOD_CONFLICT_BLOCKED',
          path,
          message: sodMessage(f),
        });
      } else if (f.outcome === 'EXCEPTION_REQUIRED') {
        errors.push({
          code: 'SOD_EXCEPTION_REQUIRED',
          path,
          message: sodMessage(f),
        });
      } else if (f.outcome === 'WARNING') {
        warnings.push({ code: 'SOD_WARN', path, message: sodMessage(f) });
      }
    });

    const beforeAtoms = effectiveAtoms(base.grants, now);
    const afterAtoms = effectiveAtoms(after, now);
    const score = privilegeDelta(beforeAtoms, afterAtoms);
    const fourEyes = this.fourEyesNeed(
      draft.templateCode,
      beforeAtoms,
      afterAtoms,
    );

    // Escenarios (con tope) y su evaluación antes y después, solo lectura.
    const autoCap = Math.max(
      0,
      Math.min(
        AUTO_SCENARIOS_MAX,
        SIMULATION_MAX_SCENARIOS - userScenarios.length,
      ),
    );
    const queries = await this.userQueries(tx, tenantId, userScenarios, now);
    let truncated = false;
    if (dto.autoScenarios !== false) {
      const auto = await this.autoQueries(
        tx,
        tenantId,
        [...base.grants, ...after],
        beforeAtoms,
        afterAtoms,
        now,
      );
      truncated = auto.length > autoCap;
      queries.push(...auto.slice(0, autoCap));
    }
    const results: ScenarioResult[] = [];
    for (const q of queries) {
      const when = q.context.now ?? now;
      const b = await this.runQuery(
        tx,
        tenantId,
        record.userId,
        currentFacts,
        q,
        when,
        {},
      );
      const a = await this.runQuery(
        tx,
        tenantId,
        record.userId,
        afterFacts,
        q,
        when,
        {},
      );
      const before = scenarioDecision(b);
      const afterD = scenarioDecision(a);
      results.push({
        label: q.label ?? q.action,
        change: classifyChange(before, afterD),
        before,
        after: afterD,
      });
    }
    const impact = summarizeImpact(results.map((r) => r.change));
    const valid = errors.length === 0;
    return {
      valid,
      validation: { errors, warnings },
      governance: {
        sodFindings: sodFindings.map((f) => ({
          ruleCode: f.ruleCode,
          action: f.action,
          atoms: [...f.atomsA, ...f.atomsB],
          message: sodMessage(f),
        })),
        needsFourEyes: fourEyes,
        privilegeScore: {
          before: score.before,
          after: score.after,
          delta: score.delta,
        },
      },
      summary: {
        plain: draftGrants.map((g) =>
          describeGrant({
            atoms: g.actions,
            effect: g.effect,
            condition: g.condition,
          }),
        ),
        changes: changeLines(beforeAtoms, afterAtoms),
      },
      scenarios: results,
      impact: {
        ...impact,
        doctorsCovered: {
          before: distinct(base.grants, 'practitionerProfileId'),
          after: distinct(after, 'practitionerProfileId'),
        },
        servicesCovered: {
          before: distinct(base.grants, 'healthcareServiceId'),
          after: distinct(after, 'healthcareServiceId'),
        },
        spacesCovered: {
          before: distinct(base.grants, 'careSpaceId'),
          after: distinct(after, 'careSpaceId'),
        },
        effectiveAtoms: {
          added: afterAtoms.filter((a) => !beforeAtoms.includes(a)),
          removed: beforeAtoms.filter((a) => !afterAtoms.includes(a)),
        },
      },
      simulationToken: valid
        ? simulationTokenOf(dto.engagementId, draft, now)
        : (undefined as never),
      limits: { scenarioCount: results.length, truncated },
      evaluatedAt: now.toISOString(),
    };
  }

  /** Explica UNA pregunta sobre un vínculo ya resuelto. */
  private async explainOne(
    tx: EntityManager,
    tenantId: string,
    record: EngagementRecord,
    dto: ExplainAccessDto,
    view: AdminView,
    mode: ExplainMode,
  ): Promise<ExplainResponse> {
    const now = dto.at ? new Date(dto.at) : new Date();
    const engagements = await this.policy.loadFacts(tx, [record]);
    // Un delegado solo explica a personas de su alcance; si no, 404 uniforme.
    if (!view.full) {
      const [person] = await this.people.load(tx, tenantId, {
        engagementIds: [record.assignment.id],
      });
      if (!this.gate.manages(view, person?.grants ?? [])) throw this.notFound();
    }
    const query = await this.resolveQuery(tx, tenantId, dto, now, dto.assume);
    const assume = dto.assume ?? {};
    const result = await this.runQuery(
      tx,
      tenantId,
      record.userId,
      engagements,
      query,
      now,
      assume,
      mode.requestContext,
    );
    const atom = primaryAtomOf(String(dto.action));
    const out = buildExplainResponse(result, {
      who: mode.self ? 'Usted' : 'La persona',
      at: now,
      atom,
      reasonProvided:
        assume.reasonProvided === true || !!query.context.proof?.reasonText,
      stepUpFresh: assume.stepUpFresh === true,
    });
    this.logger.info(
      {
        operation: 'delegated_access.access.explain',
        tenantId,
        engagementId: record.assignment.id,
        atom,
        effect: out.decision.effect,
      },
      'Access explained',
    );
    return out;
  }

  /** Corre el motor sin efectos con los hechos del PIP (y los supuestos, solo aquí). */
  private async runQuery(
    tx: EntityManager,
    tenantId: string,
    userId: string,
    engagements: readonly EngagementFacts[],
    query: ResolvedQuery,
    now: Date,
    assume: NonNullable<ExplainAccessDto['assume']>,
    requestContext = false,
  ): Promise<SupportEvaluationResult> {
    const rules = await this.pipeline.rulesFor(tx, tenantId, now);
    const atom = primaryAtomOf(String(query.action));
    const conditions = this.loader.conditionsOf(
      grantConditions(engagements),
      rules,
    );
    const demand = this.loader.demandOf(conditions, atom);
    const zone = demand.hasConditions
      ? await this.loader.timeZoneOf(tx, tenantId)
      : undefined;
    const request = requestContext ? getAuditRequestContext() : undefined;
    const context: SupportAccessContext = {
      ...query.context,
      now,
      peek: true,
      ...(request?.ip ? { ip: request.ip } : {}),
      ...(request?.sessionId ? { sessionId: request.sessionId } : {}),
      ...(request?.deviceId !== undefined
        ? { deviceId: request.deviceId }
        : {}),
    };
    const engineQuery: SupportAccessQuery = {
      action: query.action as never,
      practitionerProfileId: query.practitionerProfileId,
      practitionerRoleAssignmentIds: query.practitionerRoleAssignmentIds,
      healthcareServiceId: query.healthcareServiceId,
      careSpaceId: query.careSpaceId,
      careSpacePath: query.careSpacePath,
      careSpaceSiteId: query.careSpaceSiteId,
      context,
    };
    const evaluation = await this.loader.evaluate<SupportEvaluationResult>(
      {
        em: tx,
        tenantId,
        userId,
        practitionerProfileId: query.practitionerProfileId,
        context,
        now,
        demand,
      },
      zone,
      (facts) =>
        evaluateSupportAccessV2(engagements, engineQuery, now, {
          facts: withAssumptions(facts, assume),
          rules,
          ...(zone ? { timeZone: zone } : {}),
        }),
    );
    return evaluation.result;
  }

  /** Resuelve doctor, servicio y espacio de la pregunta; uno ajeno a la organización es 404. */
  private async resolveQuery(
    tx: EntityManager,
    tenantId: string,
    q: {
      action: string;
      practitionerRoleAssignmentId?: string | null;
      healthcareServiceId?: string | null;
      careSpaceId?: string | null;
      patientProfileId?: string;
      appointmentStartAt?: string;
      amount?: SimulationScenario['amount'];
      label?: string;
    },
    now: Date,
    assume?: ExplainAccessDto['assume'],
  ): Promise<ResolvedQuery> {
    let practitionerProfileId: string | undefined;
    let roleIds: string[] | undefined;
    if (q.practitionerRoleAssignmentId) {
      const roles = await this.access.findRoleAssignments(tx, [
        q.practitionerRoleAssignmentId,
      ]);
      const role = roles.get(q.practitionerRoleAssignmentId);
      if (!role || role.tenantId !== tenantId) throw this.notFound();
      practitionerProfileId = role.practitionerProfileId;
      roleIds = [role.id];
    }
    if (q.healthcareServiceId) {
      const found = (
        await this.access.findServices(tx, [q.healthcareServiceId])
      ).get(q.healthcareServiceId);
      if (!found || found.tenantId !== tenantId) throw this.notFound();
    }
    let careSpacePath: string | undefined;
    let careSpaceSiteId: string | undefined;
    if (q.careSpaceId) {
      const space = (await this.access.findCareSpaces(tx, [q.careSpaceId])).get(
        q.careSpaceId,
      );
      if (!space || space.tenantId !== tenantId) throw this.notFound();
      careSpacePath = space.locationPath;
      careSpaceSiteId = space.practiceSiteId;
    }
    // SEG A-B7/B-B4: el paciente de la pregunta tiene que tener relación con la
    // organización; si no, 404 uniforme igual que un doctor o espacio ajeno. Sin
    // esto «explicar» devolvía en `unmet` edad, cobertura o banderas de cualquier
    // UUID de paciente de la plataforma (oráculo para cualquier persona con vínculo).
    if (
      q.patientProfileId &&
      !(await isPatientLinkedToTenant(tx, tenantId, q.patientProfileId))
    ) {
      throw this.notFound();
    }
    return {
      ...(q.label ? { label: q.label } : {}),
      action: q.action,
      practitionerProfileId,
      practitionerRoleAssignmentIds: roleIds,
      healthcareServiceId: q.healthcareServiceId ?? undefined,
      careSpaceId: q.careSpaceId ?? undefined,
      careSpacePath,
      careSpaceSiteId,
      context: {
        now,
        peek: true,
        ...(q.patientProfileId ? { patientProfileId: q.patientProfileId } : {}),
        ...(q.appointmentStartAt
          ? { appointmentStartAt: new Date(q.appointmentStartAt) }
          : {}),
        ...(q.amount ? { amount: q.amount } : {}),
        ...(assume?.reasonProvided || assume?.approvalGranted
          ? {
              proof: {
                ...(assume.reasonProvided
                  ? { reasonText: ASSUMED_REASON }
                  : {}),
                ...(assume.approvalGranted
                  ? { approvalId: ASSUMED_APPROVAL_ID }
                  : {}),
              },
            }
          : {}),
      },
    };
  }

  /** Escenarios del cliente, resueltos contra la organización. */
  private async userQueries(
    tx: EntityManager,
    tenantId: string,
    scenarios: readonly SimulationScenario[],
    now: Date,
  ): Promise<ResolvedQuery[]> {
    const out: ResolvedQuery[] = [];
    for (const s of scenarios) {
      out.push(
        await this.resolveQuery(tx, tenantId, s, s.at ? new Date(s.at) : now),
      );
    }
    return out;
  }

  /**
   * Escenarios representativos: cada permiso del borrador (y del estado actual)
   * sobre cada objetivo que cubre sus concesiones, más el borde «fuera de
   * horario» (domingo de madrugada).
   */
  private async autoQueries(
    tx: EntityManager,
    tenantId: string,
    grants: readonly SupportGrantFacts[],
    beforeAtoms: readonly SupportAtomCode[],
    afterAtoms: readonly SupportAtomCode[],
    now: Date,
  ): Promise<ResolvedQuery[]> {
    const atoms = [...new Set([...beforeAtoms, ...afterAtoms])].sort();
    const targets = new Map<string, SupportGrantFacts>();
    for (const g of grants) {
      targets.set(
        `${g.practitionerProfileId ?? ''}|${g.healthcareServiceId ?? ''}|${g.careSpaceId ?? ''}|${g.practiceSiteId ?? ''}`,
        g,
      );
    }
    const spaceIds = [
      ...new Set(
        [...targets.values()]
          .map((g) => g.careSpaceId)
          .filter((x): x is string => !!x),
      ),
    ];
    const spaces: ReadonlyMap<string, CareSpaceInfo> =
      spaceIds.length > 0
        ? await this.access.findCareSpaces(tx, spaceIds)
        : new Map<string, CareSpaceInfo>();
    const sunday = new Date(now);
    sunday.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7));
    sunday.setUTCHours(7, 0, 0, 0);
    const out: ResolvedQuery[] = [];
    for (const atom of atoms) {
      const name = PERMISSION_ATOM_BY_CODE.get(atom)?.name ?? atom;
      for (const g of targets.values()) {
        const space = g.careSpaceId ? spaces.get(g.careSpaceId) : undefined;
        const base: ResolvedQuery = {
          action: atom,
          practitionerProfileId: g.practitionerProfileId,
          healthcareServiceId: g.healthcareServiceId,
          careSpaceId: g.careSpaceId,
          careSpacePath: space?.locationPath,
          careSpaceSiteId: space?.practiceSiteId ?? g.practiceSiteId,
          context: { now, peek: true },
        };
        out.push({ ...base, label: `${name}` });
        out.push({
          ...base,
          label: `${name} (domingo de madrugada)`,
          context: { now: sunday, peek: true },
        });
      }
    }
    return out;
  }

  /** ¿El cambio pide cuatro ojos? Mover de plantilla por el puntaje; permisos críticos nuevos siempre. */
  private fourEyesNeed(
    templateCode: string | null | undefined,
    before: readonly SupportAtomCode[],
    after: readonly SupportAtomCode[],
  ): { required: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (templateCode) {
      const move = moveRequiresFourEyes(before, after);
      if (move.reasons.includes('SCORE_INCREASE')) {
        reasons.push(
          'El cambio de rol sube más de 10 puntos los privilegios de la persona.',
        );
      }
      if (move.reasons.includes('NEW_HIGH_SENSITIVITY')) {
        reasons.push(
          'Aparecen permisos de sensibilidad alta o crítica que la persona no tenía.',
        );
      }
    }
    const newCritical = after.filter(
      (a) =>
        !before.includes(a) &&
        PERMISSION_ATOM_BY_CODE.get(a)?.sensitivity === 'CRITICAL',
    );
    if (newCritical.length > 0) {
      reasons.push(
        'Incluye permisos críticos nuevos: necesitan la aprobación de otra persona.',
      );
    }
    return { required: reasons.length > 0, reasons };
  }

  /** Alcance de quien pregunta: el primer átomo con el que el delegado tiene concesión. */
  private async viewFor(
    tx: EntityManager,
    actor: AuthenticatedUser,
    atoms: readonly SupportAtomCode[],
  ): Promise<AdminView> {
    let last: unknown;
    for (const atom of atoms) {
      try {
        return await this.gate.view(tx, actor, atom);
      } catch (err) {
        last = err;
      }
    }
    throw last;
  }

  /** El vínculo de la persona en la organización; ajeno o inexistente es 404 uniforme. */
  private async subject(
    tx: EntityManager,
    tenantId: string,
    dto: Pick<ExplainAccessDto, 'engagementId' | 'userId'>,
  ): Promise<EngagementRecord> {
    if (!dto.engagementId && !dto.userId) {
      throw governanceError(
        Reason.SIMULATION_NO_TARGET,
        'Indique la persona o su vínculo.',
      );
    }
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ...(dto.engagementId
        ? { ids: [dto.engagementId] }
        : { userId: dto.userId }),
    });
    const record = records[0];
    if (!record || record.tenantId !== tenantId) throw this.notFound();
    return record;
  }

  private async templateOf(
    tx: EntityManager,
    record: EngagementRecord,
  ): Promise<string | undefined> {
    const id = record.assignment.roleTemplateId;
    if (!id) return undefined;
    return (await this.templates.findById(tx, id))?.code;
  }

  /** Reglas `CEILING` activas de la organización. */
  private async ceilingRules(
    tx: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<OrgCeilingRule[]> {
    const rows = await this.rulesRepo.findActiveForTenant(tx, tenantId, now);
    return rows
      .filter(
        (r) =>
          r.ruleKindConceptId === DELEG.GOV_RULE_CEILING &&
          r.statusConceptId === CONCEPTS.STATE_ACTIVE,
      )
      .map((r) => ({
        id: r.id,
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
        ...(r.messageText ? { message: r.messageText } : {}),
      }));
  }

  private notFound(): Error {
    return governanceError(
      Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      'Vínculo de apoyo no encontrado.',
    );
  }
}

/** Condiciones que pueden intervenir (de los permisos y de sus átomos). */
function grantConditions(
  engagements: readonly EngagementFacts[],
): SupportCondition[] {
  const out: SupportCondition[] = [];
  for (const e of engagements) {
    for (const g of e.grants) {
      if (g.condition) out.push(g.condition);
      for (const a of g.atomGrants ?? [])
        if (a.condition) out.push(a.condition);
    }
  }
  return out;
}

/**
 * Hechos con los supuestos del «¿y si…?» aplicados SOLO en este cálculo. Un
 * `Proxy` conserva la carga perezosa: lo que no se supone se lee del PIP.
 */
function withAssumptions(
  facts: SupportAccessFacts | undefined,
  assume: NonNullable<ExplainAccessDto['assume']>,
): SupportAccessFacts | undefined {
  const overrides = new Map<PropertyKey, unknown>();
  if (assume.stepUpFresh !== undefined) {
    overrides.set('stepUpAgeMinutes', assume.stepUpFresh ? 0 : null);
    overrides.set('stepUpEnrolled', true);
  }
  if (assume.doctorOnline !== undefined)
    overrides.set('doctorOnline', assume.doctorOnline);
  if (overrides.size === 0) return facts;
  return new Proxy(facts ?? {}, {
    get: (target, key, receiver) =>
      overrides.has(key)
        ? overrides.get(key)
        : (Reflect.get(target, key, receiver) as unknown),
    has: (target, key) => overrides.has(key) || Reflect.has(target, key),
  });
}

function scenarioDecision(r: SupportEvaluationResult): ScenarioDecision {
  const d = r.decision;
  const unmet = (d.unmet ?? []).map((u) => u.key);
  return {
    effect: d.effect ?? (d.allowed ? 'PERMIT' : 'DENY'),
    allowed: d.allowed,
    reason: d.reason,
    ...(d.atom ? { atom: d.atom } : {}),
    ...(d.grantId ? { grantId: d.grantId } : {}),
    ...(unmet.length > 0 ? { unmet } : {}),
  };
}

function sodMessage(f: SodFinding): string {
  switch (f.outcome) {
    case 'BLOCKED':
      return `«${f.ruleName}»: estas funciones no pueden estar juntas en una persona.`;
    case 'EXCEPTION_REQUIRED':
      return `«${f.ruleName}»: estas funciones juntas necesitan una excepción aprobada.`;
    default:
      return `«${f.ruleName}»: conviene separar estas funciones (advertencia).`;
  }
}

function changeLines(
  before: readonly SupportAtomCode[],
  after: readonly SupportAtomCode[],
): string[] {
  const name = (a: string): string =>
    (PERMISSION_ATOM_BY_CODE.get(a)?.name ?? a).toLowerCase();
  const lines: string[] = [];
  const removed = before.filter((a) => !after.includes(a));
  const added = after.filter((a) => !before.includes(a));
  if (removed.length > 0)
    lines.push(`Dejará de poder: ${removed.map(name).join(', ')}.`);
  if (added.length > 0) lines.push(`Podrá: ${added.map(name).join(', ')}.`);
  return lines;
}

function distinct(
  grants: readonly SupportGrantFacts[],
  key: 'practitionerProfileId' | 'healthcareServiceId' | 'careSpaceId',
): number {
  return new Set(
    grants
      .filter((g) => g.effect !== 'DENY' && g.active)
      .map((g) => g[key])
      .filter((x): x is string => !!x),
  ).size;
}

/** «Pida a su administrador que …» a partir de lo que un administrador podría cambiar. */
function askAdminText(
  fixes: ReadonlyArray<{ type: string; message: string }>,
): string {
  const first = fixes[0];
  if (!first) return 'Pida a su administrador que revise sus permisos.';
  const map: Record<string, string> = {
    ADD_ATOM: 'le dé este permiso',
    WIDEN_COVERAGE: 'amplíe su permiso a esta agenda',
    RELAX_CONDITION: 'revise las condiciones de su permiso',
    ACCEPT_DOCTOR: 'consiga que el doctor lo acepte',
    REMOVE_DENY: 'revise la prohibición que le aplica',
  };
  return `Pida a su administrador que ${map[first.type] ?? 'revise sus permisos'}.`;
}
