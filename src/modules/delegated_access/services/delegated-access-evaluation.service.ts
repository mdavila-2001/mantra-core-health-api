import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import {
  DelegatedAccessGrantsRepository,
  PractitionerDelegateAssignmentsRepository,
  OrganizationUserAssignmentsRepository,
  DelegatedPermissionSetItemsRepository,
  DelegationEventsRepository,
} from '../repositories';
import {
  EvaluateActorDto,
  EvaluationResultDto,
  ExpirySweepResultDto,
} from '../dto';
import { DELEG } from '../delegated_access.concepts';
import {
  PURPOSE_OF_USE_CONCEPT,
  RESOURCE_TYPE_CONCEPT,
  STATUS,
} from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';

/**
 * UC-29-08 (barrido de expiración de delegaciones y grants vencidos) y UC-29-09
 * (evaluación del actor efectivo por propósito, con step-up). La evaluación no
 * hace impersonación: audita al delegado y a la delegación.
 */
@Injectable()
export class DelegatedAccessEvaluationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grantsRepo - Valor de grants repo requerido por la operación.
   * @param delegatesRepo - Valor de delegates repo requerido por la operación.
   * @param orgAssignmentsRepo - Valor de org assignments repo requerido por la operación.
   * @param itemsRepo - Valor de items repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param scope - Política común de tenant y alcance de la delegación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly grantsRepo: DelegatedAccessGrantsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly orgAssignmentsRepo: OrganizationUserAssignmentsRepository,
    private readonly itemsRepo: DelegatedPermissionSetItemsRepository,
    private readonly eventsRepo: DelegationEventsRepository,
    private readonly scope: DelegationScopeService,
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

      const grants = await this.grantsRepo.findOverdueActive(
        tx,
        now,
        STATUS.ACTIVE,
      );
      for (const grant of grants) {
        grant.statusConceptId = STATUS.EXPIRED;
        touch(grant, actor.id, now);
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId:
            grant.practitionerDelegateAssignmentId,
          eventTypeConceptId: DELEG.EVENT_DELEGATION_EXPIRED,
          actorUserId: actor.id,
          reasonConceptId: DELEG.REASON_EXPIRED,
        });
      }

      const delegates = await this.delegatesRepo.findOverdueActive(
        tx,
        now,
        STATUS.ACTIVE,
      );
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

      const orgAssignments = await this.orgAssignmentsRepo.findOverdueActive(
        tx,
        now,
        STATUS.ACTIVE,
      );
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

  /**
   * UC-29-09: evalúa el actor efectivo por propósito; puede exigir step-up.
   *
   * La delegación se carga dentro del tenant activo (una ajena responde 404
   * uniforme) y el sujeto evaluado tiene que ser el titular de la asignación
   * del delegado: `dto.effectiveUserId` si el administrador lo declara para
   * diagnosticar, o el propio actor autenticado si no. Un sujeto que no es el
   * delegado nunca recibe `allowed: true`, de modo que el resultado no se puede
   * reutilizar para habilitar a otra persona.
   */
  async evaluate(
    dto: EvaluateActorDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationResultDto> {
    this.logger.info(
      {
        operation: 'delegated_access.evaluate',
        delegateId: dto.practitionerDelegateAssignmentId,
        purpose: dto.purpose,
        actorId: actor.id,
      },
      'Evaluating effective actor',
    );
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const { delegate } = await this.scope.loadDelegationInTenant(
        tx,
        dto.practitionerDelegateAssignmentId,
        tenantId,
      );

      const subjectUserId = dto.effectiveUserId ?? actor.id;
      const orgAssignment = await this.orgAssignmentsRepo.findById(
        tx,
        delegate.delegateUserAssignmentId,
      );
      const membership = orgAssignment
        ? await this.scope.membershipOfAssignment(tx, orgAssignment)
        : null;
      if (
        !membership ||
        membership.tenantId !== tenantId ||
        membership.userId !== subjectUserId
      ) {
        this.eventsRepo.record(tx, {
          practitionerDelegateAssignmentId: delegate.id,
          eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
          actorUserId: actor.id,
        });
        return {
          allowed: false,
          requiresStepUp: false,
          reason: DelegatedAccessErrorReason.DELEGATED_SUBJECT_MISMATCH,
        };
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
        return {
          allowed: false,
          requiresStepUp: false,
          reason: 'NO_ACTIVE_DELEGATION',
        };
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
        return {
          allowed: false,
          requiresStepUp: false,
          reason: 'NO_MATCHING_GRANT',
        };
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
        return {
          allowed: false,
          requiresStepUp: true,
          reason: 'STEP_UP_REQUIRED',
        };
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
