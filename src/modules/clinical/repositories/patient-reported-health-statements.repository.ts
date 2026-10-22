import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientReportedHealthStatements } from '../entities';
import { createdBy } from '../../../common';

/** Alta de la declaración de un titular (una fila por paciente). */
export interface CreatePatientReportedHealthStatementData {
  /**
   * Titular de la declaración.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `clinical.patient_reported_health_statements` (D-B).
 * Stateless: el `EntityManager` activo llega como primer parámetro.
 */
@Injectable()
export class PatientReportedHealthStatementsRepository {
  /**
   * La declaración de un titular, si alguna vez declaró algo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Titular.
   * @returns La fila, o `null` si nunca declaró.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<PatientReportedHealthStatements | null> {
    return em.findOne(PatientReportedHealthStatements, { patientProfileId });
  }

  /**
   * Crea la fila vacía del titular; los campos los completa el caso de uso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Titular y actor.
   * @returns La entidad recién creada (sin flush).
   */
  create(
    em: EntityManager,
    data: CreatePatientReportedHealthStatementData,
  ): PatientReportedHealthStatements {
    return em.create(
      PatientReportedHealthStatements,
      {
        patientProfileId: data.patientProfileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
