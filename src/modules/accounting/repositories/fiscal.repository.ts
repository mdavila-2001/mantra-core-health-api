import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FiscalYears, FiscalPeriods } from '../entities';
import { createdBy } from '../../../common';

/** Acceso a ejercicios y periodos fiscales (UC-16-04 / UC-16-05). */
@Injectable()
export class FiscalRepository {
  findYearById(em: EntityManager, id: string): Promise<FiscalYears | null> {
    return em.findOne(FiscalYears, { id });
  }

  findYearByCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<FiscalYears | null> {
    return em.findOne(FiscalYears, { practiceId, code });
  }

  createYear(
    em: EntityManager,
    data: {
      practiceId: string;
      code: string;
      startDate: Date;
      endDate: Date;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): FiscalYears {
    return em.create(
      FiscalYears,
      {
        practiceId: data.practiceId,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createPeriod(
    em: EntityManager,
    data: {
      fiscalYearId: string;
      code: string;
      startDate: Date;
      endDate: Date;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): FiscalPeriods {
    return em.create(
      FiscalPeriods,
      {
        fiscalYearId: data.fiscalYearId,
        code: data.code,
        startDate: data.startDate,
        endDate: data.endDate,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findPeriodById(em: EntityManager, id: string): Promise<FiscalPeriods | null> {
    return em.findOne(FiscalPeriods, { id });
  }
}
