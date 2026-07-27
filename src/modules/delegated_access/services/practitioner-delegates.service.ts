import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PractitionerDelegateAssignmentsRepository,
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetsRepository,
  DelegatedAccessGrantsRepository,
  DelegatedAccessApprovalRequestsRepository,
  DelegationEventsRepository,
} from '../repositories';
import {
  CreatePractitionerDelegateDto,
  CreateGrantDto,
  RevokeDelegationDto,
  ResourceCreatedDto,
  OperationResultDto,
} from '../dto';
import { DELEG } from '../delegated_access.concepts';
import {
  APPOINTMENT_SCOPE_CONCEPT,
  DELEGATE_ROLE_CONCEPT,
  GRANT_TYPE_CONCEPT,
  PATIENT_SCOPE_CONCEPT,
  PURPOSE_OF_USE_CONCEPT,
  RESOURCE_TYPE_CONCEPT,
  STATUS,
} from './concept-maps';

/**
 * UC-29-03 (crear delegación de practitioner), UC-29-06 (emitir grant temporal
 * pre-autorizado) y UC-29-07 (revocar delegación en cascada). Cada escritura deja
 * un asiento en el ledger `delegation_events`.
 */
@Injectable()
export class PractitionerDelegatesService {
  constructor(
    private readonly em: EntityManager,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly orgAssignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly setsRepo: DelegatedPermissionSetsRepository,
    private readonly grantsRepo: DelegatedAccessGrantsRepository,
    private readonly requestsRepo: DelegatedAccessApprovalRequestsRepository,
    private readonly eventsRepo: DelegationEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerDelegatesService.name);
  }

  /** UC-29-03: crea una delegación de practitioner sobre un org user y un set. */
  async createDelegate(
    dto: CreatePractitionerDelegateDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      { operation: 'delegated_access.delegate.create', actorId: actor.id },
      'Creating practitioner delegate assignment',
    );
    return this.em.transactional(async (tx) => {
      const orgAssignment = await this.orgAssignmentsRepo.findById(
        tx,
        dto.delegateUserAssignmentId,
      );
      if (!orgAssignment) {
        throw new ResourceNotFoundException(
          'Asignación de usuario de organización no encontrada',
          {
            delegateUserAssignmentId: dto.delegateUserAssignmentId,
          },
        );
      }
      if (orgAssignment.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException(
          'El usuario de organización no está activo',
          {
            delegateUserAssignmentId: dto.delegateUserAssignmentId,
          },
        );
      }

      const set = await this.setsRepo.findById(
        tx,
        dto.delegatedPermissionSetId,
      );
      if (!set) {
        throw new ResourceNotFoundException('Set de permisos no encontrado', {
          delegatedPermissionSetId: dto.delegatedPermissionSetId,
        });
      }
      if (set.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException(
          'El set de permisos no está activo',
          {
            delegatedPermissionSetId: dto.delegatedPermissionSetId,
          },
        );
      }

      const delegate = this.delegatesRepo.create(tx, {
        practitionerRoleAssignmentId: dto.practitionerRoleAssignmentId,
        delegateUserAssignmentId: dto.delegateUserAssignmentId,
        delegatedPermissionSetId: dto.delegatedPermissionSetId,
        delegateRoleConceptId:
          DELEGATE_ROLE_CONCEPT[dto.delegateRole ?? 'ASSISTANT'],
        patientScopeConceptId: dto.patientScope
          ? PATIENT_SCOPE_CONCEPT[dto.patientScope]
          : undefined,
        appointmentScopeConceptId: dto.appointmentScope
          ? APPOINTMENT_SCOPE_CONCEPT[dto.appointmentScope]
          : undefined,
        mayViewClinicalContent: dto.mayViewClinicalContent,
        mayEditDrafts: dto.mayEditDrafts,
        // CONTROL: firmar contenido clínico nunca se delega por este flujo.
        maySignClinicalContent: false,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: STATUS.ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId: delegate.id,
        eventTypeConceptId: DELEG.EVENT_DELEGATION_CREATED,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'delegated_access.delegate.create',
          delegateId: delegate.id,
        },
        'Practitioner delegate assignment created',
      );
      return {
        id: delegate.id,
        status: delegate.statusConceptId,
        createdAt: delegate.createdAt,
      };
    });
  }

  /** UC-29-06: emite un grant delegado por-propósito y temporal (pre-autorizado). */
  async issueGrant(
    delegateId: string,
    dto: CreateGrantDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    this.logger.info(
      {
        operation: 'delegated_access.grant.issue',
        delegateId,
        actorId: actor.id,
      },
      'Issuing delegated grant',
    );
    return this.em.transactional(async (tx) => {
      const delegate = await this.delegatesRepo.findById(tx, delegateId);
      if (!delegate) {
        throw new ResourceNotFoundException('Delegación no encontrada', {
          delegateId,
        });
      }
      if (delegate.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException('La delegación no está activa', {
          delegateId,
        });
      }

      const grant = this.grantsRepo.create(tx, {
        practitionerDelegateAssignmentId: delegateId,
        grantTypeConceptId: GRANT_TYPE_CONCEPT.PRE_AUTHORIZED,
        purposeOfUseConceptId: PURPOSE_OF_USE_CONCEPT[dto.purpose],
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        resourceTypeConceptId: dto.resourceType
          ? RESOURCE_TYPE_CONCEPT[dto.resourceType]
          : undefined,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validTo: new Date(dto.validTo),
        approvedByUserId: actor.id,
        statusConceptId: STATUS.ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId: delegateId,
        eventTypeConceptId: DELEG.EVENT_GRANT_ISSUED,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'delegated_access.grant.issue', grantId: grant.id },
        'Delegated grant issued',
      );
      return {
        id: grant.id,
        status: grant.statusConceptId,
        createdAt: grant.createdAt,
      };
    });
  }

  /** UC-29-07: revoca la delegación de forma inmediata con cascada authz. */
  async revoke(
    delegateId: string,
    dto: RevokeDelegationDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    this.logger.info(
      {
        operation: 'delegated_access.delegate.revoke',
        delegateId,
        actorId: actor.id,
      },
      'Revoking delegation',
    );
    return this.em.transactional(async (tx) => {
      const delegate = await this.delegatesRepo.findById(tx, delegateId);
      if (!delegate) {
        throw new ResourceNotFoundException('Delegación no encontrada', {
          delegateId,
        });
      }
      // Idempotente: si ya está revocada no se hace nada.
      if (delegate.statusConceptId === STATUS.REVOKED) {
        return { ok: true };
      }

      const now = new Date();
      delegate.statusConceptId = STATUS.REVOKED;
      delegate.validTo = now;
      touch(delegate, actor.id);

      await this.grantsRepo.revokeActiveByAssignment(
        tx,
        delegateId,
        STATUS.ACTIVE,
        STATUS.REVOKED,
        now,
        actor.id,
      );
      await this.requestsRepo.cancelOpenByAssignment(
        tx,
        delegateId,
        DELEG.REQUEST_OPEN,
        DELEG.REQUEST_CANCELLED,
      );

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId: delegateId,
        eventTypeConceptId: DELEG.EVENT_DELEGATION_REVOKED,
        actorUserId: actor.id,
        reasonConceptId: DELEG.REASON_REVOKED_MANUAL,
      });

      this.logger.info(
        {
          operation: 'delegated_access.delegate.revoke',
          delegateId,
          reason: dto.reason,
        },
        'Delegation revoked',
      );
      return { ok: true };
    });
  }
}
