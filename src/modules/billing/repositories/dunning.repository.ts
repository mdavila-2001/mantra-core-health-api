import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DunningRuns, DunningItems } from '../entities';

/** Corrida de morosidad a crear. */
export interface CreateDunningRunData {
  tenantId: string;
  runNumber: string;
  runDate?: Date;
  dunningLevelConceptId?: string;
  companyBankAccountId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Ítem de una corrida de morosidad (una factura morosa). */
export interface CreateDunningItemData {
  dunningRunId: string;
  invoiceId: string;
  openItemId?: string;
  businessPartnerId?: string;
  outstandingAmount?: string;
  currencyConceptId?: string;
  daysOverdue?: number;
  dunningFee?: string;
  noticeFileId?: string;
  statusConceptId: string;
}

/**
 * Acceso a datos de `billing.dunning_runs` y `billing.dunning_items` (ambas de
 * solo-inserción, sin `updated_at`).
 */
@Injectable()
export class DunningRepository {
  findRunByNumber(
    em: EntityManager,
    tenantId: string,
    runNumber: string,
  ): Promise<DunningRuns | null> {
    return em.findOne(DunningRuns, { tenantId, runNumber });
  }

  createRun(em: EntityManager, data: CreateDunningRunData): DunningRuns {
    return em.create(
      DunningRuns,
      {
        tenantId: data.tenantId,
        runNumber: data.runNumber,
        runDate: data.runDate,
        dunningLevelConceptId: data.dunningLevelConceptId,
        companyBankAccountId: data.companyBankAccountId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  createItem(em: EntityManager, data: CreateDunningItemData): DunningItems {
    return em.create(
      DunningItems,
      {
        dunningRunId: data.dunningRunId,
        invoiceId: data.invoiceId,
        openItemId: data.openItemId,
        businessPartnerId: data.businessPartnerId,
        outstandingAmount: data.outstandingAmount,
        currencyConceptId: data.currencyConceptId,
        daysOverdue: data.daysOverdue,
        dunningFee: data.dunningFee,
        noticeFileId: data.noticeFileId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
