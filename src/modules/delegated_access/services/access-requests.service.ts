import { ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE,
  platformPermissionId,
} from '../../authz/authz.seed';
import {
  SupportAccessRepository,
  DelegatedAccessApprovalRequestsRepository,
  PractitionerDelegateAssignmentsRepository,
  DelegatedAccessGrantsRepository,
  DelegationEventsRepository,
} from '../repositories';
import {
  CreateSupportAccessRequestDto,
  CreateAccessRequestDto,
  DecideAccessRequestDto,
  ResourceCreatedDto,
  DecisionResultDto,
} from '../dto';
import type { PractitionerDelegateAssignments } from '../entities';
import { DELEG } from '../delegated_access.concepts';
import { PERMISSION_ATOM_BY_ID } from '../domain';
import { DelegationScopeService } from './delegation-scope.service';
import { SupportAccessPolicy } from './support-access.policy';
import { supportDecisionToException } from './support-decision-http';
import {
  GRANT_TYPE_CONCEPT,
  PURPOSE_OF_USE_CONCEPT,
  RESOURCE_TYPE_CONCEPT,
  STATUS,
} from './concept-maps';

/**
 * UC-29-04 (solicitar acceso delegado con aprobación previa) y UC-29-05
 * (aprobar/denegar y emitir grant scoped). Al aprobar, el grant se emite en la
 * misma transacción que cierra la solicitud.
 */
@Injectable()
export class AccessRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param requestsRepo - Valor de requests repo requerido por la operación.
   * @param delegatesRepo - Valor de delegates repo requerido por la operación.
   * @param grantsRepo - Valor de grants repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param scope - Política común de alcance por tenant (obligatoria: sin ella
   *   la autorización no se puede saltar en silencio).
   * @param access - Vínculos y delegaciones de la persona de apoyo.
   * @param policy - Política de apoyo: decide el átomo de pedir acceso clínico a
   *   quien tiene permisos escritos como átomos (sin ella rige solo el alias).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: DelegatedAccessApprovalRequestsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly grantsRepo: DelegatedAccessGrantsRepository,
    private readonly eventsRepo: DelegationEventsRepository,
    private readonly logger: PinoLogger,
    private readonly scope: DelegationScopeService,
    private readonly access: SupportAccessRepository,
    @Optional() private readonly policy?: SupportAccessPolicy,
  ) {
    this.logger.setContext(AccessRequestsService.name);
  }

  /**
   * UC-29-04: abre una solicitud de acceso delegado (decisión PENDING). La
   * delegación tiene que ser de la organización activa y el paciente y el
   * encuentro pedidos, existir en ella.
   */
  async requestAccess(
    delegateId: string,
    dto: CreateAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'delegated_access.request.open',
        delegateId,
        actorId: actor.id,
      },
      'Opening delegated access request',
    );
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const { delegate } = await this.scope.loadDelegationInTenant(
        tx,
        delegateId,
        tenantId,
      );
      await this.scope.assertGrantTarget(
        tx,
        tenantId,
        dto.patientProfileId,
        dto.encounterId,
      );
      return this.openRequest(tx, delegate, dto, actor);
    });
  }

  /**
   * Caso 10: la persona de apoyo pide ver la historia clínica de un paciente.
   * Sale por la delegación que el doctor ya aceptó con ella; sin vínculo en la
   * organización o sin esa aceptación no hay a quién pedirle.
   *
   * @param dto - Organización, doctor, paciente, motivo.
   * @param actor - La persona de apoyo.
   * @returns La solicitud abierta, pendiente de la decisión del doctor.
   */
  async requestAsSupport(
    dto: CreateSupportAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.em.transactional(async (tx) => {
      const engagements = await this.access.findEngagements(tx, {
        userId: actor.id,
        tenantId: dto.tenantId,
      });
      if (engagements.length === 0) {
        throw new ForbiddenException(
          'No tiene un vínculo de apoyo en esa organización',
        );
      }
      const delegations = await this.access.findDelegationsOfEngagements(
        tx,
        engagements.map((e) => e.assignment.id),
      );
      const found = delegations.find(
        (d) =>
          d.practitionerProfileId === dto.practitionerProfileId &&
          !!d.delegate.acceptedAt &&
          d.delegate.statusConceptId === STATUS.ACTIVE,
      );
      if (!found) {
        throw new ResourceNotFoundException('Delegación no encontrada', {});
      }
      await this.assertMayRequestClinicalAccess(
        tx,
        engagements.map((e) => e.assignment.id),
        dto,
        actor,
      );
      await this.scope.assertGrantTarget(
        tx,
        dto.tenantId,
        dto.patientProfileId,
        dto.encounterId,
      );
      const opened = await this.openRequest(
        tx,
        found.delegate,
        {
          requestedPermissionId: platformPermissionId(
            CLINICAL_RECORD_TEMPORARY_VIEW_PERMISSION_CODE,
          ),
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          reasonText: dto.reasonText,
        },
        actor,
      );
      return { ...opened, tenantId: dto.tenantId };
    });
  }

  /**
   * El átomo `patients.clinical.request_temporary_access` (pedir acceso clínico
   * temporal; decide el doctor) se exige SOLO a quien tiene permisos escritos
   * como átomos: quien conserva los códigos de siempre lo tiene implícito
   * (CONTRATO-GOBIERNO §2.3 regla 3b), así que sus rutas no cambian. La decisión
   * la toma la política (reglas de la organización, condiciones, motivo y paso
   * extra) y un desafío se traduce a su 403/422 estable.
   */
  private async assertMayRequestClinicalAccess(
    tx: EntityManager,
    engagementIds: readonly string[],
    dto: CreateSupportAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!this.policy) return;
    const grants = await this.access.findGrantsWithActions(tx, engagementIds);
    const writtenAsAtoms = grants.some((g) =>
      g.actions.some((a) => PERMISSION_ATOM_BY_ID.has(a.permissionId)),
    );
    if (!writtenAsAtoms) return;
    const decision = await this.policy.can(
      {
        userId: actor.id,
        tenantId: dto.tenantId,
        action: 'patients.clinical.request_temporary_access',
        practitionerProfileId: dto.practitionerProfileId,
        context: {
          patientProfileId: dto.patientProfileId,
          ...(dto.reasonText ? { proof: { reasonText: dto.reasonText } } : {}),
        },
      },
      tx,
    );
    const refusal = supportDecisionToException(
      decision,
      'Su vínculo de apoyo no le permite pedir acceso clínico.',
    );
    if (refusal) throw refusal;
  }

  /** Abre la solicitud sobre una delegación ya validada. */
  private async openRequest(
    tx: EntityManager,
    delegate: PractitionerDelegateAssignments,
    dto: CreateAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    if (delegate.statusConceptId !== STATUS.ACTIVE) {
      throw new PreconditionFailedException('La delegación no está activa', {
        delegateId: delegate.id,
      });
    }
    const dup = await this.requestsRepo.findOpenDuplicate(
      tx,
      DELEG.REQUEST_OPEN,
      delegate.id,
      dto.requestedPermissionId,
      dto.patientProfileId,
      dto.encounterId,
    );
    if (dup) {
      throw new ConflictException(
        'Ya existe una solicitud pendiente equivalente',
        {
          delegateId: delegate.id,
          requestedPermissionId: dto.requestedPermissionId,
        },
      );
    }
    const request = this.requestsRepo.create(tx, {
      practitionerDelegateAssignmentId: delegate.id,
      requestedPermissionId: dto.requestedPermissionId,
      patientProfileId: dto.patientProfileId,
      encounterId: dto.encounterId,
      reasonText: dto.reasonText,
      decisionConceptId: STATUS.PENDING,
      statusConceptId: DELEG.REQUEST_OPEN,
    });
    await tx.flush();
    this.eventsRepo.record(tx, {
      practitionerDelegateAssignmentId: delegate.id,
      eventTypeConceptId: DELEG.EVENT_ACCESS_REQUESTED,
      actorUserId: actor.id,
    });
    this.logger.info(
      { operation: 'delegated_access.request.open', requestId: request.id },
      'Delegated access request opened',
    );
    return {
      id: request.id,
      status: request.statusConceptId,
      createdAt: request.createdAt,
    };
  }

  /**
   * UC-29-05: decide la solicitud; si se aprueba emite el permiso acotado.
   * Decide únicamente el doctor titular de la delegación, en su organización
   * activa: la administración no aprueba lo que pide su propio personal.
   */
  async decide(
    requestId: string,
    dto: DecideAccessRequestDto,
    actor: AuthenticatedUser,
  ): Promise<DecisionResultDto> {
    this.logger.info(
      {
        operation: 'delegated_access.request.decide',
        requestId,
        decision: dto.decision,
        actorId: actor.id,
      },
      'Deciding delegated access request',
    );
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const request = await this.requestsRepo.findById(tx, requestId);
      if (!request) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          requestId,
        });
      }
      // El alcance se prueba ANTES de mirar el estado: una solicitud de otra
      // organización responde como una inexistente (404 uniforme), nunca con su
      // estado (A-M1: un 412 «no está abierta» confirmaba que el id existe).
      const { delegate } = await this.scope.loadDelegationInTenant(
        tx,
        request.practitionerDelegateAssignmentId,
        tenantId,
      );
      if (request.statusConceptId !== DELEG.REQUEST_OPEN) {
        throw new PreconditionFailedException('La solicitud no está abierta', {
          requestId,
        });
      }
      await this.scope.assertOwningDoctor(tx, delegate, actor);
      if (dto.decision === 'APPROVED') {
        await this.scope.assertGrantTarget(
          tx,
          tenantId,
          request.patientProfileId,
          dto.encounterId ?? request.encounterId,
        );
      }

      const approved = dto.decision === 'APPROVED';
      request.decisionConceptId = approved
        ? DELEG.DECISION_APPROVED
        : DELEG.DECISION_DENIED;
      request.decidedAt = new Date();
      request.decidedByUserId = actor.id;
      request.statusConceptId = DELEG.REQUEST_CLOSED;

      let grantId: string | undefined;
      if (approved) {
        const grant = this.grantsRepo.create(tx, {
          practitionerDelegateAssignmentId:
            request.practitionerDelegateAssignmentId,
          grantTypeConceptId: GRANT_TYPE_CONCEPT.APPROVED,
          purposeOfUseConceptId:
            PURPOSE_OF_USE_CONCEPT[dto.purpose ?? 'TREATMENT'],
          patientProfileId: request.patientProfileId,
          encounterId: dto.encounterId ?? request.encounterId,
          resourceTypeConceptId: dto.resourceType
            ? RESOURCE_TYPE_CONCEPT[dto.resourceType]
            : undefined,
          validFrom: new Date(),
          validTo: dto.validTo
            ? new Date(dto.validTo)
            : new Date(Date.now() + 24 * 3600 * 1000),
          approvedByUserId: actor.id,
          statusConceptId: STATUS.ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
        grantId = grant.id;
      }

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId:
          request.practitionerDelegateAssignmentId,
        eventTypeConceptId: approved
          ? DELEG.EVENT_ACCESS_APPROVED
          : DELEG.EVENT_ACCESS_DENIED,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'delegated_access.request.decide',
          requestId,
          approved,
          grantId,
        },
        'Delegated access request decided',
      );
      return { requestId: request.id, decision: dto.decision, grantId };
    });
  }
}
