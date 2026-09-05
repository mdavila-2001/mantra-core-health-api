import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  sumarDecimales,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  ClaimRepository,
  CoverageRepository,
  CatalogRepository,
} from '../repositories';
import { INS } from '../insurance.concepts';
import {
  CreateClaimDto,
  CreateAdjudicationDto,
  PublishEobDto,
  CreateReversalDto,
  CreateDisputeDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

const LINE_DECISION_CONCEPT: Record<string, string> = {
  APPROVED: INS.LINE_DECISION_APPROVED,
  DENIED: INS.LINE_DECISION_DENIED,
};

/**
 * Ciclo del reclamo: envío 837 (UC-26-06), adjudicación por línea 835 append-only
 * (UC-26-07), publicación de EOB (UC-26-08), reversión (UC-26-10) y apertura de
 * disputa (UC-26-11). Las versiones de adjudicación y las adjudicaciones de línea
 * son inmutables: una re-adjudicación crea una nueva versión que referencia la
 * anterior por `supersedes_version_id` y nunca reescribe la evidencia previa.
 */
@Injectable()
export class ClaimsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param coverage - Valor de coverage requerido por la operación.
   * @param catalog - Valor de catalog requerido por la operación.
   * @param practiceLookup - Puerto de `practice`: las prácticas de la organización.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ClaimRepository,
    private readonly coverage: CoverageRepository,
    private readonly catalog: CatalogRepository,
    private readonly practiceLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClaimsService.name);
  }

  /** UC-26-06: enviar reclamo con líneas. */
  async submitClaim(
    dto: CreateClaimDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.claim.submit', actorId: actor.id },
      'Submitting claim',
    );
    return this.em.transactional(async (tx) => {
      const carrier = await this.catalog.findCarrier(
        tx,
        dto.insuranceCarrierId,
      );
      if (!carrier)
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId: dto.insuranceCarrierId,
        });
      const coverage = await this.coverage.findCoverage(
        tx,
        dto.patientCoverageId,
      );
      if (!coverage)
        throw new ResourceNotFoundException('Cobertura no encontrada', {
          coverageId: dto.patientCoverageId,
        });

      if (dto.idempotencyKey) {
        const existing = await this.repo.findByIdempotency(
          tx,
          dto.idempotencyKey,
        );
        if (existing)
          throw new ConflictException('Reclamo duplicado', {
            idempotencyKey: dto.idempotencyKey,
          });
      }

      // La moneda del reclamo la hereda del plan bajo el que se factura. No
      // estaba: el reclamo se guardaba con `total_amount` y `currency_concept_id`
      // nulo, y una pantalla que muestra un importe sin moneda tiene que
      // elegir entre inventarle un símbolo o mostrar un número pelado. El plan
      // sí la declara, así que hay de dónde tomarla sin inventar nada.
      const plan = await this.catalog.findPlan(tx, coverage.insurancePlanId);

      // Suma decimal exacta, no `Number(...)`. Con coma flotante, un reclamo de
      // muchas líneas o con más de dos decimales guarda un total que no es la
      // suma de sus líneas — y después no hay forma de distinguir ese céntimo
      // de un descuadre real. Es justo lo que compara AC-16-6 de la TAREA-16,
      // que exige igualdad **de cadena** entre el total declarado y la suma de
      // los ítems.
      const total = sumarDecimales(dto.lines.map((l) => l.billedAmount)) ?? '0';
      const claim = this.repo.createClaim(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        patientCoverageId: dto.patientCoverageId,
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
        billingProviderEntityId: dto.billingProviderEntityId,
        priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
        claimIdentifier: dto.claimIdentifier,
        statusConceptId: INS.CLAIM_SUBMITTED,
        submittedAt: new Date(),
        totalAmount: total,
        currencyConceptId: plan?.currencyConceptId,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const line of dto.lines) {
        this.repo.createLine(tx, {
          insuranceClaimId: claim.id,
          lineSequence: line.lineSequence,
          serviceConceptId: line.serviceConceptId,
          quantity: line.quantity,
          billedAmount: line.billedAmount,
          patientResponsibilityAmount: line.patientResponsibilityAmount,
          supportingClinicalReference: line.supportingClinicalReference,
        });
      }

      return {
        id: claim.id,
        status: claim.statusConceptId,
        createdAt: claim.createdAt,
      };
    });
  }

  /** UC-26-07: adjudicar reclamo por línea (nueva versión inmutable). */
  async adjudicate(
    claimId: string,
    dto: CreateAdjudicationDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    this.logger.info(
      { operation: 'insurance.claim.adjudicate', claimId, actorId: actor.id },
      'Adjudicating claim',
    );
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim)
        throw new ResourceNotFoundException('Reclamo no encontrado', {
          claimId,
        });
      if (claim.statusConceptId !== INS.CLAIM_SUBMITTED) {
        throw new PreconditionFailedException(
          'El reclamo no está en estado adjudicable',
          { claimId },
        );
      }

      // Validar que cada línea adjudicada pertenece a este reclamo.
      for (const la of dto.lineAdjudications) {
        const line = await this.repo.findLine(tx, la.insuranceClaimLineId);
        if (!line || line.insuranceClaimId !== claimId) {
          throw new ResourceNotFoundException(
            'Línea de reclamo no encontrada',
            {
              lineId: la.insuranceClaimLineId,
            },
          );
        }
      }

      const previous = await this.repo.latestVersion(tx, claimId);
      const nextVersion = (previous?.adjudicationVersion ?? 0) + 1;
      const version = this.repo.createVersion(tx, {
        insuranceClaimId: claimId,
        adjudicationVersion: nextVersion,
        outcomeConceptId:
          dto.outcome === 'APPROVED'
            ? INS.ADJ_OUTCOME_APPROVED
            : INS.ADJ_OUTCOME_DENIED,
        dispositionText: dto.dispositionText,
        totalApprovedAmount: dto.totalApprovedAmount,
        totalPatientAmount: dto.totalPatientAmount,
        totalDeniedAmount: dto.totalDeniedAmount,
        supersedesVersionId: previous?.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const la of dto.lineAdjudications) {
        this.repo.createLineAdjudication(tx, {
          claimAdjudicationVersionId: version.id,
          insuranceClaimLineId: la.insuranceClaimLineId,
          decisionConceptId: LINE_DECISION_CONCEPT[la.decision],
          // El motivo viaja tal cual: la columna existía y nada la escribía.
          // El catálogo del que sale todavía no declara miembros (AC-16-8), así
          // que hoy llega vacío en la práctica — pero la vía queda hecha y no
          // se inventa ningún código para llenarla.
          reasonConceptId: la.reasonConceptId,
          approvedAmount: la.approvedAmount,
          patientAmount: la.patientAmount,
          deniedAmount: la.deniedAmount,
        });
      }

      claim.statusConceptId = INS.CLAIM_ADJUDICATED;
      touch(claim, actor.id);
      await tx.flush();

      return { id: version.id };
    });
  }

  /** UC-26-08: publicar la EOB del paciente para una versión de adjudicación. */
  async publishEob(
    claimId: string,
    dto: PublishEobDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    this.logger.info(
      { operation: 'insurance.claim.eob', claimId, actorId: actor.id },
      'Publishing EOB',
    );
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim)
        throw new ResourceNotFoundException('Reclamo no encontrado', {
          claimId,
        });
      const version = await this.repo.latestVersion(tx, claimId);
      if (!version) {
        throw new PreconditionFailedException(
          'No existe adjudicación in_force para publicar EOB',
          { claimId },
        );
      }

      const existing = await this.repo.findEob(tx, claimId, version.id);
      if (existing)
        throw new ConflictException(
          'La EOB ya fue publicada para esta versión',
          { claimId },
        );

      const coverage = await this.coverage.findCoverage(
        tx,
        claim.patientCoverageId,
      );
      const eob = this.repo.createEob(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: version.id,
        patientProfileId: coverage?.patientProfileId ?? claim.patientCoverageId,
        documentRecordId: dto.documentRecordId,
        statusConceptId: INS.EOB_PUBLISHED,
        publishedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: eob.id };
    });
  }

  /** UC-26-10: registrar reversión (append-only) del reclamo adjudicado. */
  async reverse(
    claimId: string,
    dto: CreateReversalDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    this.logger.info(
      { operation: 'insurance.claim.reverse', claimId, actorId: actor.id },
      'Reversing claim',
    );
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim)
        throw new ResourceNotFoundException('Reclamo no encontrado', {
          claimId,
        });
      if (
        ![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)
      ) {
        throw new PreconditionFailedException(
          'El reclamo no está en estado reversible',
          { claimId },
        );
      }
      const version = await this.repo.findVersion(
        tx,
        dto.reversedAdjudicationVersionId,
      );
      if (!version || version.insuranceClaimId !== claimId) {
        throw new ResourceNotFoundException(
          'Versión de adjudicación no encontrada',
          {
            versionId: dto.reversedAdjudicationVersionId,
          },
        );
      }

      const reversal = this.repo.createReversal(tx, {
        insuranceClaimId: claimId,
        reversedAdjudicationVersionId: dto.reversedAdjudicationVersionId,
        reversalReasonConceptId: INS.REVERSAL_REASON_CORRECTION,
        reversalAmount: dto.reversalAmount,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });

      claim.statusConceptId = INS.CLAIM_REVERSED;
      touch(claim, actor.id);
      await tx.flush();
      return { id: reversal.id };
    });
  }

  /** UC-26-11: abrir disputa sobre la adjudicación de un reclamo. */
  async openDispute(
    claimId: string,
    dto: CreateDisputeDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.claim.dispute', claimId, actorId: actor.id },
      'Opening dispute',
    );
    // El alcance se resuelve **antes** de abrir la transacción: quién reclama
    // es el prestador que presentó la solicitud (TAREA-16 · D1.a), y ese dato
    // vive en `practice`, no en esta tabla.
    const practiceIds = await this.practiceIdsInScope();

    return this.em.transactional(async (tx) => {
      // El `FOR UPDATE` es lo que hace idempotente al reclamo también entre
      // peticiones **concurrentes**: sin él, dos clics simultáneos leen los dos
      // «no hay disputa abierta» y crean dos. `claim_disputes` no tiene índice
      // único que lo impida, así que la exclusión la da el lock sobre la fila
      // del reclamo — el mismo patrón que usa `ads` para sus contadores.
      const claim = await this.repo.findClaimForUpdate(tx, claimId);
      // Fuera de alcance y inexistente se responden igual, y sin `details`: es
      // la misma regla que la lectura (AC-16-14), y un 404 acá volvería a
      // confirmar qué identificadores existen.
      if (!claim || !this.claimBelongsTo(claim, practiceIds)) {
        throw this.accessDenied();
      }

      // Idempotencia sin columna nueva: si ya hay una disputa **abierta** sobre
      // la misma versión del dictamen, se devuelve ésa. Reclamar dos veces con
      // el mismo cuerpo tiene que dar el mismo reclamo, no dos — la
      // aseguradora recibiría el caso duplicado y no hay forma de retirarlo.
      const existente = await this.repo.findOpenDispute(
        tx,
        claimId,
        dto.claimAdjudicationVersionId,
        INS.DISPUTE_OPEN,
      );
      if (existente) {
        return {
          id: existente.id,
          status: existente.statusConceptId,
          createdAt: existente.createdAt,
        };
      }

      const dispute = this.repo.createDispute(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: dto.claimAdjudicationVersionId,
        disputeTypeConceptId: INS.DISPUTE_TYPE_APPEAL,
        disputeReasonConceptId: INS.DISPUTE_REASON_UNDERPAID,
        initiatedByPartyTypeConceptId:
          dto.initiatedBy === 'PROVIDER'
            ? INS.PARTY_PROVIDER
            : INS.PARTY_PATIENT,
        initiatedByEntityId: dto.initiatedByEntityId,
        filingDeadline: dto.filingDeadline
          ? new Date(dto.filingDeadline)
          : undefined,
        submittedAt: new Date(),
        statusConceptId: INS.DISPUTE_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: dispute.id,
        status: dispute.statusConceptId,
        createdAt: dispute.createdAt,
      };
    });
  }

  /**
   * Las prácticas activas de la organización activa, o el rechazo.
   *
   * Reclamar es el acto del prestador que presentó la solicitud, así que el
   * alcance se mide igual que en la lectura: sin prácticas activas no hay
   * ninguna solicitud propia que reclamar.
   *
   * @returns Los ids de práctica de la organización activa.
   * @throws ForbiddenException si no tiene ninguna práctica activa.
   */
  private async practiceIdsInScope(): Promise<string[]> {
    const tenantId = requireTenantId();
    const practiceIds =
      await this.practiceLookup.findActivePracticeIdsForTenant(tenantId);
    if (practiceIds.length === 0) throw this.accessDenied();
    return practiceIds;
  }

  /**
   * Si la solicitud la envió una de las prácticas dadas.
   *
   * Se comprueba el **tipo** además del id: mientras el tipo sea
   * `BILLING_PROVIDER_TYPE_PRACTICE` la columna es un `practice.practices.id`,
   * y el día que exista un segundo tipo de facturador un uuid de otra tabla no
   * debe colar por coincidencia.
   *
   * @param claim - La solicitud leída.
   * @param practiceIds - Prácticas de la organización activa.
   * @returns Si la solicitud está dentro del alcance.
   */
  private claimBelongsTo(
    claim: {
      billingProviderTypeConceptId: string;
      billingProviderEntityId: string;
    },
    practiceIds: readonly string[],
  ): boolean {
    return (
      claim.billingProviderTypeConceptId ===
        INS.BILLING_PROVIDER_TYPE_PRACTICE &&
      practiceIds.includes(claim.billingProviderEntityId)
    );
  }

  /**
   * El rechazo único del reclamo: mismo cuerpo para «no es tuya» y «no existe».
   *
   * @returns La excepción, sin `details`.
   */
  private accessDenied(): ForbiddenException {
    return new ForbiddenException('No hay acceso a esa solicitud de seguro');
  }
}
