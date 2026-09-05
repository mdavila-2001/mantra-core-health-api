import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Assets,
  AssetComponents,
  AssetValuations,
  AssetAssignments,
  AssetPostings,
  AssetDepreciations,
} from '../entities';
import { createdBy } from '../../../common';

/** Acceso a activos fijos y sus dependientes (UC-16-10 / UC-16-11). */
@Injectable()
export class AssetRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Assets | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Assets | null> {
    return em.findOne(Assets, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<Assets | null>`.
   */
  findByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<Assets | null> {
    return em.findOne(Assets, { practiceId, code });
  }

  /**
   * Ejecuta la operación active assets.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de active assets conforme al contrato `Promise<Assets[]>`.
   */
  activeAssets(
    em: EntityManager,
    practiceId: string,
    statusConceptId: string,
  ): Promise<Assets[]> {
    return em.find(Assets, { practiceId, statusConceptId });
  }

  /**
   * Los activos de una práctica (FT-26: auto-servicio del doctor), del más
   * reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @returns Resultado de list by practice conforme al contrato `Promise<Assets[]>`.
   */
  listByPractice(em: EntityManager, practiceId: string): Promise<Assets[]> {
    return em.find(Assets, { practiceId }, { orderBy: { createdAt: 'DESC' } });
  }

  /**
   * Enciende o apaga la automatización de un activo (FT-26).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del activo.
   * @param automated - El nuevo valor del interruptor.
   */
  async setAutomated(
    em: EntityManager,
    id: string,
    automated: boolean,
  ): Promise<Assets | null> {
    const asset = await em.findOne(Assets, { id });
    if (!asset) return null;
    asset.automated = automated;
    asset.updatedAt = new Date();
    await em.flush();
    return asset;
  }

  /**
   * Crea create asset.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create asset conforme al contrato `Assets`.
   */
  createAsset(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a practice.
       */
      practiceId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a asset type concept.
       */
      assetTypeConceptId?: string;
      /**
       * Identificador asociado a account.
       */
      accountId?: string;
      /**
       * Valor de acquisition date mantenido por la instancia.
       */
      acquisitionDate?: Date;
      /**
       * Valor de acquisition cost mantenido por la instancia.
       */
      acquisitionCost?: string;
      /**
       * Identificador asociado a depreciation method concept.
       */
      depreciationMethodConceptId?: string;
      /**
       * Valor de useful life months mantenido por la instancia.
       */
      usefulLifeMonths?: number;
      /**
       * Valor de salvage value mantenido por la instancia.
       */
      salvageValue?: string;
      /**
       * Valor de accumulated depreciation mantenido por la instancia.
       */
      accumulatedDepreciation?: string;
      /**
       * Valor de book value mantenido por la instancia.
       */
      bookValue?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): Assets {
    return em.create(
      Assets,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        statusConceptId: data.statusConceptId,
        assetTypeConceptId: data.assetTypeConceptId,
        accountId: data.accountId,
        acquisitionDate: data.acquisitionDate,
        acquisitionCost: data.acquisitionCost,
        depreciationMethodConceptId: data.depreciationMethodConceptId,
        usefulLifeMonths: data.usefulLifeMonths,
        salvageValue: data.salvageValue ?? '0',
        accumulatedDepreciation: data.accumulatedDepreciation ?? '0',
        bookValue: data.bookValue,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create component.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create component conforme al contrato `AssetComponents`.
   */
  createComponent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a asset.
       */
      assetId: string;
      /**
       * Valor de component number mantenido por la instancia.
       */
      componentNumber: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a asset class.
       */
      assetClassId?: string;
      /**
       * Valor de acquisition cost mantenido por la instancia.
       */
      acquisitionCost?: string;
      /**
       * Valor de useful life months mantenido por la instancia.
       */
      usefulLifeMonths?: number;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssetComponents {
    return em.create(
      AssetComponents,
      {
        assetId: data.assetId,
        componentNumber: data.componentNumber,
        name: data.name,
        statusConceptId: data.statusConceptId,
        assetClassId: data.assetClassId,
        acquisitionCost: data.acquisitionCost,
        usefulLifeMonths: data.usefulLifeMonths,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create valuation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create valuation conforme al contrato `AssetValuations`.
   */
  createValuation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a asset.
       */
      assetId: string;
      /**
       * Identificador asociado a depreciation area.
       */
      depreciationAreaId: string;
      /**
       * Identificador asociado a asset component.
       */
      assetComponentId?: string;
      /**
       * Valor de acquisition value mantenido por la instancia.
       */
      acquisitionValue?: string;
      /**
       * Valor de accumulated depreciation mantenido por la instancia.
       */
      accumulatedDepreciation?: string;
      /**
       * Valor de book value mantenido por la instancia.
       */
      bookValue?: string;
      /**
       * Valor de valid from mantenido por la instancia.
       */
      validFrom?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssetValuations {
    return em.create(
      AssetValuations,
      {
        assetId: data.assetId,
        depreciationAreaId: data.depreciationAreaId,
        assetComponentId: data.assetComponentId,
        acquisitionValue: data.acquisitionValue,
        accumulatedDepreciation: data.accumulatedDepreciation ?? '0',
        bookValue: data.bookValue,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assignment conforme al contrato `AssetAssignments`.
   */
  createAssignment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a asset.
       */
      assetId: string;
      /**
       * Identificador asociado a cost center.
       */
      costCenterId?: string;
      /**
       * Identificador asociado a profit center.
       */
      profitCenterId?: string;
      /**
       * Identificador asociado a branch.
       */
      branchId?: string;
      /**
       * Identificador asociado a responsible employee.
       */
      responsibleEmployeeId?: string;
      /**
       * Valor de valid from mantenido por la instancia.
       */
      validFrom?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssetAssignments {
    return em.create(
      AssetAssignments,
      {
        assetId: data.assetId,
        costCenterId: data.costCenterId,
        profitCenterId: data.profitCenterId,
        branchId: data.branchId,
        responsibleEmployeeId: data.responsibleEmployeeId,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create posting.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create posting conforme al contrato `AssetPostings`.
   */
  createPosting(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a asset.
       */
      assetId: string;
      /**
       * Identificador asociado a ledger entry.
       */
      ledgerEntryId: string;
      /**
       * Identificador asociado a transaction type concept.
       */
      transactionTypeConceptId: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de asset value date mantenido por la instancia.
       */
      assetValueDate?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssetPostings {
    return em.create(
      AssetPostings,
      {
        assetId: data.assetId,
        ledgerEntryId: data.ledgerEntryId,
        transactionTypeConceptId: data.transactionTypeConceptId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        assetValueDate: data.assetValueDate ?? new Date(),
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find depreciation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assetId - Identificador de asset.
   * @param fiscalPeriodId - Identificador de fiscal period.
   * @returns Resultado de find depreciation conforme al contrato `Promise<AssetDepreciations | null>`.
   */
  findDepreciation(
    em: EntityManager,
    assetId: string,
    fiscalPeriodId: string,
  ): Promise<AssetDepreciations | null> {
    return em.findOne(AssetDepreciations, { assetId, fiscalPeriodId });
  }

  /**
   * Crea create depreciation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create depreciation conforme al contrato `AssetDepreciations`.
   */
  createDepreciation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a asset.
       */
      assetId: string;
      /**
       * Identificador asociado a fiscal period.
       */
      fiscalPeriodId: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Valor de book value after mantenido por la instancia.
       */
      bookValueAfter?: string;
      /**
       * Identificador asociado a transaction.
       */
      transactionId?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AssetDepreciations {
    return em.create(
      AssetDepreciations,
      {
        assetId: data.assetId,
        fiscalPeriodId: data.fiscalPeriodId,
        amount: data.amount,
        bookValueAfter: data.bookValueAfter,
        transactionId: data.transactionId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
