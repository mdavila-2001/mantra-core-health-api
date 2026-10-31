import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, createdBy } from '../../../common';
import { PatientRestrictionFlags } from '../entities';

/** Datos para poner una bandera de restricción a un paciente. */
export interface CreatePatientRestrictionFlagData {
  /** Organización del actor (el paciente no tiene organización). */
  readonly tenantId: string;
  /** Paciente. */
  readonly patientProfileId: string;
  /** Concepto de la bandera (`PATIENT_FLAG_*`). */
  readonly flagConceptId: string;
  /** Motivo (mínimo 10 caracteres; sin datos clínicos). */
  readonly reasonText: string;
  /** Inicio de vigencia. */
  readonly validFrom: Date;
  /** Fin de vigencia, si lo hay. */
  readonly validTo?: Date;
  /** Quien la pone. */
  readonly actorUserId?: string;
}

/** Acceso a datos de `delegated_access.patient_restriction_flags`. */
@Injectable()
export class PatientRestrictionFlagsRepository {
  /**
   * Banderas VIGENTES de varios pacientes, en una sola consulta (la agenda
   * combinada de 200 citas no puede hacer una por paciente).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param patientProfileIds - Pacientes consultados.
   * @param now - Instante de evaluación.
   * @returns Las banderas vigentes (vacío si no se preguntó por nadie).
   */
  async findActiveForPatients(
    em: EntityManager,
    tenantId: string,
    patientProfileIds: readonly string[],
    now: Date,
  ): Promise<PatientRestrictionFlags[]> {
    if (patientProfileIds.length === 0) return [];
    return em.find(PatientRestrictionFlags, {
      tenantId,
      patientProfileId: { $in: [...patientProfileIds] },
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: { $lte: now },
      $or: [{ validTo: null }, { validTo: { $gt: now } }],
    });
  }

  /**
   * Bandera activa de un tipo para un paciente (la llave del único parcial).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param patientProfileId - Paciente.
   * @param flagConceptId - Tipo de bandera.
   * @returns La bandera activa o `null`.
   */
  findActive(
    em: EntityManager,
    tenantId: string,
    patientProfileId: string,
    flagConceptId: string,
  ): Promise<PatientRestrictionFlags | null> {
    return em.findOne(PatientRestrictionFlags, {
      tenantId,
      patientProfileId,
      flagConceptId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Pone una bandera activa.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la bandera.
   * @returns La bandera creada (aún sin flush).
   */
  create(
    em: EntityManager,
    data: CreatePatientRestrictionFlagData,
  ): PatientRestrictionFlags {
    return em.create(
      PatientRestrictionFlags,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        flagConceptId: data.flagConceptId,
        reasonText: data.reasonText,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Quita una bandera: queda revocada y cerrada, no se borra.
   *
   * @param row - Bandera a quitar.
   * @param actorUserId - Quien la quita.
   * @param now - Instante.
   */
  revoke(
    row: PatientRestrictionFlags,
    actorUserId: string | undefined,
    now: Date,
  ): void {
    row.statusConceptId = CONCEPTS.STATE_REVOKED;
    row.validTo = now;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }
}
