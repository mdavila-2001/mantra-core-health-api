import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AccrualObjects,
  AccrualScheduleLines,
  AccrualPostings,
} from '../entities';
import { createdBy } from '../../../common';

/** Acceso a objetos de devengo y su cronograma (UC-16-06 / UC-16-07). */
@Injectable()
export class AccrualRepository {
  /**
   * Obtiene find object by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find object by id conforme al contrato `Promise<AccrualObjects | null>`.
   */
  findObjectById(
    em: EntityManager,
    id: string,
  ): Promise<AccrualObjects | null> {
    return em.findOne(AccrualObjects, { id });
  }

  /**
   * Obtiene find object by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param objectNumber - Valor de object number requerido por la operación.
   * @returns Resultado de find object by number conforme al contrato `Promise<AccrualObjects | null>`.
   */
  findObjectByNumber(
    em: EntityManager,
    tenantId: string,
    objectNumber: string,
  ): Promise<AccrualObjects | null> {
    return em.findOne(AccrualObjects, { tenantId, objectNumber });
  }

  /**
   * Crea create object.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create object conforme al contrato `AccrualObjects`.
   */
  createObject(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de object number mantenido por la instancia.
       */
      objectNumber: string;
      /**
       * Identificador asociado a accrual type concept.
       */
      accrualTypeConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a expense account.
       */
      expenseAccountId?: string;
      /**
       * Identificador asociado a accrual account.
       */
      accrualAccountId?: string;
      /**
       * Identificador asociado a cost center.
       */
      costCenterId?: string;
      /**
       * Identificador asociado a profit center.
       */
      profitCenterId?: string;
      /**
       * Identificador asociado a contract.
       */
      contractId?: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate?: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate?: Date;
      /**
       * Valor de total amount mantenido por la instancia.
       */
      totalAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AccrualObjects {
    return em.create(
      AccrualObjects,
      {
        tenantId: data.tenantId,
        objectNumber: data.objectNumber,
        accrualTypeConceptId: data.accrualTypeConceptId,
        statusConceptId: data.statusConceptId,
        expenseAccountId: data.expenseAccountId,
        accrualAccountId: data.accrualAccountId,
        costCenterId: data.costCenterId,
        profitCenterId: data.profitCenterId,
        contractId: data.contractId,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmount: data.totalAmount,
        currencyConceptId: data.currencyConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create schedule line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schedule line conforme al contrato `AccrualScheduleLines`.
   */
  createScheduleLine(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a accrual object.
       */
      accrualObjectId: string;
      /**
       * Identificador asociado a fiscal period.
       */
      fiscalPeriodId: string;
      /**
       * Valor de planned amount mantenido por la instancia.
       */
      plannedAmount?: string;
      /**
       * Valor de posted amount mantenido por la instancia.
       */
      postedAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AccrualScheduleLines {
    return em.create(
      AccrualScheduleLines,
      {
        accrualObjectId: data.accrualObjectId,
        fiscalPeriodId: data.fiscalPeriodId,
        plannedAmount: data.plannedAmount,
        postedAmount: data.postedAmount ?? '0',
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Los objetos de devengo de un tenant cuya cuenta de gasto o de devengo es
   * de la práctica consultada, o que no tienen ninguna de las dos (D-1: se
   * incluyen igual, es un devengo sin cuentas — la corrida lo rechaza, pero el
   * registro no debe esconderlo).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant dueño de los devengos.
   * @param practiceAccountIds - Cuentas de la práctica consultada.
   * @returns Los objetos de devengo alcanzados por la práctica.
   */
  findObjectsByPractice(
    em: EntityManager,
    tenantId: string,
    practiceAccountIds: readonly string[],
  ): Promise<AccrualObjects[]> {
    return em.find(AccrualObjects, {
      tenantId,
      $or: [
        { expenseAccountId: { $in: [...practiceAccountIds] } },
        { accrualAccountId: { $in: [...practiceAccountIds] } },
        { expenseAccountId: null, accrualAccountId: null },
      ],
    });
  }

  /**
   * El cronograma de un lote de objetos de devengo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param accrualObjectIds - Objetos cuyas líneas se leen.
   * @returns Las líneas de cronograma de esos objetos.
   */
  findScheduleLinesByObjectIds(
    em: EntityManager,
    accrualObjectIds: readonly string[],
  ): Promise<AccrualScheduleLines[]> {
    if (accrualObjectIds.length === 0) return Promise.resolve([]);
    return em.find(AccrualScheduleLines, {
      accrualObjectId: { $in: [...accrualObjectIds] },
    });
  }

  /** Líneas PENDIENTES del objeto para un periodo dado (batch idempotente). */
  pendingLinesForPeriod(
    em: EntityManager,
    accrualObjectId: string,
    fiscalPeriodId: string,
    pendingStatusConceptId: string,
  ): Promise<AccrualScheduleLines[]> {
    return em.find(AccrualScheduleLines, {
      accrualObjectId,
      fiscalPeriodId,
      statusConceptId: pendingStatusConceptId,
    });
  }

  /**
   * Crea create posting.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create posting conforme al contrato `AccrualPostings`.
   */
  createPosting(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a accrual schedule line.
       */
      accrualScheduleLineId: string;
      /**
       * Identificador asociado a ledger entry.
       */
      ledgerEntryId: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de posting date mantenido por la instancia.
       */
      postingDate?: Date;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AccrualPostings {
    return em.create(
      AccrualPostings,
      {
        accrualScheduleLineId: data.accrualScheduleLineId,
        ledgerEntryId: data.ledgerEntryId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        postingDate: data.postingDate ?? new Date(),
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
