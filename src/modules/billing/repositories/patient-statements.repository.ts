import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientStatements } from '../entities';
import { createdBy } from '../../../common';

/** Estado de cuenta del paciente a generar. */
export interface CreatePatientStatementData {
  practiceId: string;
  patientProfileId: string;
  periodStart: Date;
  periodEnd: Date;
  openingBalance?: string;
  charges?: string;
  payments?: string;
  closingBalance?: string;
  generatedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `billing.patient_statements`. */
@Injectable()
export class PatientStatementsRepository {
  findByPeriod(
    em: EntityManager,
    practiceId: string,
    patientProfileId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PatientStatements | null> {
    return em.findOne(PatientStatements, {
      practiceId,
      patientProfileId,
      periodStart,
      periodEnd,
    });
  }

  create(
    em: EntityManager,
    data: CreatePatientStatementData,
  ): PatientStatements {
    return em.create(
      PatientStatements,
      {
        practiceId: data.practiceId,
        patientProfileId: data.patientProfileId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        openingBalance: data.openingBalance,
        charges: data.charges,
        payments: data.payments,
        closingBalance: data.closingBalance,
        generatedAt: data.generatedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
