import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  CLAIM_DECISION_PUBLISHER_PORT,
  type ClaimDecisionPublisherPort,
} from '../ports/claim-decision-publisher.port';
import {
  PATIENT_OWNERSHIP_PORT,
  type PatientOwnershipPort,
} from '../ports/patient-ownership.port';
import {
  INSURANCE_PRACTICE_TENANT_LOOKUP_PORT,
  type InsurancePracticeTenantLookupPort,
} from '../ports/practice-tenant-lookup.port';
import {
  ClaimRepository,
  CoverageRepository,
} from '../../infrastructure/repositories';
import { INS } from '../../domain/insurance.concepts';
import {
  CLAIM_AGGREGATE_TYPE,
  PATIENT_PROTECTION_EVENT,
} from '../../domain/patient-protection-events';
import type {
  ClaimDisputeDto,
  PatientObjectionReason,
  ResourceStatusDto,
} from '../../presentation/dto';
import {
  authorizeClaimResource,
  claimAccessDenied,
} from './linked-claim-access.service';

/** Motivo cerrado de la objeción → concepto que se guarda en la disputa. */
const OBJECTION_REASON_CONCEPT: Record<PatientObjectionReason, string> = {
  AMOUNT_DIFFERS: INS.DISPUTE_REASON_CHARGE_AMOUNT,
  SERVICE_NOT_RECEIVED: INS.DISPUTE_REASON_SERVICE_NOT_RECEIVED,
  NOT_INFORMED: INS.DISPUTE_REASON_NOT_INFORMED,
};

/** Motivo tipificado del 422 cuando el reclamo ya no admite objeciones. */
export const PATIENT_OBJECTION_REASON = {
  CLAIM_REVERSED_NOT_DISPUTABLE: 'CLAIM_REVERSED_NOT_DISPUTABLE',
} as const;

type ObjectionOutcome =
  | { readonly kind: 'opened'; readonly result: ResourceStatusDto }
  | { readonly kind: 'existing'; readonly result: ResourceStatusDto }
  | { readonly kind: 'rejected'; readonly tenantId: string | null };

/**
 * Objeción del paciente a un cobro de su seguro (carril 16, REQ-16-032 y 033).
 *
 * Reutiliza el mecanismo de disputa del módulo (`insurance.claim_disputes`): la
 * objeción es una disputa de tipo «objeción del paciente», iniciada por la
 * parte paciente, que **resuelve la práctica con copia a la aseguradora** (que
 * la ve en el detalle del reclamo). Mientras no esté resuelta, el cobro de las
 * facturas vinculadas a ese reclamo queda en pausa: la pausa se deriva de esta
 * misma disputa (ver `InvoicesRepository.hasOpenPatientObjection`), así que
 * resolverla por la apelación existente la levanta sin un segundo camino.
 *
 * - **Propiedad**: sólo quien es titular del perfil de paciente de la cobertura
 *   del reclamo. Un reclamo ajeno y uno inexistente dan el mismo 403 sin
 *   detalles, y ese rechazo no publica nada (no confirma qué ids existen).
 * - **Idempotente**: objetar dos veces devuelve la misma disputa. El
 *   `FOR UPDATE` del reclamo lo garantiza también entre pedidos simultáneos.
 * - **Sin plazo**: el propietario no definió uno, así que no vence.
 * - Sin texto libre: sólo un motivo cerrado (puede ser un dato de salud).
 */
@Injectable()
export class PatientChargeObjectionService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ClaimRepository,
    private readonly coverages: CoverageRepository,
    @Inject(PATIENT_OWNERSHIP_PORT)
    private readonly ownership: PatientOwnershipPort,
    @Inject(CLAIM_DECISION_PUBLISHER_PORT)
    private readonly publisher: ClaimDecisionPublisherPort,
    @Inject(INSURANCE_PRACTICE_TENANT_LOOKUP_PORT)
    private readonly practiceLookup: InsurancePracticeTenantLookupPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PatientChargeObjectionService.name);
  }

  /**
   * @param claimId - Reclamo cuyo cobro se objeta.
   * @param dto - Motivo cerrado de la objeción.
   * @param actor - La persona que objeta.
   * @returns La disputa abierta, o la que ya estaba abierta.
   * @throws ForbiddenException (mismo cuerpo) si el reclamo no existe o no es suyo.
   * @throws PreconditionFailedException (422) si el reclamo fue revertido.
   */
  async object(
    claimId: string,
    dto: ClaimDisputeDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.claim.objection', claimId, actorId: actor.id },
      'Patient objecting to a charge',
    );
    const reason = dto.objectionReason ?? 'NOT_INFORMED';

    const outcome = await this.em.transactional(
      async (tx): Promise<ObjectionOutcome> => {
        // El lock va primero: dos objeciones simultáneas se serializan acá.
        const claim = await this.repo.findClaimForUpdate(tx, claimId);
        if (!claim) throw claimAccessDenied();
        const coverage = await this.coverages.findCoverage(
          tx,
          claim.patientCoverageId,
        );
        if (!coverage) throw claimAccessDenied();
        // Ajeno e inexistente responden igual: `authorizeClaimResource` unifica
        // el 403 del puerto de propiedad con el de «no hay acceso».
        await authorizeClaimResource(() =>
          this.ownership.assertOwnsPatientProfile(
            tx,
            coverage.patientProfileId,
            actor,
          ),
        );

        const tenantId = await this.practiceLookup.findTenantOfPractice(
          claim.billingProviderEntityId,
        );
        if (claim.statusConceptId === INS.CLAIM_REVERSED) {
          return { kind: 'rejected', tenantId };
        }

        const existing = await this.repo.findOpenDispute(
          tx,
          claim.id,
          undefined,
          INS.DISPUTE_OPEN,
          INS.DISPUTE_TYPE_PATIENT_OBJECTION,
        );
        if (existing) {
          return {
            kind: 'existing',
            result: {
              id: existing.id,
              status: existing.statusConceptId,
              createdAt: existing.createdAt,
            },
          };
        }

        const dispute = this.repo.createDispute(tx, {
          insuranceClaimId: claim.id,
          disputeTypeConceptId: INS.DISPUTE_TYPE_PATIENT_OBJECTION,
          disputeReasonConceptId: OBJECTION_REASON_CONCEPT[reason],
          initiatedByPartyTypeConceptId: INS.PARTY_PATIENT,
          initiatedByEntityId: coverage.patientProfileId,
          submittedAt: new Date(),
          statusConceptId: INS.DISPUTE_OPEN,
          actorUserId: actor.id,
        });
        // Sin plazo: el propietario no lo definió, la objeción no vence.
        if (tenantId) {
          await this.publisher.publish(tx, {
            tenantId,
            eventType: PATIENT_PROTECTION_EVENT.PATIENT_CHARGE_OBJECTED,
            aggregateType: CLAIM_AGGREGATE_TYPE,
            aggregateId: claim.id,
            payloadJson: {
              claimId: claim.id,
              disputeId: dispute.id,
              patientProfileId: coverage.patientProfileId,
              practiceId: claim.billingProviderEntityId,
              insuranceCarrierId: claim.insuranceCarrierId,
              objectionReason: reason,
              actorUserId: actor.id,
            },
          });
        } else {
          this.logger.warn(
            { operation: 'insurance.claim.objection', claimId },
            'Practice has no tenant: objection recorded without event',
          );
        }
        await tx.flush();
        return {
          kind: 'opened',
          result: {
            id: dispute.id,
            status: dispute.statusConceptId,
            createdAt: dispute.createdAt,
          },
        };
      },
    );

    if (outcome.kind === 'rejected') {
      await this.publishRejected(claimId, outcome.tenantId, actor);
      throw new PreconditionFailedException(
        'El reclamo fue revertido: ya no hay un cobro que objetar',
        {
          reason: PATIENT_OBJECTION_REASON.CLAIM_REVERSED_NOT_DISPUTABLE,
          claimId,
        },
      );
    }
    return outcome.result;
  }

  /** Registra la objeción rechazada en su propia transacción (REQ-16-034). */
  private async publishRejected(
    claimId: string,
    tenantId: string | null,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!tenantId) return;
    await this.em.transactional(async (tx) => {
      await this.publisher.publish(tx, {
        tenantId,
        eventType: PATIENT_PROTECTION_EVENT.PATIENT_OBJECTION_REJECTED,
        aggregateType: CLAIM_AGGREGATE_TYPE,
        aggregateId: claimId,
        payloadJson: {
          claimId,
          reason: PATIENT_OBJECTION_REASON.CLAIM_REVERSED_NOT_DISPUTABLE,
          actorUserId: actor.id,
        },
      });
      await tx.flush();
    });
  }
}
