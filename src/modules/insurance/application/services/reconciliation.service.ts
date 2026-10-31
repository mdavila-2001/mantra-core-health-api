import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../common';
import {
  INSURANCE_PRACTICE_TENANT_LOOKUP_PORT,
  type InsurancePracticeTenantLookupPort,
} from '../ports/practice-tenant-lookup.port';
import { InsuranceErrorReason } from '../../domain/insurance.error-reasons';
import {
  SettlementRepository,
  ClaimRepository,
  CatalogRepository,
} from '../../infrastructure/repositories';
import { INS } from '../../domain/insurance.concepts';
import {
  CreateReconciliationBatchDto,
  CreateReconciliationItemDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../../presentation/dto';

/**
 * UC-26-13: conciliar pagos vs adjudicación. Abre un lote (batch) y agrega ítems
 * que referencian la versión exacta de adjudicación liquidada; la variación se
 * calcula `expected - accepted` dentro de la transacción.
 */
@Injectable()
export class ReconciliationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param claims - Valor de claims requerido por la operación.
   * @param catalog - Valor de catalog requerido por la operación.
   * @param practiceLookup - Tenant dueño de cada práctica prestadora.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SettlementRepository,
    private readonly claims: ClaimRepository,
    private readonly catalog: CatalogRepository,
    @Inject(INSURANCE_PRACTICE_TENANT_LOOKUP_PORT)
    private readonly practiceLookup: InsurancePracticeTenantLookupPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReconciliationService.name);
  }

  /** UC-26-13a: abrir lote de conciliación. */
  async createBatch(
    dto: CreateReconciliationBatchDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      // Aseguradora y prestador del lote se resuelven con la misma regla de
      // alcance: el tenant activo tiene que ser una de las dos partes. Un lote
      // entre dos terceros, o con una parte inexistente, responde 404 uniforme.
      await this.assertPartyOfRelation(
        tx,
        tenantId,
        dto.insuranceCarrierId,
        dto.providerEntityId,
      );

      const batch = this.repo.createBatch(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        providerTypeConceptId: INS.RECON_PROVIDER_TYPE_PRACTICE,
        providerEntityId: dto.providerEntityId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        statusConceptId: INS.RECON_BATCH_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'insurance.recon.batch', batchId: batch.id },
        'Reconciliation batch opened',
      );
      return {
        id: batch.id,
        status: batch.statusConceptId,
        createdAt: batch.createdAt,
      };
    });
  }

  /** UC-26-13b: agregar ítem al lote conciliando contra la versión de adjudicación. */
  async addItem(
    batchId: string,
    dto: CreateReconciliationItemDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    const tenantId = requireTenantId();
    return this.em.transactional(async (tx) => {
      const batch = await this.repo.findBatch(tx, batchId);
      if (!batch) throw this.notAvailable('Lote de conciliación no encontrado');
      await this.assertPartyOfRelation(
        tx,
        tenantId,
        batch.insuranceCarrierId,
        batch.providerEntityId,
        'Lote de conciliación no encontrado',
      );
      const claim = await this.claims.findClaim(tx, dto.insuranceClaimId);
      // El reclamo tiene que ser de la misma aseguradora y del mismo prestador
      // que el lote; si no, no se concilia en él.
      if (
        !claim ||
        claim.insuranceCarrierId !== batch.insuranceCarrierId ||
        claim.billingProviderEntityId !== batch.providerEntityId ||
        claim.billingProviderTypeConceptId !==
          INS.BILLING_PROVIDER_TYPE_PRACTICE ||
        batch.providerTypeConceptId !== INS.RECON_PROVIDER_TYPE_PRACTICE
      )
        throw this.notAvailable('Reclamo no encontrado');
      const version = await this.claims.findVersion(
        tx,
        dto.claimAdjudicationVersionId,
      );
      if (!version || version.insuranceClaimId !== claim.id) {
        throw this.notAvailable('Versión de adjudicación no encontrada');
      }

      const expected =
        dto.expectedAmount !== undefined ? Number(dto.expectedAmount) : 0;
      const accepted =
        dto.acceptedAmount !== undefined ? Number(dto.acceptedAmount) : 0;
      const variance = (expected - accepted).toFixed(2);

      const item = this.repo.createItem(tx, {
        insuranceReconciliationBatchId: batchId,
        insuranceClaimId: dto.insuranceClaimId,
        claimAdjudicationVersionId: dto.claimAdjudicationVersionId,
        expectedAmount: dto.expectedAmount,
        acceptedAmount: dto.acceptedAmount,
        varianceAmount: variance,
        varianceReasonConceptId:
          variance === '0.00' ? INS.VARIANCE_NONE : undefined,
        statusConceptId: INS.RECON_ITEM_MATCHED,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: item.id };
    });
  }

  /**
   * Exige que el tenant activo sea parte de la relación aseguradora–prestador:
   * dueño de la aseguradora o de la práctica prestadora. Ambos recursos deben
   * existir; cualquier otro caso responde como inexistente.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo (`requireTenantId()`).
   * @param carrierId - Aseguradora del lote.
   * @param providerEntityId - Práctica prestadora del lote.
   * @param message - Mensaje de "no existe" con el que se informa.
   * @throws ResourceNotFoundException uniforme si no es parte o no existen.
   */
  private async assertPartyOfRelation(
    tx: EntityManager,
    tenantId: string,
    carrierId: string,
    providerEntityId: string,
    message = 'Aseguradora no encontrada',
  ): Promise<void> {
    const carrier = await this.catalog.findCarrier(tx, carrierId);
    const practiceTenantId =
      await this.practiceLookup.findTenantOfPractice(providerEntityId);
    const isParty =
      carrier !== null &&
      practiceTenantId !== null &&
      (carrier.tenantId === tenantId || practiceTenantId === tenantId);
    if (!isParty) throw this.notAvailable(message);
  }

  /**
   * 404 uniforme de la conciliación: mismo `reason` y sin `details`.
   *
   * @param message - Mensaje de "no existe".
   * @returns La excepción a lanzar.
   */
  private notAvailable(message: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      message,
      undefined,
      InsuranceErrorReason.RECONCILIATION_RESOURCE_NOT_AVAILABLE,
    );
  }
}
