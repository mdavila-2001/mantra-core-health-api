import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  DelegatedAccessApprovalRequestsRepository,
  PractitionerDelegateAssignmentsRepository,
  DelegatedAccessGrantsRepository,
  DelegationEventsRepository,
} from '../repositories';
import {
  CreateAccessRequestDto,
  DecideAccessRequestDto,
  ResourceCreatedDto,
  DecisionResultDto,
} from '../dto';
import { DELEG } from '../delegated_access.concepts';
import { DelegationScopeService } from './delegation-scope.service';
import {
  GRANT_TYPE_CONCEPT,
  PURPOSE_OF_USE_CONCEPT,
  RESOURCE_TYPE_CONCEPT,
  STATUS,
} from './concept-maps';

/** El 404 de una solicitud inexistente o ajena: idéntico en ambos casos. */
const requestNotFound = (): ResourceNotFoundException =>
  new ResourceNotFoundException('Solicitud no encontrada');

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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly requestsRepo: DelegatedAccessApprovalRequestsRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly grantsRepo: DelegatedAccessGrantsRepository,
    private readonly eventsRepo: DelegationEventsRepository,
    private readonly logger: PinoLogger,
    private readonly scope: DelegationScopeService,
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
      if (delegate.statusConceptId !== STATUS.ACTIVE) {
        throw new PreconditionFailedException('La delegación no está activa', {
          delegateId,
        });
      }
      await this.scope.assertGrantTarget(
        tx,
        tenantId,
        dto.patientProfileId,
        dto.encounterId,
      );

      const dup = await this.requestsRepo.findOpenDuplicate(
        tx,
        DELEG.REQUEST_OPEN,
        delegateId,
        dto.requestedPermissionId,
        dto.patientProfileId,
        dto.encounterId,
      );
      if (dup) {
        throw new ConflictException(
          'Ya existe una solicitud pendiente equivalente',
          {
            delegateId,
            requestedPermissionId: dto.requestedPermissionId,
          },
        );
      }

      const request = this.requestsRepo.create(tx, {
        practitionerDelegateAssignmentId: delegateId,
        requestedPermissionId: dto.requestedPermissionId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        reasonText: dto.reasonText,
        decisionConceptId: STATUS.PENDING,
        statusConceptId: DELEG.REQUEST_OPEN,
      });
      await tx.flush();

      this.eventsRepo.record(tx, {
        practitionerDelegateAssignmentId: delegateId,
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
    });
  }

  /**
   * UC-29-05: decide la solicitud; si se aprueba emite el grant scoped. La
   * solicitud tiene que ser de la organización activa y, al aprobar, el
   * paciente y el encuentro del grant existir en ella.
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
      if (!request) throw requestNotFound();
      // El alcance se prueba ANTES de mirar el estado: una solicitud de otra
      // organización responde como una inexistente (404 uniforme: mismo
      // mensaje, mismo `reason`, sin `details`), nunca con su estado (un 412
      // «no está abierta» confirmaría que el id existe) ni con el 404 de la
      // delegación (que distinguiría «ajena» de «inexistente»).
      try {
        await this.scope.loadDelegationInTenant(
          tx,
          request.practitionerDelegateAssignmentId,
          tenantId,
        );
      } catch (error) {
        if (error instanceof ResourceNotFoundException) {
          throw requestNotFound();
        }
        throw error;
      }
      if (request.statusConceptId !== DELEG.REQUEST_OPEN) {
        throw new PreconditionFailedException('La solicitud no está abierta', {
          requestId,
        });
      }

      const approved = dto.decision === 'APPROVED';
      if (approved) {
        await this.scope.assertGrantTarget(
          tx,
          tenantId,
          request.patientProfileId,
          dto.encounterId ?? request.encounterId,
        );
      }
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
