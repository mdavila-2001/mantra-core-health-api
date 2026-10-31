import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import type { PractitionerDelegateAssignments } from '../entities';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  DEFAULT_CLINICAL_ACCESS_HOURS,
  coverageSummary,
  patientLabelOf,
} from '../domain/support-activity';
import type {
  AcceptSupportDelegateDto,
  OperationResultDto,
  ReplySettingsDto,
  SupportAccessRequestsResponseDto,
  SupportTeamResponseDto,
} from '../dto';
import {
  DelegatedAccessApprovalRequestsRepository,
  PractitionerDelegateAssignmentsRepository,
  RoleTemplatesRepository,
  SupportAccessRepository,
  SupportActivityRepository,
  SupportEngagementsRepository,
  type RoleAssignmentInfo,
} from '../repositories';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';

/**
 * Lo que el doctor hace con su equipo de apoyo: ver quién lo integra, aceptar
 * a cada persona (una vez, con la cláusula de personal de apoyo), decidir si
 * puede responder mensajes en su nombre y si el paciente ve «respondido por su
 * equipo». Solo ve y toca lo suyo.
 */
@Injectable()
export class PractitionerSupportService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param delegatesRepo - Delegaciones doctor ↔ persona.
   * @param access - Lecturas de vínculos y estructura.
   * @param engagements - Vínculos de apoyo.
   * @param templates - Plantillas de rol.
   * @param effective - Acceso efectivo derivado.
   * @param scope - Política común de tenant.
   * @param logger - Logger estructurado.
   * @param approvalRequests - Solicitudes de acceso clínico temporal.
   * @param activity - Nombres y actividad que acompañan a la vista.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly access: SupportAccessRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly effective: EffectiveSupportAccessService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
    private readonly approvalRequests: DelegatedAccessApprovalRequestsRepository,
    private readonly activity: SupportActivityRepository,
  ) {
    this.logger.setContext(PractitionerSupportService.name);
  }

  /**
   * Equipo de apoyo del doctor en la organización activa.
   *
   * @param actor - El doctor.
   * @returns Sus integrantes con estado de aceptación y acciones.
   */
  async supportTeam(actor: AuthenticatedUser): Promise<SupportTeamResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const profileId = this.requireProfile(actor);
    const tx = this.em.fork({ keepTransactionContext: true });
    const roles = await this.access.findRoleAssignmentsOfPractitioner(
      tx,
      profileId,
      tenantId,
    );
    const delegations = await this.engagements.findDelegationsOfDoctor(
      tx,
      roles.map((r) => r.id),
    );
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ids: delegations.map((d) => d.delegateUserAssignmentId),
    });
    const preview = await this.effective.previewForDoctor(tenantId, profileId);
    const userIds = [...new Set(records.map((r) => r.userId))];
    const open = await this.approvalRequests.findOpenByDelegates(
      tx,
      delegations.map((d) => d.id),
      DELEG.REQUEST_OPEN,
    );
    const [personNames, tenantNames, patientNames, lastActivity] =
      await Promise.all([
        this.activity.userNames(tx, userIds),
        this.activity.tenantNames(tx, [tenantId]),
        this.activity.profileNames(tx, [
          ...new Set(
            open.flatMap((r) =>
              r.patientProfileId ? [r.patientProfileId] : [],
            ),
          ),
        ]),
        this.activity.lastActivity(
          tx,
          [tenantId],
          userIds,
          new Date(Date.now() - 90 * 24 * 3600 * 1000),
        ),
      ]);
    const items = [];
    for (const delegate of delegations) {
      const record = records.find(
        (r) => r.assignment.id === delegate.delegateUserAssignmentId,
      );
      if (!record) continue;
      const template = record.assignment.roleTemplateId
        ? await this.templates.findById(tx, record.assignment.roleTemplateId)
        : null;
      const actions = [...(preview.get(record.userId) ?? [])].sort();
      const delegateStatus = statusCode(delegate.statusConceptId);
      items.push({
        delegateId: delegate.id,
        userId: record.userId,
        personName: personNames.get(record.userId) ?? '',
        engagementId: record.assignment.id,
        practitionerRoleAssignmentId: delegate.practitionerRoleAssignmentId,
        tenantId,
        organizationName: tenantNames.get(tenantId) || undefined,
        roleTemplateCode: template?.code,
        roleTemplate: template?.code,
        status: teamStatus(delegateStatus, !!delegate.acceptedAt),
        delegateStatus,
        accepted: !!delegate.acceptedAt,
        acceptedAt: delegate.acceptedAt,
        mayReplyOnBehalf: delegate.mayReplyOnBehalf === true,
        replyDisclosure:
          delegate.replyDisclosureConceptId === DELEG.REPLY_DISCLOSURE_HIDE
            ? 'HIDE'
            : 'SHOW',
        actions,
        coverageSummary: coverageSummary(actions),
        lastActivityAt: lastActivity.get(`${tenantId}|${record.userId}`),
        pendingClinicalRequests: open
          .filter((r) => r.practitionerDelegateAssignmentId === delegate.id)
          .map((r) => ({
            requestId: r.id,
            patientLabel: patientLabelOf(
              r.patientProfileId
                ? patientNames.get(r.patientProfileId)
                : undefined,
            ),
            reasonText: r.reasonText ?? '',
            requestedAt: r.requestedAt ?? r.createdAt,
            requestedHours: DEFAULT_CLINICAL_ACCESS_HOURS,
          })),
      });
    }
    return { items, count: items.length };
  }

  /**
   * Solicitudes abiertas de acceso clínico temporal de su equipo: lo que la
   * persona de apoyo pide ver y para qué. El doctor las decide con
   * `POST /access-requests/:id/decision`; nadie más lo hace por él.
   *
   * @param actor - El doctor.
   * @returns Las solicitudes abiertas de sus delegaciones.
   */
  async accessRequests(
    actor: AuthenticatedUser,
  ): Promise<SupportAccessRequestsResponseDto> {
    const tenantId = this.scope.resolveTenant();
    const profileId = this.requireProfile(actor);
    const tx = this.em.fork({ keepTransactionContext: true });
    const roles = await this.access.findRoleAssignmentsOfPractitioner(
      tx,
      profileId,
      tenantId,
    );
    const delegations = await this.engagements.findDelegationsOfDoctor(
      tx,
      roles.map((r) => r.id),
    );
    const open = await this.approvalRequests.findOpenByDelegates(
      tx,
      delegations.map((d) => d.id),
      DELEG.REQUEST_OPEN,
    );
    const records = await this.access.findEngagements(tx, {
      tenantId,
      ids: delegations.map((d) => d.delegateUserAssignmentId),
    });
    const items = open.flatMap((request) => {
      const delegate = delegations.find(
        (d) => d.id === request.practitionerDelegateAssignmentId,
      );
      const record = records.find(
        (r) => r.assignment.id === delegate?.delegateUserAssignmentId,
      );
      if (!delegate || !record) return [];
      return [
        {
          id: request.id,
          delegateId: delegate.id,
          userId: record.userId,
          patientProfileId: request.patientProfileId,
          encounterId: request.encounterId,
          reasonText: request.reasonText,
          createdAt: request.createdAt,
        },
      ];
    });
    return { items, count: items.length };
  }

  /**
   * El doctor acepta a la persona de apoyo (cláusula de personal de apoyo) y
   * opcionalmente le permite responder en su nombre.
   *
   * @param delegateId - Delegación.
   * @param dto - Aceptación de la cláusula y ajustes de respuesta.
   * @param actor - El doctor.
   * @returns `{ ok: true }`; idempotente.
   */
  async accept(
    delegateId: string,
    dto: AcceptSupportDelegateDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.support_delegate.accept',
        delegateId,
        actorId: actor.id,
      },
      'Practitioner accepting support delegate',
    );
    return this.em.transactional(async (tx) => {
      const { delegate, userId } = await this.loadOwn(
        tx,
        delegateId,
        actor,
        tenantId,
      );
      if (delegate.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException(
          'La delegación no está activa',
          { delegateId },
          Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        );
      }
      if (!delegate.acceptedAt) delegate.acceptedAt = new Date();
      this.applyReplySettings(delegate, dto, true);
      touch(delegate, actor.id);
      await tx.flush();
      await this.effective.refreshTenant(tenantId, {
        userId,
        actorUserId: actor.id,
        tx,
      });
      return { ok: true };
    });
  }

  /**
   * Ajusta si la persona puede responder en su nombre y si el paciente ve
   * «respondido por su equipo».
   *
   * @param delegateId - Delegación.
   * @param dto - Ajustes de respuesta.
   * @param actor - El doctor.
   * @returns `{ ok: true }`.
   */
  async replySettings(
    delegateId: string,
    dto: ReplySettingsDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    const tenantId = this.scope.resolveTenant();
    if (
      dto.mayReplyOnBehalf === undefined &&
      dto.replyDisclosure === undefined
    ) {
      throw new PreconditionFailedException('No hay cambios que aplicar');
    }
    return this.em.transactional(async (tx) => {
      const { delegate } = await this.loadOwn(tx, delegateId, actor, tenantId);
      this.applyReplySettings(delegate, dto, false);
      touch(delegate, actor.id);
      return { ok: true };
    });
  }

  /** Aplica los ajustes de respuesta; la divulgación por defecto es mostrarla. */
  private applyReplySettings(
    delegate: PractitionerDelegateAssignments,
    dto: ReplySettingsDto,
    applyDefaults: boolean,
  ): void {
    if (dto.mayReplyOnBehalf !== undefined) {
      delegate.mayReplyOnBehalf = dto.mayReplyOnBehalf;
    } else if (applyDefaults && delegate.mayReplyOnBehalf === undefined) {
      delegate.mayReplyOnBehalf = false;
    }
    if (dto.replyDisclosure !== undefined) {
      delegate.replyDisclosureConceptId =
        dto.replyDisclosure === 'HIDE'
          ? DELEG.REPLY_DISCLOSURE_HIDE
          : DELEG.REPLY_DISCLOSURE_SHOW;
    } else if (applyDefaults && !delegate.replyDisclosureConceptId) {
      delegate.replyDisclosureConceptId = DELEG.REPLY_DISCLOSURE_SHOW;
    }
  }

  /** Carga una delegación de apoyo que sea de este doctor y de la organización activa. */
  private async loadOwn(
    tx: EntityManager,
    delegateId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ): Promise<{ delegate: PractitionerDelegateAssignments; userId: string }> {
    const profileId = this.requireProfile(actor);
    const delegate = await this.delegatesRepo.findById(tx, delegateId);
    const roles = delegate
      ? await this.access.findRoleAssignments(tx, [
          delegate.practitionerRoleAssignmentId,
        ])
      : new Map<string, RoleAssignmentInfo>();
    const role = delegate
      ? roles.get(delegate.practitionerRoleAssignmentId)
      : undefined;
    const [record] = delegate
      ? await this.access.findEngagements(tx, {
          ids: [delegate.delegateUserAssignmentId],
          tenantId,
        })
      : [];
    if (
      !delegate ||
      !role ||
      role.tenantId !== tenantId ||
      role.practitionerProfileId !== profileId ||
      !record
    ) {
      throw new ResourceNotFoundException(
        'Delegación no encontrada',
        undefined,
        Reason.SUPPORT_DELEGATE_NOT_FOUND,
      );
    }
    return { delegate, userId: record.userId };
  }

  /** El doctor actúa con su perfil profesional del token; sin él no hay equipo. */
  private requireProfile(actor: AuthenticatedUser): string {
    if (!actor.practitionerProfileId) {
      throw new ForbiddenException(
        'La cuenta no tiene perfil profesional: no tiene equipo de apoyo.',
      );
    }
    return actor.practitionerProfileId;
  }
}

/**
 * Estado de un integrante para el doctor: una delegación activa que él todavía
 * no aceptó espera su aceptación; una retirada, suspendida o vencida ya no
 * integra el equipo.
 */
function teamStatus(
  delegateStatus: string,
  accepted: boolean,
): 'PENDING_ACCEPTANCE' | 'ACTIVE' | 'REVOKED' {
  if (delegateStatus !== 'ACTIVE') return 'REVOKED';
  return accepted ? 'ACTIVE' : 'PENDING_ACCEPTANCE';
}

/** Código legible del estado de una delegación. */
function statusCode(conceptId: string): string {
  if (conceptId === STATUS.ACTIVE) return 'ACTIVE';
  if (conceptId === STATUS.SUSPENDED) return 'SUSPENDED';
  if (conceptId === STATUS.REVOKED) return 'REVOKED';
  if (conceptId === STATUS.EXPIRED) return 'EXPIRED';
  return 'UNKNOWN';
}
