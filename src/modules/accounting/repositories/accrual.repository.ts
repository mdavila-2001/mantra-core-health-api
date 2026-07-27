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
  findObjectById(
    em: EntityManager,
    id: string,
  ): Promise<AccrualObjects | null> {
    return em.findOne(AccrualObjects, { id });
  }

  findObjectByNumber(
    em: EntityManager,
    tenantId: string,
    objectNumber: string,
  ): Promise<AccrualObjects | null> {
    return em.findOne(AccrualObjects, { tenantId, objectNumber });
  }

  createObject(
    em: EntityManager,
    data: {
      tenantId: string;
      objectNumber: string;
      accrualTypeConceptId: string;
      statusConceptId: string;
      expenseAccountId?: string;
      accrualAccountId?: string;
      costCenterId?: string;
      profitCenterId?: string;
      contractId?: string;
      startDate?: Date;
      endDate?: Date;
      totalAmount?: string;
      currencyConceptId?: string;
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

  createScheduleLine(
    em: EntityManager,
    data: {
      accrualObjectId: string;
      fiscalPeriodId: string;
      plannedAmount?: string;
      postedAmount?: string;
      currencyConceptId?: string;
      statusConceptId: string;
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

  createPosting(
    em: EntityManager,
    data: {
      accrualScheduleLineId: string;
      ledgerEntryId: string;
      amount: string;
      currencyConceptId?: string;
      postingDate?: Date;
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
