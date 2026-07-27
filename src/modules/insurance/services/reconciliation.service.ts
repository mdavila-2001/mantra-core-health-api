import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  SettlementRepository,
  ClaimRepository,
  CatalogRepository,
} from '../repositories';
import { INS } from '../insurance.concepts';
import {
  CreateReconciliationBatchDto,
  CreateReconciliationItemDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

/**
 * UC-26-13: conciliar pagos vs adjudicación. Abre un lote (batch) y agrega ítems
 * que referencian la versión exacta de adjudicación liquidada; la variación se
 * calcula `expected - accepted` dentro de la transacción.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: SettlementRepository,
    private readonly claims: ClaimRepository,
    private readonly catalog: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReconciliationService.name);
  }

  /** UC-26-13a: abrir lote de conciliación. */
  async createBatch(
    dto: CreateReconciliationBatchDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.catalog.findCarrier(
        tx,
        dto.insuranceCarrierId,
      );
      if (!carrier)
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId: dto.insuranceCarrierId,
        });

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
    return this.em.transactional(async (tx) => {
      const batch = await this.repo.findBatch(tx, batchId);
      if (!batch)
        throw new ResourceNotFoundException(
          'Lote de conciliación no encontrado',
          { batchId },
        );
      const claim = await this.claims.findClaim(tx, dto.insuranceClaimId);
      if (!claim)
        throw new ResourceNotFoundException('Reclamo no encontrado', {
          claimId: dto.insuranceClaimId,
        });
      const version = await this.claims.findVersion(
        tx,
        dto.claimAdjudicationVersionId,
      );
      if (!version || version.insuranceClaimId !== dto.insuranceClaimId) {
        throw new ResourceNotFoundException(
          'Versión de adjudicación no encontrada',
          {
            versionId: dto.claimAdjudicationVersionId,
          },
        );
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
}
