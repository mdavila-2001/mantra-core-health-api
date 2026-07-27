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
  findById(em: EntityManager, id: string): Promise<Assets | null> {
    return em.findOne(Assets, { id });
  }

  findByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<Assets | null> {
    return em.findOne(Assets, { practiceId, code });
  }

  activeAssets(
    em: EntityManager,
    practiceId: string,
    statusConceptId: string,
  ): Promise<Assets[]> {
    return em.find(Assets, { practiceId, statusConceptId });
  }

  createAsset(
    em: EntityManager,
    data: {
      practiceId: string;
      code: string;
      name: string;
      statusConceptId: string;
      assetTypeConceptId?: string;
      accountId?: string;
      acquisitionDate?: Date;
      acquisitionCost?: string;
      depreciationMethodConceptId?: string;
      usefulLifeMonths?: number;
      salvageValue?: string;
      accumulatedDepreciation?: string;
      bookValue?: string;
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

  createComponent(
    em: EntityManager,
    data: {
      assetId: string;
      componentNumber: string;
      name: string;
      statusConceptId: string;
      assetClassId?: string;
      acquisitionCost?: string;
      usefulLifeMonths?: number;
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

  createValuation(
    em: EntityManager,
    data: {
      assetId: string;
      depreciationAreaId: string;
      assetComponentId?: string;
      acquisitionValue?: string;
      accumulatedDepreciation?: string;
      bookValue?: string;
      validFrom?: Date;
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

  createAssignment(
    em: EntityManager,
    data: {
      assetId: string;
      costCenterId?: string;
      profitCenterId?: string;
      branchId?: string;
      responsibleEmployeeId?: string;
      validFrom?: Date;
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

  createPosting(
    em: EntityManager,
    data: {
      assetId: string;
      ledgerEntryId: string;
      transactionTypeConceptId: string;
      amount?: string;
      currencyConceptId?: string;
      assetValueDate?: Date;
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

  findDepreciation(
    em: EntityManager,
    assetId: string,
    fiscalPeriodId: string,
  ): Promise<AssetDepreciations | null> {
    return em.findOne(AssetDepreciations, { assetId, fiscalPeriodId });
  }

  createDepreciation(
    em: EntityManager,
    data: {
      assetId: string;
      fiscalPeriodId: string;
      amount: string;
      bookValueAfter?: string;
      transactionId?: string;
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
