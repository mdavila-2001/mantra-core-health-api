import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import type {
  FourEyesRequests,
  OrganizationUserAssignments,
  SupportScopeGrants,
} from '../entities';
import {
  RECERTIFICATION_GRACE_DAYS,
  PERMISSION_ATOM_BY_ID,
  checkSelfAdmin,
  criticalApprovalNeed,
  targetAfterExpansionChange,
  type CriticalApprovalNeed,
  type GrantTargetFacts,
  type SupportTargetKind,
} from '../domain';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { DIR } from '../../directory/directory.concepts';
import type {
  ConfirmedSupportEngagementViewDto,
  CreateSupportGrantDto,
  EndEngagementDto,
  ListSupportEngagementsResponseDto,
  OperationResultDto,
  RecertifyEngagementDto,
  ResourceCreatedDto,
  SupportEngagementViewDto,
  SupportGrantViewDto,
  UpdateSupportGrantDto,
  GrantChangeDetailsDto,
  GrantChangePendingDto,
} from '../dto';
import {
  DelegationEventsRepository,
  EngagementRequestsRepository,
  RoleTemplatesRepository,
  SupportAccessRepository,
  SupportActivityRepository,
  SupportEngagementsRepository,
  SupportGrantsRepository,
  type EngagementRecord,
  type SupportGrantActionInput,
} from '../repositories';
import { RecertificationReviewLink } from './access-review-recertification.link';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { FourEyesService } from './four-eyes.service';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import { addMonths } from './engagement-requests.service';
import {
  EXPANSION_CONCEPT,
  TARGET_KIND_BY_CONCEPT,
  TARGET_KIND_CONCEPT,
  actionsOfPermissionIds,
  supportActionInputsOfPermissionIds,
} from './support-grant-facts';
import { SupportTargetsService } from './support-targets.service';
import {
  SupportAdminDirectory,
  type LiveGrantView,
} from './support-admin-directory';
import { TeamAdminPolicy } from './team-admin.policy';
import { SupportGrantWriteGuard } from './support-grant-write.guard';
import { criticalAtomsOf } from './support-critical-atoms';
import {
  grantChangeDetails,
  type CurrentGrantFacts,
} from './grant-change.details';
import { permissionIdOfInput } from './support-permission-input';
import { verifySimulationToken } from './access-explain.support';
import { governanceError } from './governance-errors';
import { GovernanceAudit } from './governance-audit';
import { AUTHZ } from '../../authz/authz.concepts';
import { withPersonScope } from './tenant-context';

/** Plazo para confirmar la recertificación antes de suspender el vínculo. */
export { RECERTIFICATION_GRACE_DAYS };
/** Marca de suspensión por recertificación sin confirmar. */
export const RECERT_LAPSED_MARKER = 'RECERTIFICATION_LAPSED';
const DAY_MS = 24 * 3600 * 1000;
/** Átomo con el que un administrador delegado otorga permisos (su alcance y techo). */
const ASSIGN_ATOM = 'team.grants.assign';

const STATUS_CODE: Readonly<Record<string, string>> = {
  [STATUS.ACTIVE]: 'ACTIVE',
  [STATUS.SUSPENDED]: 'SUSPENDED',
  [STATUS.REVOKED]: 'REVOKED',
  [STATUS.EXPIRED]: 'EXPIRED',
};
const GRANT_STATUS_CODE: Readonly<Record<string, string>> = {
  [DELEG.SUPPORT_GRANT_ACTIVE]: 'ACTIVE',
  [DELEG.SUPPORT_GRANT_SUSPENDED]: 'SUSPENDED',
  [DELEG.SUPPORT_GRANT_REVOKED]: 'REVOKED',
  [DELEG.SUPPORT_GRANT_EXPIRED]: 'EXPIRED',
};
const ORIGIN_CODE: Readonly<Record<string, string>> = {
  [DELEG.ENGAGEMENT_ORIGIN_REQUEST]: 'REQUEST',
  [DELEG.ENGAGEMENT_ORIGIN_INVITATION]: 'INVITATION',
  [DELEG.ENGAGEMENT_ORIGIN_QR]: 'QR',
};
const OWNER_KIND_CODE: Readonly<Record<string, string>> = {
  [DELEG.OWNER_KIND_ORGANIZATION]: 'ORGANIZATION',
  [DELEG.OWNER_KIND_PRIVATE_PRACTICE]: 'PRIVATE_PRACTICE',
};
/** Asiento que deja la confirmación del vínculo por la propia persona. */
const CONFIRMED_BY_PERSON_ACTION = 'SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON';
/** Ventana en la que se busca la última actividad de una persona. */
const LAST_ACTIVITY_WINDOW_DAYS = 90;

/**
 * Vínculos de apoyo: permisos con sus acciones (alta, edición, baja),
 * recertificación y fin de vínculo. La organización decide solo sobre su
 * tenant; la persona solo ve lo suyo.
 */
@Injectable()
export class SupportEngagementsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos y permisos.
   * @param engagements - Escrituras del vínculo.
   * @param grants - Permisos de apoyo.
   * @param requests - Solicitudes de vínculo.
   * @param templates - Plantillas de rol.
   * @param events - Ledger de delegación.
   * @param targets - Validación de objetivos contra el tenant.
   * @param effective - Acceso efectivo derivado.
   * @param scope - Política común de tenant.
   * @param logger - Logger estructurado.
   * @param activity - Nombres y actividad que acompañan a la vista.
   * @param stepUp - Paso extra: otorgar o ampliar lo exige por cualquier ruta; opcional (suites anteriores al gobierno).
   * @param fourEyes - Cuatro ojos: agregar un átomo CRÍTICA pide la aprobación de otra persona (`GRANT_CHANGE`); opcional.
   * @param policy - Alcance y techo del administrador: mide el objetivo de lo que se escribe y revalida a quien pidió un cambio aprobado por cuatro ojos; opcional.
   * @param directory - Permisos vivos de la persona (lo ya concedido, por átomo y objetivo); opcional.
   * @param reviewLink - Une la recertificación con las campañas de certificación (cierra el ítem de vínculo abierto y fija `last_certified_at`); opcional.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly requests: EngagementRequestsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly events: DelegationEventsRepository,
    private readonly targets: SupportTargetsService,
    private readonly effective: EffectiveSupportAccessService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
    private readonly activity: SupportActivityRepository,
    @Optional() private readonly reviewLink?: RecertificationReviewLink,
    @Optional() private readonly writeGuard?: SupportGrantWriteGuard,
    @Optional() private readonly audit?: GovernanceAudit,
    @Optional() private readonly stepUp?: GovernanceStepUpGate,
    @Optional() private readonly fourEyes?: FourEyesService,
    @Optional() private readonly policy?: TeamAdminPolicy,
    @Optional() private readonly directory?: SupportAdminDirectory,
  ) {
    this.logger.setContext(SupportEngagementsService.name);
  }

  /**
   * Vínculos de apoyo de la organización activa.
   *
   * @returns Los vínculos con sus permisos.
   */
  async listForTenant(): Promise<ListSupportEngagementsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    // Con RLS la petición ya corre en una transacción con su organización: el
    // fork la conserva para que las lecturas crudas vean ese contexto.
    const tx = this.em.fork({ keepTransactionContext: true });
    const records = await this.access.findEngagements(tx, { tenantId });
    const items = await this.toViews(tx, records);
    return { items, count: items.length };
  }

  /**
   * Vínculos de apoyo de la persona, en todas sus organizaciones.
   *
   * @param userId - Persona.
   * @returns Sus vínculos con permisos.
   */
  async listMine(userId: string): Promise<ListSupportEngagementsResponseDto> {
    return withPersonScope(this.em, async (tx, scope) => {
      // Sin organización activa: los vínculos se buscan por la persona, y los
      // permisos de cada uno se leen dentro de su organización.
      const records = await scope.ownRows(() =>
        this.access.findEngagements(tx, { userId }),
      );
      const viewOf = new Map<string, SupportEngagementViewDto>();
      for (const tenantId of new Set(records.map((r) => r.tenantId))) {
        const here = records.filter((r) => r.tenantId === tenantId);
        const views = await scope.inTenant(tenantId, () =>
          this.toViews(tx, here),
        );
        here.forEach((record, index) =>
          viewOf.set(record.assignment.id, views[index]),
        );
      }
      const items = records.map((r) => viewOf.get(r.assignment.id)!);
      return { items, count: items.length };
    });
  }

  /**
   * Permisos de un vínculo de la organización activa.
   *
   * @param engagementId - Vínculo.
   * @returns Sus permisos con acciones.
   */
  async listGrants(engagementId: string): Promise<SupportGrantViewDto[]> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    await this.loadInTenant(tx, engagementId, tenantId);
    const [only] = await this.grantViews(tx, [engagementId]);
    return only?.grants ?? [];
  }

  /**
   * Alta de un permiso en un vínculo activo. Si el permiso agrega un átomo
   * CRÍTICA que la persona no tenía, no se escribe: se pide la aprobación de
   * otra persona (`GRANT_CHANGE`, cuatro ojos) y se responde `PENDING_APPROVAL`
   * (la ruta contesta 202).
   *
   * @param engagementId - Vínculo.
   * @param dto - Objetivo, acciones, modo de expansión y vigencia.
   * @param actor - Quien lo otorga.
   * @returns El permiso creado, o la solicitud de aprobación pendiente.
   */
  async addGrant(
    engagementId: string,
    dto: CreateSupportGrantDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto | GrantChangePendingDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.support_grant.create',
        engagementId,
        tenantId,
        actorId: actor.id,
      },
      'Adding support grant',
    );
    return this.em.transactional(async (tx) => {
      // Otorgar exige el paso extra por CUALQUIER ruta; una prohibición solo restringe.
      if (dto.effect !== 'DENY') await this.stepUp?.assertFresh(tx, actor);
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      this.assertActive(record);
      await this.targets.assertTarget(tx, tenantId, dto.targetKind, dto);
      await this.assertWritable(
        tx,
        record,
        tenantId,
        actor,
        engagementId,
        addWrite(dto),
      );
      const pending = await this.requestCriticalApproval(tx, {
        tenantId,
        actor,
        record,
        effect: dto.effect,
        proposal: async (held) => ({
          atoms: criticalAtomsOf(dto.actions),
          target: {
            ...(await this.targetOf(tx, dto)),
            expansionMode: dto.expansionMode ?? 'DYNAMIC',
          },
          validTo: dto.validTo ? new Date(dto.validTo) : undefined,
          held,
        }),
        payload: {
          op: 'ADD',
          engagementId,
          assignmentRowVersion: record.assignment.rowVersion,
          grant: addPayloadGrant(dto),
        },
      });
      if (pending) return pending;
      return this.insertGrant(tx, tenantId, record, dto, {
        actor,
        actorUserId: actor.id,
        approvedByUserId: actor.id,
      });
    });
  }

  /**
   * Edita las acciones o la vigencia de un permiso, o lo da de baja. Agregarle
   * un átomo CRÍTICA que la persona no tenía pasa por cuatro ojos como el alta.
   *
   * @param engagementId - Vínculo.
   * @param dto - Permiso y cambios.
   * @param actor - Quien lo cambia.
   * @returns `{ ok: true }`, o la solicitud de aprobación pendiente.
   */
  async updateGrant(
    engagementId: string,
    dto: UpdateSupportGrantDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto | GrantChangePendingDto> {
    const tenantId = this.scope.resolveTenant();
    if (
      !dto.revoke &&
      !dto.actions &&
      !dto.condition &&
      !dto.actionConditions &&
      dto.validTo === undefined &&
      dto.expansionMode === undefined
    ) {
      throw new PreconditionFailedException('No hay cambios que aplicar');
    }
    return this.em.transactional(async (tx) => {
      // Todo cambio que no sea quitar puede ampliar (acciones, vigencia, alcance,
      // condiciones): pide el paso extra también por esta ruta.
      if (!dto.revoke) await this.stepUp?.assertFresh(tx, actor);
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      const grant = await this.grants.findById(tx, dto.grantId);
      if (!grant || grant.organizationUserAssignmentId !== engagementId) {
        throw new ResourceNotFoundException(
          'Permiso no encontrado',
          undefined,
          Reason.SUPPORT_GRANT_NOT_FOUND,
        );
      }
      if (!dto.revoke) {
        this.assertActive(record);
        await this.validateUpdate(
          tx,
          record,
          grant,
          tenantId,
          actor,
          engagementId,
          dto,
        );
        const { grantId: _id, simulationToken: _token, ...change } = dto;
        const pending = await this.requestCriticalApproval(tx, {
          tenantId,
          actor,
          record,
          effect:
            grant.effectConceptId === AUTHZ.EFFECT_DENY ? 'DENY' : 'ALLOW',
          proposal: (held, views) =>
            this.updateProposal(tx, grant, dto, held, views),
          payload: {
            op: 'UPDATE',
            engagementId,
            grantId: grant.id,
            assignmentRowVersion: record.assignment.rowVersion,
            change: canonicalChange(change),
          },
        });
        if (pending) return pending;
      }
      await this.applyUpdate(tx, tenantId, record, grant, dto, actor);
      return { ok: true };
    });
  }

  /**
   * Ejecuta un cambio de permisos aprobado por cuatro ojos (`GRANT_CHANGE`)
   * DENTRO de la transacción de la aprobación: vuelve a validar todo con el
   * guardián (barandillas, SoD, condiciones) y comprueba que el vínculo no
   * cambió desde que se pidió. Si ya no vale, 409 `FOUR_EYES_PAYLOAD_INVALID` y
   * la solicitud sigue pendiente para que se rechace.
   *
   * @param tx - Transacción de la aprobación.
   * @param tenantId - Organización de la solicitud.
   * @param payload - Cuerpo firmado.
   * @param requesterUserId - Quien pidió.
   * @param approver - Quien aprobó.
   * @returns Identificadores de lo escrito.
   */
  async executeApprovedGrantChange(
    tx: EntityManager,
    tenantId: string,
    payload: GrantChangePayload,
    requesterUserId: string,
    approver: AuthenticatedUser,
  ): Promise<{ grantId: string; op: 'ADD' | 'UPDATE' }> {
    const invalid = (message: string): Error =>
      governanceError(Reason.FOUR_EYES_PAYLOAD_INVALID, message);
    const [record] = await this.access.findEngagements(tx, {
      ids: [payload.engagementId],
      tenantId,
    });
    if (!record || record.assignment.statusConceptId !== STATUS.ACTIVE) {
      throw invalid('El vínculo ya no está activo.');
    }
    if (record.assignment.rowVersion !== payload.assignmentRowVersion) {
      throw invalid('El vínculo cambió desde que se pidió la aprobación.');
    }
    const who = {
      actor: approver,
      actorUserId: requesterUserId,
      approvedByUserId: approver.id,
    };
    try {
      await this.revalidateRequester(
        tx,
        tenantId,
        record,
        requesterUserId,
        payload,
        invalid,
      );
      if (payload.op === 'ADD') {
        const dto = dtoOfPayloadGrant(payload.grant);
        await this.targets.assertTarget(tx, tenantId, dto.targetKind, dto);
        await this.assertWritable(
          tx,
          record,
          tenantId,
          approver,
          payload.engagementId,
          addWrite(dto),
        );
        const created = await this.insertGrant(tx, tenantId, record, dto, who);
        await this.audit?.seal(
          tx,
          approver,
          tenantId,
          'SUPPORT_GRANT_CREATED',
          'support_scope_grant',
          created.id,
        );
        return { grantId: created.id, op: 'ADD' };
      }
      const grant = await this.grants.findById(tx, payload.grantId);
      if (
        !grant ||
        grant.organizationUserAssignmentId !== payload.engagementId
      ) {
        throw invalid('El permiso ya no existe.');
      }
      const dto = {
        grantId: grant.id,
        ...payload.change,
      } as UpdateSupportGrantDto;
      await this.validateUpdate(
        tx,
        record,
        grant,
        tenantId,
        approver,
        payload.engagementId,
        dto,
      );
      await this.applyUpdate(tx, tenantId, record, grant, dto, approver);
      await this.audit?.seal(
        tx,
        approver,
        tenantId,
        'SUPPORT_GRANT_UPDATED',
        'support_scope_grant',
        grant.id,
      );
      return { grantId: grant.id, op: 'UPDATE' };
    } catch (err) {
      if (
        (err as { reason?: string })?.reason ===
        Reason.FOUR_EYES_PAYLOAD_INVALID
      ) {
        throw err;
      }
      throw invalid('Lo aprobado ya no es válido.');
    }
  }

  /**
   * Lo que ve quien aprueba (N-1): por cada `GRANT_CHANGE`, el permiso completo
   * que se otorgaría —todos los átomos con los críticos marcados, el objetivo
   * por nombre (doctor, servicio, espacio), la vigencia y las condiciones—, sin
   * datos de pacientes. En una edición se arma sobre el permiso de hoy.
   *
   * @param tx - Transacción de la consulta del aprobador.
   * @param rows - Solicitudes `GRANT_CHANGE` que se le muestran.
   * @returns El detalle por id de solicitud; una solicitud ilegible no figura.
   */
  async describeGrantChanges(
    tx: EntityManager,
    rows: readonly Pick<FourEyesRequests, 'id' | 'payloadJson'>[],
  ): Promise<Map<string, GrantChangeDetailsDto>> {
    const payloads = rows.flatMap((row) => {
      const p = row.payloadJson as GrantChangePayload | undefined;
      return p && (p.op === 'ADD' || p.op === 'UPDATE')
        ? [{ id: row.id, payload: p }]
        : [];
    });
    const current = new Map<string, CurrentGrantFacts>();
    for (const { id, payload } of payloads) {
      if (payload.op !== 'UPDATE') continue;
      const grant = await this.grants.findById(tx, payload.grantId);
      if (!grant) continue;
      const live = await this.grants.findLiveActions(tx, grant.id);
      current.set(id, {
        targetKind: TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId],
        practitionerRoleAssignmentId: grant.practitionerRoleAssignmentId,
        healthcareServiceId: grant.healthcareServiceId,
        careSpaceId: grant.careSpaceId,
        practiceSiteId: grant.practiceSiteId,
        expansionMode:
          grant.expansionModeConceptId === EXPANSION_CONCEPT.FIXED
            ? 'FIXED'
            : 'DYNAMIC',
        actions: supportActionInputsOfPermissionIds(
          live.map((r) => r.permissionId),
        ),
        validFrom: grant.validFrom ?? undefined,
        validTo: grant.validTo ?? undefined,
        condition: grant.conditionJson ?? undefined,
        actionConditions: actionConditionsOf(live),
      });
    }
    const refs = (
      pick: (f: {
        practitionerRoleAssignmentId?: string;
        healthcareServiceId?: string;
        careSpaceId?: string;
        practiceSiteId?: string;
      }) => (string | undefined)[],
    ): string[] => [
      ...new Set(
        payloads
          .flatMap(({ id, payload }) =>
            pick(
              payload.op === 'ADD' ? payload.grant : (current.get(id) ?? {}),
            ),
          )
          .filter((v): v is string => !!v),
      ),
    ];
    const [doctors, services, locations] = await Promise.all([
      this.activity.doctorNamesByRoleAssignment(
        tx,
        refs((f) => [f.practitionerRoleAssignmentId]),
      ),
      this.activity.serviceNames(
        tx,
        refs((f) => [f.healthcareServiceId]),
      ),
      this.activity.locationNames(
        tx,
        refs((f) => [f.careSpaceId, f.practiceSiteId]),
      ),
    ]);
    const names = {
      doctors: new Map([...doctors].map(([id, d]) => [id, d.name])),
      services,
      locations,
    };
    return new Map(
      payloads.map(({ id, payload }) => [
        id,
        grantChangeDetails(payload, current.get(id), names),
      ]),
    );
  }

  /**
   * N-2: al ejecutar, quien PIDIÓ el cambio debe seguir pudiéndolo pedir HOY.
   * La aprobación llega hasta 7 días después; si en ese lapso el solicitante
   * dejó de ser administrador de seguridad (o delegado con el átomo, su alcance
   * y su techo) o perdió su membresía, lo aprobado ya no vale: 409
   * `FOUR_EYES_PAYLOAD_INVALID` y la solicitud sigue pendiente para rechazarla.
   * Sin la política inyectada (suites anteriores al gobierno) no revalida.
   */
  private async revalidateRequester(
    tx: EntityManager,
    tenantId: string,
    record: EngagementRecord,
    requesterUserId: string,
    payload: GrantChangePayload,
    invalid: (message: string) => Error,
  ): Promise<void> {
    if (!this.policy) return;
    const gone = (): Error =>
      invalid('Quien pidió el cambio ya no puede otorgarlo.');
    const now = new Date();
    if (checkSelfAdmin(requesterUserId, record.userId)) throw gone();
    let me: Awaited<ReturnType<TeamAdminPolicy['actorOfUser']>>;
    try {
      me = await this.policy.actorOfUser(
        tx,
        requesterUserId,
        tenantId,
        ASSIGN_ATOM,
        now,
      );
    } catch {
      throw gone();
    }
    if (me.full) return;
    // Un delegado: lo mismo que `TeamAdminService` le exige al pedirlo.
    try {
      await this.policy.assertUserNotPeer(tx, me, record.userId, tenantId, now);
      const template = record.assignment.roleTemplateId
        ? await this.templates.findById(tx, record.assignment.roleTemplateId)
        : null;
      let target: GrantTargetFacts;
      let atoms: readonly string[];
      let validTo: Date | undefined;
      if (payload.op === 'ADD') {
        const dto = dtoOfPayloadGrant(payload.grant);
        target = await this.policy.targetOf(tx, dto);
        atoms = dto.actions;
        validTo = dto.validTo ? new Date(dto.validTo) : undefined;
      } else {
        const own = (
          (await this.directory?.liveGrantsOf(tx, [record], now)) ?? []
        ).find((v) => v.grantId === payload.grantId);
        if (!own) throw gone();
        const change = payload.change as Partial<UpdateSupportGrantDto>;
        target = this.policy.resultingTarget(own, change.expansionMode);
        if (!this.policy.inScope(me, ASSIGN_ATOM, target)) throw gone();
        this.policy.assertConditionsNotLoosened(me, own, change);
        atoms = change.actions ?? own.atoms;
        validTo =
          change.validTo !== undefined ? new Date(change.validTo) : own.validTo;
      }
      await this.policy.assertGrantAllowed(tx, me, {
        tenantId,
        target,
        atoms,
        templateCode: template?.code ?? '',
        validTo,
        now,
      });
    } catch {
      throw gone();
    }
  }

  /**
   * Si lo que se va a escribir AMPLÍA un átomo CRÍTICA —lo da por primera vez,
   * lo da sobre un objetivo que lo ya concedido no cubre (de una agenda a toda
   * la organización, de `FIXED` a `DYNAMIC`) o lo prorroga más allá de lo ya
   * aprobado (V-3)—, pide la aprobación de otra persona y devuelve la solicitud
   * pendiente; si no, `undefined` y el llamador escribe. Sin `FourEyesService`
   * inyectado (suites anteriores al gobierno) no pide nada; con él pero sin el
   * directorio de permisos no se puede probar qué está ya concedido y TODO átomo
   * crítico se pide (falla cerrado).
   */
  private async requestCriticalApproval(
    tx: EntityManager,
    input: {
      readonly tenantId: string;
      readonly actor: AuthenticatedUser;
      readonly record: EngagementRecord;
      readonly effect: 'ALLOW' | 'DENY' | undefined;
      /** Lo que quedará escrito, dado lo ya concedido (permisos vivos de la persona). */
      readonly proposal: (
        held: readonly HeldGrantView[],
        views: readonly LiveGrantView[],
      ) => Promise<CriticalProposal | undefined>;
      readonly payload: GrantChangePayload;
    },
  ): Promise<GrantChangePendingDto | undefined> {
    if (!this.fourEyes || input.effect === 'DENY') return undefined;
    const views = this.directory
      ? await this.directory.liveGrantsOf(tx, [input.record], new Date())
      : [];
    const held = views.filter((v) => v.effect === 'ALLOW');
    const proposal = await input.proposal(held, views);
    if (!proposal || proposal.atoms.length === 0) return undefined;
    const need: CriticalApprovalNeed | undefined = this.policy
      ? criticalApprovalNeed({ ...proposal, held })
      : { atoms: [...proposal.atoms], reasons: ['NEW_CRITICAL_ATOMS'] };
    if (!need) return undefined;
    const row = await this.fourEyes.requestGrantChange(tx, {
      tenantId: input.tenantId,
      actor: input.actor,
      subjectUserId: input.record.userId,
      engagementId: input.record.assignment.id,
      permissionCode: need.atoms[0],
      payload: {
        ...input.payload,
        reasons: need.reasons,
        criticalAtoms: [...proposal.atoms],
      },
    });
    return {
      status: 'PENDING_APPROVAL',
      approvalId: row.id,
      expiresAt: row.expiresAt,
      reasons: [...need.reasons],
      criticalAtoms: need.atoms,
    };
  }

  /** Objetivo enriquecido (doctor, ruta del espacio, sede) de lo que se propone escribir. */
  private async targetOf(
    tx: EntityManager,
    refs: Parameters<TeamAdminPolicy['targetOf']>[1],
  ): Promise<GrantTargetFacts> {
    return this.policy
      ? this.policy.targetOf(tx, refs)
      : { targetKind: refs.targetKind };
  }

  /**
   * Lo que quedará escrito al editar un permiso: átomos críticos, objetivo
   * (con el cambio de `expansionMode`, que amplía al pasar a `DYNAMIC`) y
   * vigencia resultantes. El permiso actual cuenta en `held` con su estado de
   * hoy, así que una edición que no amplía nada queda cubierta por sí misma.
   */
  private async updateProposal(
    tx: EntityManager,
    grant: SupportScopeGrants,
    dto: UpdateSupportGrantDto,
    held: readonly HeldGrantView[],
    views: readonly LiveGrantView[],
  ): Promise<CriticalProposal> {
    const own = views.find((v) => v.grantId === grant.id);
    const atoms = dto.actions
      ? criticalAtomsOf(dto.actions)
      : criticalAtomsOf(
          own
            ? own.atoms
            : supportActionInputsOfPermissionIds(
                (await this.grants.findLiveActions(tx, grant.id)).map(
                  (r) => r.permissionId,
                ),
              ),
        );
    const current: GrantTargetFacts = own
      ? own.target
      : {
          ...(await this.targetOf(tx, {
            targetKind: TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId],
            practitionerRoleAssignmentId: grant.practitionerRoleAssignmentId,
            healthcareServiceId: grant.healthcareServiceId,
            careSpaceId: grant.careSpaceId,
            practiceSiteId: grant.practiceSiteId,
          })),
          expansionMode:
            grant.expansionModeConceptId === EXPANSION_CONCEPT.FIXED
              ? 'FIXED'
              : 'DYNAMIC',
        };
    return {
      atoms,
      target: targetAfterExpansionChange(current, dto.expansionMode),
      validTo:
        dto.validTo !== undefined
          ? new Date(dto.validTo)
          : (grant.validTo ?? undefined),
      held,
    };
  }

  /** Crea la fila del permiso con sus acciones y refresca el acceso derivado. */
  private async insertGrant(
    tx: EntityManager,
    tenantId: string,
    record: EngagementRecord,
    dto: CreateSupportGrantDto,
    who: {
      readonly actor: AuthenticatedUser;
      readonly actorUserId: string;
      readonly approvedByUserId: string;
    },
  ): Promise<ResourceCreatedDto> {
    const mode = dto.expansionMode ?? 'DYNAMIC';
    const grant = this.grants.create(tx, {
      tenantId,
      organizationUserAssignmentId: record.assignment.id,
      targetKindConceptId: TARGET_KIND_CONCEPT[dto.targetKind],
      practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId,
      healthcareServiceId: dto.healthcareServiceId,
      careSpaceId: dto.careSpaceId,
      practiceSiteId: dto.practiceSiteId,
      expansionModeConceptId: EXPANSION_CONCEPT[mode],
      fixedSnapshot:
        mode === 'FIXED'
          ? await this.targets.buildSnapshot(tx, tenantId, dto.targetKind, dto)
          : undefined,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
      approvedByUserId: who.approvedByUserId,
      actorUserId: who.actorUserId,
      ...(dto.effect === 'DENY' ? { effectConceptId: AUTHZ.EFFECT_DENY } : {}),
      ...(dto.condition
        ? {
            condition: dto.condition,
            conditionSchemaVersion: conditionVersion(dto.condition),
          }
        : {}),
    });
    await tx.flush();
    this.grants.addActions(
      tx,
      grant,
      actionInputs(dto.actions, dto.actionConditions),
    );
    await tx.flush();
    await this.effective.refreshTenant(tenantId, {
      userId: record.userId,
      actorUserId: who.actorUserId,
      tx,
    });
    if (dto.effect === 'DENY') {
      // Una denegación explícita tiene nombre propio en la cadena de auditoría.
      await this.audit?.seal(
        tx,
        who.actor,
        tenantId,
        'SUPPORT_GRANT_CREATED',
        'support_scope_grant',
        grant.id,
      );
      await this.audit?.seal(
        tx,
        who.actor,
        tenantId,
        'SUPPORT_GRANT_DENY_CREATED',
        'support_scope_grant',
        grant.id,
      );
    }
    return {
      id: grant.id,
      status: grant.statusConceptId,
      createdAt: grant.createdAt,
    };
  }

  /** Comprobaciones de escritura de una edición (guardián, token de simulación). */
  private async validateUpdate(
    tx: EntityManager,
    record: EngagementRecord,
    grant: SupportScopeGrants,
    tenantId: string,
    actor: AuthenticatedUser,
    engagementId: string,
    dto: UpdateSupportGrantDto,
  ): Promise<void> {
    if (!(
      dto.actions ||
      dto.validTo !== undefined ||
      dto.condition ||
      dto.actionConditions
    )) {
      return;
    }
    const live = dto.actions
      ? undefined
      : await this.grants.findLiveActions(tx, grant.id);
    await this.assertWritable(tx, record, tenantId, actor, engagementId, {
      targetKind: TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId],
      refs: {
        practitionerRoleAssignmentId: grant.practitionerRoleAssignmentId,
        healthcareServiceId: grant.healthcareServiceId,
        careSpaceId: grant.careSpaceId,
        practiceSiteId: grant.practiceSiteId,
      },
      actions:
        dto.actions ??
        supportActionInputsOfPermissionIds(
          (live ?? []).map((r) => r.permissionId),
        ),
      effect: grant.effectConceptId === AUTHZ.EFFECT_DENY ? 'DENY' : 'ALLOW',
      validTo:
        dto.validTo !== undefined
          ? new Date(dto.validTo)
          : (grant.validTo ?? undefined),
      condition: dto.condition,
      actionConditions: dto.actionConditions,
      simulationToken: dto.simulationToken,
      draftId: grant.id,
    });
  }

  /** Aplica la edición (o la baja) a la fila del permiso y refresca el acceso derivado. */
  private async applyUpdate(
    tx: EntityManager,
    tenantId: string,
    record: EngagementRecord,
    grant: SupportScopeGrants,
    dto: UpdateSupportGrantDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const now = new Date();
    if (dto.revoke) {
      grant.statusConceptId = DELEG.SUPPORT_GRANT_REVOKED;
      grant.validTo = now;
    } else {
      if (dto.validTo !== undefined) grant.validTo = new Date(dto.validTo);
      if (dto.condition) {
        grant.conditionJson = dto.condition;
        grant.conditionSchemaVersion = conditionVersion(dto.condition);
      }
      if (dto.actions) await this.replaceActions(tx, grant, dto.actions);
      if (dto.actionConditions)
        await this.setActionConditions(tx, grant, dto.actionConditions);
      if (dto.expansionMode) {
        grant.expansionModeConceptId = EXPANSION_CONCEPT[dto.expansionMode];
        grant.fixedSnapshotJson =
          dto.expansionMode === 'FIXED'
            ? await this.targets.buildSnapshot(
                tx,
                tenantId,
                TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId],
                {
                  practitionerRoleAssignmentId:
                    grant.practitionerRoleAssignmentId,
                  healthcareServiceId: grant.healthcareServiceId,
                  careSpaceId: grant.careSpaceId,
                  practiceSiteId: grant.practiceSiteId,
                },
              )
            : undefined;
      }
    }
    touch(grant, actor.id, now);
    await tx.flush();
    await this.effective.refreshTenant(tenantId, {
      userId: record.userId,
      actorUserId: actor.id,
      tx,
    });
    if (!dto.revoke && (dto.condition || dto.actionConditions)) {
      // Cambiar las condiciones de una concesión tiene nombre propio en la cadena.
      await this.audit?.seal(
        tx,
        actor,
        tenantId,
        'SUPPORT_GRANT_UPDATED',
        'support_scope_grant',
        grant.id,
      );
      await this.audit?.seal(
        tx,
        actor,
        tenantId,
        'SUPPORT_GRANT_CONDITIONS_UPDATED',
        'support_scope_grant',
        grant.id,
      );
    }
  }

  /**
   * Confirma la recertificación: fija la próxima fecha y, si el vínculo estaba
   * suspendido por no confirmar a tiempo, lo reactiva.
   *
   * @param engagementId - Vínculo.
   * @param dto - Periodicidad nueva (6 o 12 meses), si cambia.
   * @param actor - Quien confirma.
   * @returns `{ ok: true }`.
   */
  async recertify(
    engagementId: string,
    dto: RecertifyEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      const a = record.assignment;
      if (a.statusConceptId !== STATUS.ACTIVE && !isRecertificationLapsed(a)) {
        throw new PreconditionFailedException(
          'Solo se recertifica un vínculo activo o suspendido por recertificación',
          { engagementId },
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        );
      }
      await this.renew(tx, record, dto.recertifyEveryMonths, actor);
      await this.reviewLink?.onRecertified(tx, a, actor.id, new Date());
      await tx.flush();
      await this.effective.refreshTenant(tenantId, {
        userId: record.userId,
        actorUserId: actor.id,
        tx,
      });
      return { ok: true };
    });
  }

  /**
   * La propia persona de apoyo declara «sigo trabajando aquí». Es solo una
   * declaración: queda en el asiento de auditoría
   * `SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON` y **no** renueva el período, no mueve
   * `next_recertification_at` ni reactiva nada. Renovar y reactivar es de la
   * organización (`recertify`). Idempotente: declarar de nuevo solo deja otro
   * asiento. Funciona con el vínculo activo (también dentro de los 15 días de
   * gracia) y con el suspendido por recertificación (sigue suspendido).
   *
   * Solo confirma lo suyo: el vínculo se busca por su propio `id` de persona, y
   * uno ajeno responde igual que uno inexistente. Uno terminado, expirado o
   * suspendido por otra causa responde 422.
   *
   * Corre sin tenant activo (la persona puede asistir a varias organizaciones):
   * ubica el vínculo con el contexto de sistema acotado a la transacción y fija
   * la organización resuelta antes de seguir leyendo (RLS).
   *
   * @param engagementId - Vínculo de la persona.
   * @param actor - La persona de apoyo.
   * @returns El vínculo tal cual está, con `declaredAt`.
   */
  async confirmMine(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmedSupportEngagementViewDto> {
    this.logger.info(
      {
        operation: 'delegated_access.support_engagement.confirm_mine',
        engagementId,
        actorId: actor.id,
      },
      'Support person declaring own engagement',
    );
    return withPersonScope(this.em, async (tx, scope) => {
      const [record] = await scope.ownRows(() =>
        this.access.findEngagements(tx, {
          ids: [engagementId],
          userId: actor.id,
        }),
      );
      if (!record || record.userId !== actor.id) {
        throw new ResourceNotFoundException(
          'Vínculo de apoyo no encontrado',
          undefined,
          Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
        );
      }
      const a = record.assignment;
      const declaredAt = new Date();
      const liveActive =
        a.statusConceptId === STATUS.ACTIVE &&
        record.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE &&
        (!a.validTo || a.validTo > declaredAt);
      if (!liveActive && !isRecertificationLapsed(a)) {
        throw new PreconditionFailedException(
          'Solo declara su vínculo quien lo tiene activo o suspendido por no recertificarse a tiempo',
          { engagementId },
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        );
      }
      const [view] = await scope.inTenant(record.tenantId, () =>
        this.toViews(tx, [record]),
      );
      return { ...view, personConfirmedAt: declaredAt, declaredAt };
    });
  }

  /**
   * Fija la próxima recertificación y, si el vínculo estaba suspendido por no
   * recertificarse, lo reactiva con sus delegaciones y su membresía. Solo la usa
   * la recertificación de la organización.
   * No hace `flush` ni refresca el acceso derivado: lo hace quien la llama.
   */
  private async renew(
    tx: EntityManager,
    record: EngagementRecord,
    months: 6 | 12 | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const a = record.assignment;
    const lapsed = isRecertificationLapsed(a);
    const period = months ?? a.recertifyEveryMonths ?? 12;
    a.recertifyEveryMonths = period;
    a.nextRecertificationAt = addMonths(new Date(), period);
    if (lapsed) {
      a.statusConceptId = STATUS.ACTIVE;
      a.endedReasonText = undefined;
      a.suspendedAt = undefined;
      a.suspensionReasonConceptId = undefined;
      const delegations = await this.engagements.findDelegations(tx, a.id);
      for (const d of delegations) {
        if (d.statusConceptId === STATUS.SUSPENDED) {
          d.statusConceptId = STATUS.ACTIVE;
          touch(d, actor.id);
        }
      }
      await this.engagements.syncSupportMembership(
        tx,
        a.tenantMembershipId,
        'ACTIVE',
        new Date(),
        actor.id,
      );
    }
    touch(a, actor.id);
  }

  /**
   * Fin de vínculo: revocación inmediata en cascada (permisos, delegaciones,
   * solicitudes abiertas y acceso derivado). Las citas **se mantienen**: no se
   * cancela ni se toca ninguna; su gestión pasa a la recepción de la organización.
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo.
   * @param actor - Quien termina el vínculo.
   * @returns `{ ok: true }`; idempotente si ya estaba terminado.
   */
  async end(
    engagementId: string,
    dto: EndEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.support_engagement.end',
        engagementId,
        tenantId,
        actorId: actor.id,
      },
      'Ending support engagement',
    );
    return this.em.transactional(async (tx) => {
      const record = await this.loadInTenant(tx, engagementId, tenantId);
      const a = record.assignment;
      if (a.statusConceptId === STATUS.REVOKED) return { ok: true };
      const now = new Date();
      a.statusConceptId = STATUS.REVOKED;
      a.validTo = now;
      a.endedReasonText = dto.reason;
      touch(a, actor.id, now);

      for (const grant of await this.grants.findByEngagement(tx, a.id)) {
        if (grant.statusConceptId !== DELEG.SUPPORT_GRANT_REVOKED) {
          grant.statusConceptId = DELEG.SUPPORT_GRANT_REVOKED;
          grant.validTo = now;
          touch(grant, actor.id, now);
        }
      }
      for (const delegate of await this.engagements.findDelegations(tx, a.id)) {
        if (delegate.statusConceptId === STATUS.REVOKED) continue;
        delegate.statusConceptId = STATUS.REVOKED;
        delegate.validTo = now;
        touch(delegate, actor.id, now);
        this.events.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_DELEGATION_REVOKED,
          actorUserId: actor.id,
          targetUserId: record.userId,
          reasonConceptId: DELEG.REASON_ENGAGEMENT_ENDED,
        });
      }
      await this.engagements.syncSupportMembership(
        tx,
        a.tenantMembershipId,
        'ENDED',
        now,
        actor.id,
      );
      const open = await this.requests.findByRequester(tx, record.userId, 200);
      for (const request of open) {
        if (
          request.tenantId === tenantId &&
          request.statusConceptId === DELEG.ENGAGEMENT_STATUS_PENDING
        ) {
          request.statusConceptId = DELEG.ENGAGEMENT_STATUS_CANCELLED;
          touch(request, actor.id, now);
        }
      }
      await tx.flush();
      await this.effective.refreshTenant(tenantId, {
        userId: record.userId,
        actorUserId: actor.id,
        tx,
      });
      return { ok: true };
    });
  }

  /**
   * Suspende los vínculos que pasaron 15 días de su fecha de recertificación
   * sin que nadie la confirmara (barrido del worker).
   *
   * @param limit - Tope por pasada.
   * @returns Cuántos vínculos se suspendieron.
   */
  async suspendLapsedRecertifications(limit = 500): Promise<number> {
    const cutoff = new Date(Date.now() - RECERTIFICATION_GRACE_DAYS * DAY_MS);
    const tenants = new Map<string, Set<string>>();
    const suspended = await this.em.transactional(async (tx) => {
      const due = await this.engagements.findActiveDueBefore(
        tx,
        STATUS.ACTIVE,
        cutoff,
        limit,
      );
      const records = await this.access.findEngagements(tx, {
        ids: due.map((d) => d.id),
      });
      const now = new Date();
      for (const a of due) {
        a.statusConceptId = STATUS.SUSPENDED;
        a.endedReasonText = RECERT_LAPSED_MARKER;
        // Ciclo de vida: la suspensión por recertificación también deja fecha y motivo.
        a.suspendedAt = now;
        a.suspensionReasonConceptId = DELEG.SUSPENSION_RECERTIFICATION_LAPSED;
        touch(a, undefined, now);
        for (const d of await this.engagements.findDelegations(tx, a.id)) {
          if (d.statusConceptId === STATUS.ACTIVE) {
            d.statusConceptId = STATUS.SUSPENDED;
            touch(d, undefined, now);
          }
        }
        await this.engagements.syncSupportMembership(
          tx,
          a.tenantMembershipId,
          'SUSPENDED',
          now,
          undefined,
        );
      }
      for (const r of records) {
        const users = tenants.get(r.tenantId) ?? new Set<string>();
        users.add(r.userId);
        tenants.set(r.tenantId, users);
      }
      return due.length;
    });
    for (const tenantId of tenants.keys()) {
      await this.effective.refreshTenant(tenantId);
    }
    return suspended;
  }

  /** Carga un vínculo de la organización; uno ajeno responde como inexistente. */
  private async loadInTenant(
    tx: EntityManager,
    engagementId: string,
    tenantId: string,
  ): Promise<EngagementRecord> {
    const [record] = await this.access.findEngagements(tx, {
      ids: [engagementId],
      tenantId,
    });
    if (!record) {
      throw new ResourceNotFoundException(
        'Vínculo de apoyo no encontrado',
        undefined,
        Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      );
    }
    return record;
  }

  /** Exige que el vínculo esté activo. */
  private assertActive(record: EngagementRecord): void {
    if (record.assignment.statusConceptId !== STATUS.ACTIVE) {
      throw new PreconditionFailedException(
        'El vínculo de apoyo no está activo',
        { engagementId: record.assignment.id },
        Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
      );
    }
  }

  /** Reemplaza el conjunto de acciones de un permiso. */
  private async replaceActions(
    tx: EntityManager,
    grant: SupportScopeGrants,
    actions: readonly string[],
  ): Promise<void> {
    const wanted = new Set(actions.map((a) => permissionIdOfInput(a)));
    const current = await this.grants.findActions(tx, grant.id);
    const have = new Set(current.map((c) => c.permissionId));
    this.grants.removeActions(
      tx,
      current.filter((c) => !wanted.has(c.permissionId)),
    );
    this.grants.addActions(
      tx,
      grant,
      [...wanted].filter((id) => !have.has(id)),
    );
  }

  /**
   * Comprobaciones de escritura del gobierno de accesos: barandillas, techos de
   * la organización, condiciones y segregación de funciones, más la huella de
   * `simulate` si el cliente la trae. Sin el guardián inyectado (suites
   * anteriores al gobierno) no comprueba nada.
   */
  private async assertWritable(
    tx: EntityManager,
    record: EngagementRecord,
    tenantId: string,
    actor: AuthenticatedUser,
    engagementId: string,
    write: {
      readonly targetKind: SupportTargetKind;
      readonly refs: {
        readonly practitionerRoleAssignmentId?: string;
        readonly healthcareServiceId?: string;
        readonly careSpaceId?: string;
        readonly practiceSiteId?: string;
      };
      readonly actions: readonly string[];
      readonly effect?: 'ALLOW' | 'DENY';
      readonly validTo?: Date;
      readonly condition?: unknown;
      readonly actionConditions?: Readonly<Record<string, unknown>>;
      readonly simulationToken?: string;
      readonly draftId?: string;
    },
  ): Promise<void> {
    if (write.simulationToken) {
      const verdict = verifySimulationToken(
        write.simulationToken,
        engagementId,
        {
          mode: 'PATCH',
          grants: [
            {
              ...(write.draftId ? { id: write.draftId } : {}),
              effect: write.effect ?? 'ALLOW',
              actions: [...write.actions],
              ...(write.condition ? { condition: write.condition } : {}),
              ...(write.actionConditions
                ? { actionConditions: write.actionConditions }
                : {}),
              targetKind: write.targetKind,
              ...(write.refs.practitionerRoleAssignmentId
                ? {
                    practitionerRoleAssignmentId:
                      write.refs.practitionerRoleAssignmentId,
                  }
                : {}),
              ...(write.refs.healthcareServiceId
                ? { healthcareServiceId: write.refs.healthcareServiceId }
                : {}),
              ...(write.refs.careSpaceId
                ? { careSpaceId: write.refs.careSpaceId }
                : {}),
              ...(write.refs.practiceSiteId
                ? { practiceSiteId: write.refs.practiceSiteId }
                : {}),
              ...(write.validTo
                ? { validTo: write.validTo.toISOString() }
                : {}),
            },
          ],
          removeGrantIds: [],
        },
        new Date(),
      );
      if (verdict !== 'OK') {
        throw governanceError(
          Reason.SIMULATION_STALE,
          'Lo que va a guardar no es lo que simuló (o la simulación venció). Simule de nuevo.',
        );
      }
    }
    if (!this.writeGuard) return;
    const template = record.assignment.roleTemplateId
      ? await this.templates.findById(tx, record.assignment.roleTemplateId)
      : null;
    await this.writeGuard.assertCanWrite(tx, {
      tenantId,
      actor,
      engagementId,
      userId: record.userId,
      ...(template?.code ? { templateCode: template.code } : {}),
      grant: {
        targetKind: write.targetKind,
        actions: write.actions,
        effect: write.effect,
        validTo: write.validTo,
        condition: write.condition,
        actionConditions: write.actionConditions,
        practitionerRoleAssignmentId: write.refs.practitionerRoleAssignmentId,
        healthcareServiceId: write.refs.healthcareServiceId,
        careSpaceId: write.refs.careSpaceId,
        practiceSiteId: write.refs.practiceSiteId,
      },
      ...(write.draftId ? { replacesGrantId: write.draftId } : {}),
    });
  }

  /** Reemplaza las condiciones propias de cada átomo del permiso (las que no vienen se limpian). */
  private async setActionConditions(
    tx: EntityManager,
    grant: SupportScopeGrants,
    conditions: Readonly<Record<string, Record<string, unknown>>>,
  ): Promise<void> {
    const byId = new Map(
      Object.entries(conditions).map(([code, condition]) => [
        permissionIdOfInput(code),
        condition,
      ]),
    );
    for (const row of await this.grants.findLiveActions(tx, grant.id)) {
      const condition = byId.get(row.permissionId);
      row.conditionJson = condition ?? null;
      row.conditionSchemaVersion = condition
        ? conditionVersion(condition)
        : undefined;
    }
  }

  /** Vistas de permisos agrupadas por vínculo. */
  private async grantViews(
    tx: EntityManager,
    engagementIds: readonly string[],
  ): Promise<{ engagementId: string; grants: SupportGrantViewDto[] }[]> {
    const withActions = await this.access.findGrantsWithActions(
      tx,
      engagementIds,
    );
    return engagementIds.map((engagementId) => ({
      engagementId,
      grants: withActions
        .filter((g) => g.grant.organizationUserAssignmentId === engagementId)
        .map(({ grant, permissionIds }) => ({
          id: grant.id,
          targetKind: TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId],
          practitionerRoleAssignmentId: grant.practitionerRoleAssignmentId,
          healthcareServiceId: grant.healthcareServiceId,
          careSpaceId: grant.careSpaceId,
          practiceSiteId: grant.practiceSiteId,
          actions: actionsOfPermissionIds(permissionIds),
          expansionMode:
            grant.expansionModeConceptId === DELEG.SUPPORT_EXPANSION_FIXED
              ? 'FIXED'
              : 'DYNAMIC',
          status: GRANT_STATUS_CODE[grant.statusConceptId] ?? 'UNKNOWN',
          validFrom: grant.validFrom,
          validTo: grant.validTo,
        })),
    }));
  }

  /** Vistas de vínculos con su plantilla y permisos. */
  private async toViews(
    tx: EntityManager,
    records: readonly EngagementRecord[],
  ): Promise<SupportEngagementViewDto[]> {
    const grantsByEngagement = new Map(
      (
        await this.grantViews(
          tx,
          records.map((r) => r.assignment.id),
        )
      ).map((g) => [g.engagementId, g.grants]),
    );
    const now = Date.now();
    const userIds = [...new Set(records.map((r) => r.userId))];
    const tenantIds = [...new Set(records.map((r) => r.tenantId))];
    const [personNames, tenantNames, lastActivity, personConfirmations] =
      await Promise.all([
        this.activity.userNames(tx, userIds),
        this.activity.tenantNames(tx, tenantIds),
        this.activity.lastActivity(
          tx,
          tenantIds,
          userIds,
          new Date(now - LAST_ACTIVITY_WINDOW_DAYS * DAY_MS),
        ),
        this.activity.lastPersonConfirmations(
          tx,
          userIds,
          records.map((r) => r.assignment.id),
          CONFIRMED_BY_PERSON_ACTION,
        ),
      ]);
    const views: SupportEngagementViewDto[] = [];
    for (const { assignment: a, tenantId, userId } of records) {
      const template = a.roleTemplateId
        ? await this.templates.findById(tx, a.roleTemplateId)
        : null;
      // La última confirmación de la ORGANIZACIÓN (o la aprobación inicial) es la
      // recertificación vigente menos su período. La declaración de la persona
      // no mueve esa fecha: se informa aparte, desde su asiento más reciente.
      const lastConfirmedAt =
        a.nextRecertificationAt && a.recertifyEveryMonths
          ? addMonths(a.nextRecertificationAt, -a.recertifyEveryMonths)
          : undefined;
      views.push({
        id: a.id,
        tenantId,
        userId,
        roleTemplateCode: template?.code,
        personName: personNames.get(userId) || undefined,
        organizationName: tenantNames.get(tenantId) || undefined,
        ownerKind: a.ownerKindConceptId
          ? OWNER_KIND_CODE[a.ownerKindConceptId]
          : undefined,
        recertifyEveryMonths: a.recertifyEveryMonths ?? undefined,
        status: STATUS_CODE[a.statusConceptId] ?? 'UNKNOWN',
        origin: a.originConceptId ? ORIGIN_CODE[a.originConceptId] : undefined,
        validFrom: a.validFrom,
        validTo: a.validTo,
        nextRecertificationAt: a.nextRecertificationAt,
        recertificationDue:
          a.statusConceptId === STATUS.ACTIVE &&
          !!a.nextRecertificationAt &&
          a.nextRecertificationAt.getTime() <= now,
        endedReason: a.endedReasonText,
        lastActivityAt: lastActivity.get(`${tenantId}|${userId}`),
        suspendedAt:
          isRecertificationLapsed(a) && a.nextRecertificationAt
            ? new Date(
                a.nextRecertificationAt.getTime() +
                  RECERTIFICATION_GRACE_DAYS * DAY_MS,
              )
            : undefined,
        lastConfirmedAt,
        lastConfirmedBy: lastConfirmedAt ? 'ORGANIZATION' : undefined,
        personConfirmedAt: personConfirmations.get(a.id),
        grants: grantsByEngagement.get(a.id) ?? [],
      });
    }
    return views;
  }
}

/** ¿Está suspendido por no recertificarse a tiempo (y no por otra causa)? */
function isRecertificationLapsed(a: OrganizationUserAssignments): boolean {
  return (
    a.statusConceptId === STATUS.SUSPENDED &&
    a.endedReasonText === RECERT_LAPSED_MARKER
  );
}

/** Versión del esquema de una condición (la que lleva su `schemaVersion`). */
function conditionVersion(condition: unknown): number | undefined {
  const version = (condition as { schemaVersion?: unknown } | null | undefined)
    ?.schemaVersion;
  return typeof version === 'number' ? version : undefined;
}

/** Filas de acción a crear: ids simples, o con la condición propia del átomo. */
function actionInputs(
  actions: readonly string[],
  conditions?: Readonly<Record<string, Record<string, unknown>>>,
): Array<string | SupportGrantActionInput> {
  return actions.map((code) => {
    const permissionId = permissionIdOfInput(code);
    const condition = conditions?.[code];
    return condition
      ? {
          permissionId,
          condition,
          conditionSchemaVersion: conditionVersion(condition),
        }
      : permissionId;
  });
}

/** Permiso vivo `ALLOW` de la persona: lo ya concedido contra lo que se compara una ampliación. */
type HeldGrantView = Pick<LiveGrantView, 'atoms' | 'target' | 'validTo'>;

/** Lo que quedará escrito, para medir si amplía lo ya concedido (V-3). */
interface CriticalProposal {
  readonly atoms: readonly string[];
  readonly target: GrantTargetFacts;
  readonly validTo?: Date;
  readonly held: readonly HeldGrantView[];
}

/** Datos comunes de un `GRANT_CHANGE`: por qué pide aprobación y qué átomos críticos incluye (los ve quien decide). */
interface GrantChangeCommon {
  readonly engagementId: string;
  /** `row_version` del vínculo al pedir: si cambió, la aprobación ya no vale. */
  readonly assignmentRowVersion: number;
  /** `NEW_CRITICAL_ATOMS`, `SCOPE_WIDENED`, `VALIDITY_EXTENDED`. */
  readonly reasons?: readonly string[];
  /** TODOS los átomos críticos del permiso resultante. */
  readonly criticalAtoms?: readonly string[];
}

/** Cuerpo firmado de un `GRANT_CHANGE`: JSON puro, acciones únicas y ordenadas. */
export type GrantChangePayload =
  | (GrantChangeCommon & {
      readonly op: 'ADD';
      readonly grant: GrantChangeGrant;
    })
  | (GrantChangeCommon & {
      readonly op: 'UPDATE';
      readonly grantId: string;
      readonly change: Readonly<Record<string, unknown>>;
    });

/** Permiso de un `GRANT_CHANGE` de tipo `ADD`. */
export interface GrantChangeGrant {
  readonly targetKind: SupportTargetKind;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  readonly actions: readonly string[];
  readonly effect: 'ALLOW' | 'DENY';
  readonly condition?: Record<string, unknown>;
  readonly actionConditions?: Record<string, Record<string, unknown>>;
  readonly expansionMode: 'DYNAMIC' | 'FIXED';
  readonly validFrom?: string;
  readonly validTo?: string;
}

/** Lo que el guardián de escritura necesita saber de un alta. */
function addWrite(dto: CreateSupportGrantDto) {
  return {
    targetKind: dto.targetKind,
    refs: dto,
    actions: dto.actions,
    effect: dto.effect,
    validTo: dto.validTo ? new Date(dto.validTo) : undefined,
    condition: dto.condition,
    actionConditions: dto.actionConditions,
    simulationToken: dto.simulationToken,
    draftId: undefined,
  };
}

/** Permiso de un alta en la forma firmada (sin el token de simulación). */
function addPayloadGrant(dto: CreateSupportGrantDto): GrantChangeGrant {
  return {
    targetKind: dto.targetKind,
    ...(dto.practitionerRoleAssignmentId
      ? { practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId }
      : {}),
    ...(dto.healthcareServiceId
      ? { healthcareServiceId: dto.healthcareServiceId }
      : {}),
    ...(dto.careSpaceId ? { careSpaceId: dto.careSpaceId } : {}),
    ...(dto.practiceSiteId ? { practiceSiteId: dto.practiceSiteId } : {}),
    actions: [...new Set(dto.actions)].sort(),
    effect: dto.effect ?? 'ALLOW',
    ...(dto.condition ? { condition: dto.condition } : {}),
    ...(dto.actionConditions ? { actionConditions: dto.actionConditions } : {}),
    expansionMode: dto.expansionMode ?? 'DYNAMIC',
    ...(dto.validFrom
      ? { validFrom: new Date(dto.validFrom).toISOString() }
      : {}),
    ...(dto.validTo ? { validTo: new Date(dto.validTo).toISOString() } : {}),
  };
}

/** Cambio de una edición en la forma firmada: acciones únicas y ordenadas. */
function canonicalChange(
  change: Omit<UpdateSupportGrantDto, 'grantId' | 'simulationToken'>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(change)) {
    if (value === undefined) continue;
    out[key] =
      key === 'actions' && Array.isArray(value)
        ? [...new Set<string>(value)].sort()
        : key === 'validTo' && typeof value === 'string'
          ? new Date(value).toISOString()
          : value;
  }
  return out;
}

/** Alta a partir del permiso firmado. */
function dtoOfPayloadGrant(g: GrantChangeGrant): CreateSupportGrantDto {
  return {
    targetKind: g.targetKind,
    practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
    healthcareServiceId: g.healthcareServiceId,
    careSpaceId: g.careSpaceId,
    practiceSiteId: g.practiceSiteId,
    actions: [...g.actions],
    effect: g.effect,
    condition: g.condition,
    actionConditions: g.actionConditions,
    expansionMode: g.expansionMode,
    validFrom: g.validFrom,
    validTo: g.validTo,
  };
}

/** Condiciones propias de cada átomo (átomo → condición), solo las que existen. */
function actionConditionsOf(
  rows: ReadonlyArray<{ permissionId: string; conditionJson?: unknown }>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    if (!row.conditionJson) continue;
    const atom = PERMISSION_ATOM_BY_ID.get(row.permissionId);
    if (atom) out[atom.code] = row.conditionJson;
  }
  return out;
}
