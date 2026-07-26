import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ResourceNotFoundException, touch, type AuthenticatedUser } from '../../../common';
import {
  DelegatedAccessGrantsRepository,
  PractitionerDelegateAssignmentsRepository,
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetItemsRepository,
  DelegationEventsRepository,
} from '../repositories';
import { EvaluateActorDto, EvaluationResultDto, ExpirySweepResultDto } from '../dto';
import { DELEG } from '../delegated_access.concepts';
import { PURPOSE_OF_USE_CONCEPT, RESOURCE_TYPE_CONCEPT, STATUS } from './concept-maps';

/**
 * UC-29-08 (barrido de expiración de delegaciones y grants vencidos) y UC-29-09
 * (evaluación del actor efectivo por propósito, con step-up). La evaluación no
 * hace impersonación: audita al delegado y a la delegación.
 */
@Injectable()
export class DelegatedAccessEvaluationService {
  constructor(
    private readonly em: EntityManager,
    private readonly grantsRepo: DelegatedAccessGrantsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly orgAssignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly itemsRepo: DelegatedPermissionSetItemsRepository,
    private readonly eventsRepo: DelegationEventsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DelegatedAccessEvaluationService.name);
  }

  /** UC-29-08: expira grants, delegaciones y asignaciones org vencidos (barrido). */
  async expirySweep(actor: AuthenticatedUser): Promise<ExpirySweepResultDto> {
    this.logger.info(
      { operation: 'delegated_access.sweep', actorId: actor.id },
      'Running delegated-access expiry sweep',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();

      const grants = await this.grantsRepo.findOverdueActive(tx, now, STATUS.ACTIVE);
      for (const grant of grants) {
        grant.statusConceptId = STATUS.EXPIRED;
        touch(grant, actor.id, now);
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: grant.practitionerDelegateAssignmentId,
          eventTypeConceptId: DELEG.EVENT_DELEGATION_EXPIRED,
          actorUserId: actor.id,
          reasonConceptId: DELEG.REASON_EXPIRED,
        });
      }

      const delegates = await this.delegatesRepo.findOverdueActive(tx, now, STATUS.ACTIVE);
      for (const delegate of delegates) {
        delegate.statusConceptId = STATUS.EXPIRED;
        touch(delegate, actor.id, now);
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_DELEGATION_EXPIRED,
          actorUserId: actor.id,
          reasonConceptId: DELEG.REASON_EXPIRED,
        });
      }

      const orgAssignments = await this.orgAssignmentsRepo.findOverdueActive(tx, now, STATUS.ACTIVE);
      for (const assignment of orgAssignments) {
        assignment.statusConceptId = STATUS.EXPIRED;
        touch(assignment, actor.id, now);
      }

      this.logger.info(
        {
          operation: 'delegated_access.sweep',
          grants: grants.length,
          delegations: delegates.length,
          orgAssignments: orgAssignments.length,
        },
        'Expiry sweep completed',
      );
      return {
        expiredGrants: grants.length,
        expiredDelegations: delegates.length,
        expiredOrgAssignments: orgAssignments.length,
      };
    });
  }

  /** UC-29-09: evalúa el actor efectivo por propósito; puede exigir step-up. */
  async evaluate(dto: EvaluateActorDto, actor: AuthenticatedUser): Promise<EvaluationResultDto> {
    this.logger.info(
      {
        operation: 'delegated_access.evaluate',
        delegateId: dto.practitionerDelegateAssignmentId,
        purpose: dto.purpose,
        actorId: actor.id,
      },
      'Evaluating effective actor',
    );
    return this.em.transactional(async (tx) => {
      const delegate = await this.delegatesRepo.findById(tx, dto.practitionerDelegateAssignmentId);
      if (!delegate) {
        throw new ResourceNotFoundException('Delegación no encontrada', {
          delegateId: dto.practitionerDelegateAssignmentId,
        });
      }

      const now = new Date();
      const withinWindow =
        delegate.statusConceptId === STATUS.ACTIVE &&
        (!delegate.validFrom || delegate.validFrom <= now) &&
        (!delegate.validTo || delegate.validTo > now);

      if (!withinWindow) {
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
          actorUserId: actor.id,
        });
        return { allowed: false, requiresStepUp: false, reason: 'NO_ACTIVE_DELEGATION' };
      }

      const grant = await this.grantsRepo.findActiveMatch(
        tx,
        STATUS.ACTIVE,
        delegate.id,
        PURPOSE_OF_USE_CONCEPT[dto.purpose],
        dto.patientProfileId,
        dto.encounterId,
        dto.resourceType ? RESOURCE_TYPE_CONCEPT[dto.resourceType] : undefined,
      );
      if (!grant) {
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
          actorUserId: actor.id,
        });
        return { allowed: false, requiresStepUp: false, reason: 'NO_MATCHING_GRANT' };
      }

      // Step-up: si el ítem del permiso lo exige, se bloquea hasta verificación reforzada.
      let requiresStepUp = false;
      if (dto.permissionId) {
        const item = await this.itemsRepo.findBySetAndPermission(
          tx,
          delegate.delegatedPermissionSetId,
          dto.permissionId,
        );
        requiresStepUp = item?.requiresStepUpAuthentication === true;
      }

      if (requiresStepUp) {
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_STEP_UP_REQUIRED,
          actorUserId: actor.id,
        });
        return { allowed: false, requiresStepUp: true, reason: 'STEP_UP_REQUIRED' };
      }

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId: delegate.id,
        eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
        actorUserId: actor.id,
      });
      return { allowed: true, requiresStepUp: false };
    });
  }
}
