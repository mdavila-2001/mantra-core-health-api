import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientStatements } from '../entities';
import { createdBy } from '../../../common';

/** Estado de cuenta del paciente a generar. */
export interface CreatePatientStatementData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart: Date;
  /**
   * Valor de period end mantenido por la instancia.
   */
  periodEnd: Date;
  /**
   * Valor de opening balance mantenido por la instancia.
   */
  openingBalance?: string;
  /**
   * Valor de charges mantenido por la instancia.
   */
  charges?: string;
  /**
   * Valor de payments mantenido por la instancia.
   */
  payments?: string;
  /**
   * Valor de closing balance mantenido por la instancia.
   */
  closingBalance?: string;
  /**
   * Valor de generated at mantenido por la instancia.
   */
  generatedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.patient_statements`. */
@Injectable()
export class PatientStatementsRepository {
  /**
   * Obtiene find by period.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param patientProfileId - Identificador de patient profile.
   * @param periodStart - Valor de period start requerido por la operación.
   * @param periodEnd - Valor de period end requerido por la operación.
   * @returns Resultado de find by period conforme al contrato `Promise<PatientStatements | null>`.
   */
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

  /**
   * Página de estados de cuenta de una práctica, ordenada por `id` (keyset
   * estable) — CV-12.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Práctica cuyos estados de cuenta se listan.
   * @param afterId - Cursor keyset: sólo filas con `id` mayor a éste.
   * @param limit - Tope de filas de la página.
   */
  findByPracticePage(
    em: EntityManager,
    practiceId: string,
    afterId: string | undefined,
    limit: number,
  ): Promise<PatientStatements[]> {
    const where: Record<string, unknown> = { practiceId };
    if (afterId !== undefined) where.id = { $gt: afterId };
    return em.find(PatientStatements, where, {
      orderBy: { id: 'ASC' },
      limit,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientStatements`.
   */
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
