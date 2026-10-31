import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  PERMISSION_ATOM_BY_CODE,
  PERMISSION_ATOM_BY_ID,
  SUPPORT_ACTION_BY_PERMISSION_ID,
  SUPPORT_TEMPLATE_CODES,
  TEMPLATE_CEILINGS,
  atomMatchesPattern,
  expandLegacy,
  permissionAtomId,
  type SupportAtomCode,
  type SupportTemplateCode,
} from '../domain';
import type {
  NormalizeEngagementPlanDto,
  NormalizeGrantPlanDto,
  NormalizeLegacyDto,
  NormalizeLegacyResponseDto,
  NormalizeObligationDto,
  NormalizeTighteningDto,
  RevertNormalizeDto,
  RevertNormalizeResponseDto,
} from '../dto';
import type { SupportScopeGrants } from '../entities';
import {
  GovernanceRulesRepository,
  RoleTemplatesRepository,
  SupportAccessRepository,
  SupportGrantsRepository,
} from '../repositories';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';

/** Átomo que hoy ya está implícito para todo vínculo con permisos por alias (§2.3 regla 3b). */
const IMPLICIT_ATOM: SupportAtomCode =
  'patients.clinical.request_temporary_access';
/** Átomos cuyo motivo ya se exige hoy (lo impone la ruta de agenda): no es una obligación nueva. */
const REASON_ALREADY_REQUIRED = new Set<string>([
  'agenda.appointment.cancel',
  'agenda.appointment.reschedule',
]);
/** Prefijo de un id de lote: un UUID válido que lleva el instante en su último grupo. */
const BATCH_PREFIX = '00000000-0000-4000-8000-';

/** Lote ↔ instante: el instante es lo que identifica las filas del lote. */
export function batchIdOf(at: Date): string {
  return `${BATCH_PREFIX}${at.getTime().toString(16).padStart(12, '0')}`;
}
/** Instante de un id de lote; `undefined` si no es de lote. */
export function batchInstantOf(batchId: string): Date | undefined {
  if (!batchId.startsWith(BATCH_PREFIX)) return undefined;
  const ms = parseInt(batchId.slice(BATCH_PREFIX.length), 16);
  return Number.isSafeInteger(ms) && ms > 0 ? new Date(ms) : undefined;
}

/** Trabajo pendiente de un permiso: lo que se inserta y lo que queda atrás. */
interface GrantWork {
  readonly grant: SupportScopeGrants;
  readonly aliasPermissionIds: ReadonlySet<string>;
  readonly addIds: readonly string[];
}

/**
 * Normalización de permisos heredados (CONTRATO-GOBIERNO §2.5, M2): los 15
 * códigos antiguos pasan a átomos, **sin cambiar lo que la persona puede hacer**
 * salvo lo que el simulacro (`dryRun`, por defecto) informa:
 *
 * - las obligaciones que empezarían a regir (motivo, paso extra, aprobación)
 *   porque el átomo, escrito como átomo, se evalúa con todo;
 * - el acceso temporal que hoy es implícito (`patients.clinical.request_temporary_access`):
 *   se agrega si el techo lo admite; si no es un **estrechamiento** que el
 *   administrador debe reconocer (`acknowledgeTightening`).
 *
 * Al aplicar se insertan las filas de átomos y las filas alias quedan
 * `superseded_at` (no se borran); un lote se revierte entero. Aplicar y revertir
 * exigen el paso extra.
 */
@Injectable()
export class LegacyNormalizationService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Vínculos y permisos con acciones.
   * @param grants - Permisos y sus acciones (escritura).
   * @param templates - Plantillas de rol.
   * @param rulesRepo - Reglas `CEILING` de la organización.
   * @param stepUp - Paso extra de la sesión.
   * @param audit - Cadena de auditoría.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly rulesRepo: GovernanceRulesRepository,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly audit: AuditTrailService,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LegacyNormalizationService.name);
  }

  /**
   * Simula o aplica la normalización (`POST /org/governance/normalize-legacy`).
   *
   * @param dto - `dryRun` (por defecto `true`), vínculos y reconocimiento del estrechamiento.
   * @param actor - Quien la pide (paso extra al aplicar).
   * @returns El plan por vínculo; con `dryRun: false`, el `batchId` para revertir.
   */
  async normalize(
    dto: NormalizeLegacyDto,
    actor: AuthenticatedUser,
  ): Promise<NormalizeLegacyResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const dryRun = dto.dryRun !== false;
    if (dryRun) {
      const plan = await this.plan(
        this.em.fork({ keepTransactionContext: true }),
        tenantId,
        dto.engagementIds,
      );
      return this.response(true, undefined, plan);
    }
    this.logger.info(
      {
        operation: 'delegated_access.normalize_legacy.apply',
        tenantId,
        actorId: actor.id,
      },
      'Normalizing legacy support grants',
    );
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const plan = await this.plan(tx, tenantId, dto.engagementIds);
      const tightening = plan.engagements.flatMap((e) => e.tightening);
      if (tightening.length > 0 && dto.acknowledgeTightening !== true) {
        throw governanceError(
          Reason.NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED,
          'Al normalizar, alguien dejará de poder hacer algo que hoy hace sin pedirlo. Revise la lista y confirme.',
          { tightening },
        );
      }
      const batchAt = new Date();
      const batchId = batchIdOf(batchAt);
      for (const work of plan.work) {
        const live = await this.grants.findLiveActions(tx, work.grant.id);
        if (work.addIds.length > 0) {
          this.grants.addActionsAt(tx, work.grant, work.addIds, batchAt);
        }
        this.grants.markSuperseded(
          live.filter((row) => work.aliasPermissionIds.has(row.permissionId)),
          batchAt,
          actor.id,
        );
      }
      await tx.flush();
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType: 'delegated_access.grant.normalized',
        aggregateType: 'normalization_batch',
        aggregateId: batchId,
        payloadJson: {
          batchId,
          tenantId,
          grantCount: plan.work.length,
          engagementCount: plan.engagements.length,
        },
        actorUserId: actor.id,
      });
      await this.audit.record(tx, actor, {
        action: 'SUPPORT_GRANT_NORMALIZED',
        entity: 'support_scope_grant',
        entityId: batchId,
        tenantId,
        success: true,
      });
      return this.response(false, batchId, plan);
    });
  }

  /**
   * Revierte un lote (`POST /org/governance/normalize-legacy/revert`): quita las
   * filas de átomo que insertó y limpia `superseded_at` de las alias.
   *
   * @param dto - Lote a revertir.
   * @param actor - Quien lo revierte (paso extra obligatorio).
   * @returns Cuántas filas se restauraron y se quitaron.
   */
  async revert(
    dto: RevertNormalizeDto,
    actor: AuthenticatedUser,
  ): Promise<RevertNormalizeResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const batchAt = batchInstantOf(dto.batchId);
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      const superseded = batchAt
        ? await this.grants.findSupersededAt(tx, tenantId, batchAt)
        : [];
      if (!batchAt || superseded.length === 0) {
        // Un lote que ya se revirtió deja el rastro de su reversión en la cadena
        // de auditoría: se distingue de uno que nunca existió.
        if (
          batchAt &&
          (await this.grants.wasBatchReverted(tx, tenantId, dto.batchId))
        ) {
          throw governanceError(
            Reason.NORMALIZE_BATCH_ALREADY_REVERTED,
            'Ese lote ya se revirtió: no queda nada por deshacer.',
          );
        }
        throw governanceError(
          Reason.NORMALIZE_BATCH_NOT_FOUND,
          'No hay nada que revertir para ese lote: no existe.',
        );
      }
      const grantIds = [
        ...new Set(superseded.map((r) => r.supportScopeGrantId)),
      ];
      const created = (
        await this.grants.findCreatedAt(tx, tenantId, grantIds, batchAt)
      ).filter((row) => PERMISSION_ATOM_BY_ID.has(row.permissionId));
      this.grants.clearSuperseded(superseded, new Date(), actor.id);
      this.grants.removeActions(tx, created);
      await tx.flush();
      await this.audit.record(tx, actor, {
        action: 'SUPPORT_GRANT_NORMALIZE_REVERTED',
        entity: 'support_scope_grant',
        entityId: dto.batchId,
        tenantId,
        success: true,
      });
      return {
        batchId: dto.batchId,
        restoredAliasRows: superseded.length,
        removedAtomRows: created.length,
      };
    });
  }

  /** Plan por vínculo: qué se inserta, qué obligaciones empiezan y qué se estrecha. */
  private async plan(
    tx: EntityManager,
    tenantId: string,
    engagementIds?: readonly string[],
  ): Promise<{ engagements: NormalizeEngagementPlanDto[]; work: GrantWork[] }> {
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ...(engagementIds && engagementIds.length > 0
        ? { ids: engagementIds }
        : {}),
    });
    const grantRows = await this.access.findGrantsWithActions(
      tx,
      records.map((r) => r.assignment.id),
    );
    const rules = (
      await this.rulesRepo.findActiveForTenant(tx, tenantId, new Date())
    ).filter(
      (r) =>
        r.ruleKindConceptId === DELEG.GOV_RULE_CEILING &&
        r.statusConceptId === CONCEPTS.STATE_ACTIVE,
    );
    const engagements: NormalizeEngagementPlanDto[] = [];
    const work: GrantWork[] = [];
    for (const record of [...records].sort((a, b) =>
      a.assignment.id.localeCompare(b.assignment.id),
    )) {
      const code = record.assignment.roleTemplateId
        ? (await this.templates.findById(tx, record.assignment.roleTemplateId))
            ?.code
        : undefined;
      const rows = grantRows
        .filter(
          (g) =>
            g.grant.organizationUserAssignmentId === record.assignment.id &&
            g.grant.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE,
        )
        .sort(
          (a, b) =>
            a.grant.createdAt.getTime() - b.grant.createdAt.getTime() ||
            a.grant.id.localeCompare(b.grant.id),
        );
      const atomRowCodes = new Set<string>();
      for (const g of rows) {
        for (const a of g.actions) {
          const atom = !a.supersededAt
            ? PERMISSION_ATOM_BY_ID.get(a.permissionId)
            : undefined;
          if (atom) atomRowCodes.add(atom.code);
        }
      }
      const allowedByCeiling = (atom: SupportAtomCode): boolean => {
        const platform = (SUPPORT_TEMPLATE_CODES as readonly string[]).includes(
          code ?? '',
        )
          ? (
              TEMPLATE_CEILINGS[
                code as SupportTemplateCode
              ] as readonly string[]
            ).includes(atom)
          : true;
        const blocked = rules.some(
          (r) =>
            (!r.roleTemplateCode || r.roleTemplateCode === code) &&
            atomMatchesPattern(atom, r.permissionPattern),
        );
        return platform && !blocked;
      };
      const grantPlans: NormalizeGrantPlanDto[] = [];
      let implicitPending = !atomRowCodes.has(IMPLICIT_ATOM);
      const tightening: NormalizeTighteningDto[] = [];
      for (const g of rows) {
        const live = g.actions.filter((a) => !a.supersededAt);
        const aliasCodes = live
          .map((a) => SUPPORT_ACTION_BY_PERMISSION_ID.get(a.permissionId))
          .filter((c): c is NonNullable<typeof c> => !!c);
        if (aliasCodes.length === 0) continue;
        const ownAtoms = live
          .map((a) => PERMISSION_ATOM_BY_ID.get(a.permissionId)?.code)
          .filter((c): c is SupportAtomCode => !!c);
        const fromAliases = [
          ...new Set(aliasCodes.flatMap((c) => [...expandLegacy(c)])),
        ];
        const before = [...new Set([...fromAliases, ...ownAtoms])].sort();
        const added = fromAliases.filter((a) => !ownAtoms.includes(a));
        if (implicitPending) {
          implicitPending = false;
          if (allowedByCeiling(IMPLICIT_ATOM)) {
            if (!before.includes(IMPLICIT_ATOM)) added.push(IMPLICIT_ATOM);
          } else {
            tightening.push({
              engagementId: record.assignment.id,
              atom: IMPLICIT_ATOM,
              message:
                'La persona dejará de poder pedir acceso clínico temporal a un paciente: su plantilla no lo admite como permiso propio.',
            });
          }
        }
        const addedSorted = [...new Set(added)].sort();
        grantPlans.push({
          grantId: g.grant.id,
          aliases: [...new Set(aliasCodes)].sort(),
          atomsBefore: before,
          atomsAfter: [...new Set([...before, ...addedSorted])].sort(),
          atomsAdded: addedSorted,
          newObligations: addedSorted
            .map(obligationOf)
            .filter((o): o is NormalizeObligationDto => !!o),
        });
        work.push({
          grant: g.grant,
          aliasPermissionIds: new Set(
            live
              .filter((a) =>
                SUPPORT_ACTION_BY_PERMISSION_ID.has(a.permissionId),
              )
              .map((a) => a.permissionId),
          ),
          addIds: addedSorted.map((a) => permissionAtomId(a)),
        });
      }
      if (grantPlans.length === 0) continue;
      engagements.push({
        engagementId: record.assignment.id,
        userId: record.userId,
        ...(code ? { templateCode: code } : {}),
        grants: grantPlans,
        tightening,
      });
    }
    return { engagements, work };
  }

  private response(
    dryRun: boolean,
    batchId: string | undefined,
    plan: { engagements: NormalizeEngagementPlanDto[]; work: GrantWork[] },
  ): NormalizeLegacyResponseDto {
    const grants = plan.engagements.flatMap((e) => e.grants);
    const tightening = plan.engagements.flatMap((e) => e.tightening);
    return {
      dryRun,
      ...(batchId ? { batchId } : {}),
      engagements: plan.engagements,
      totals: {
        engagements: plan.engagements.length,
        grants: grants.length,
        atomRows: grants.reduce((n, g) => n + g.atomsAdded.length, 0),
        obligations: grants.reduce((n, g) => n + g.newObligations.length, 0),
        tightening: tightening.length,
      },
      requiresAcknowledgement: tightening.length > 0,
    };
  }
}

/** Lo que empieza a exigir un átomo escrito como átomo, en lenguaje simple. */
function obligationOf(
  atom: SupportAtomCode,
): NormalizeObligationDto | undefined {
  const meta = PERMISSION_ATOM_BY_CODE.get(atom);
  if (!meta) return undefined;
  const reason = meta.requiresReason && !REASON_ALREADY_REQUIRED.has(atom);
  const stepUp = meta.requiresStepUp;
  const approval = meta.approvalMode;
  if (!reason && !stepUp && !approval) return undefined;
  const parts = [
    ...(reason ? ['escribir un motivo'] : []),
    ...(stepUp ? ['confirmar su identidad con el segundo paso'] : []),
    ...(approval === 'DOCTOR' ? ['la aprobación del doctor'] : []),
    ...(approval === 'SECOND_APPROVER'
      ? ['la aprobación de otro administrador']
      : []),
  ];
  return {
    atom,
    requiresReason: reason,
    requiresStepUp: stepUp,
    approval: approval ?? null,
    message: `Para «${meta.name}» la persona pasará a necesitar: ${parts.join(', ')}.`,
  };
}
