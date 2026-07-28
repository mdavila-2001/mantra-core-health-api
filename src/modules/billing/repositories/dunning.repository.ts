import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DunningRuns, DunningItems } from '../entities';

/** Corrida de morosidad a crear. */
export interface CreateDunningRunData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de run number mantenido por la instancia.
   */
  runNumber: string;
  /**
   * Valor de run date mantenido por la instancia.
   */
  runDate?: Date;
  /**
   * Identificador asociado a dunning level concept.
   */
  dunningLevelConceptId?: string;
  /**
   * Identificador asociado a company bank account.
   */
  companyBankAccountId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Ítem de una corrida de morosidad (una factura morosa). */
export interface CreateDunningItemData {
  /**
   * Identificador asociado a dunning run.
   */
  dunningRunId: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId: string;
  /**
   * Identificador asociado a open item.
   */
  openItemId?: string;
  /**
   * Identificador asociado a business partner.
   */
  businessPartnerId?: string;
  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  outstandingAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de days overdue mantenido por la instancia.
   */
  daysOverdue?: number;
  /**
   * Valor de dunning fee mantenido por la instancia.
   */
  dunningFee?: string;
  /**
   * Identificador asociado a notice file.
   */
  noticeFileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/**
 * Acceso a datos de `billing.dunning_runs` y `billing.dunning_items` (ambas de
 * solo-inserción, sin `updated_at`).
 */
@Injectable()
export class DunningRepository {
  /**
   * Obtiene find run by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param runNumber - Valor de run number requerido por la operación.
   * @returns Resultado de find run by number conforme al contrato `Promise<DunningRuns | null>`.
   */
  findRunByNumber(
    em: EntityManager,
    tenantId: string,
    runNumber: string,
  ): Promise<DunningRuns | null> {
    return em.findOne(DunningRuns, { tenantId, runNumber });
  }

  /**
   * Crea create run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create run conforme al contrato `DunningRuns`.
   */
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

  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `DunningItems`.
   */
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
