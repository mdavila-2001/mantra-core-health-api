import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitSpecialties } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de una especialidad declarada por la unidad (UC-23-04/10). */
export interface UpsertSpecialtyData {
  /**
   * Identificador asociado a diagnostic unit.
   */
  diagnosticUnitId: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId: string;
  /**
   * Valor de is primary mantenido por la instancia.
   */
  isPrimary?: boolean;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_specialties`. */
@Injectable()
export class DiagnosticUnitSpecialtiesRepository {
  /** Especialidades vigentes (valid_to nulo) de la unidad. */
  findOpenForUnit(
    em: EntityManager,
    diagnosticUnitId: string,
  ): Promise<DiagnosticUnitSpecialties[]> {
    return em.find(DiagnosticUnitSpecialties, {
      diagnosticUnitId,
      validTo: null,
    });
  }

  /** Especialidad vigente por (unidad, concepto), o `null`. */
  findOpenByConcept(
    em: EntityManager,
    diagnosticUnitId: string,
    specialtyConceptId: string,
  ): Promise<DiagnosticUnitSpecialties | null> {
    return em.findOne(DiagnosticUnitSpecialties, {
      diagnosticUnitId,
      specialtyConceptId,
      validTo: null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DiagnosticUnitSpecialties`.
   */
  create(
    em: EntityManager,
    data: UpsertSpecialtyData,
  ): DiagnosticUnitSpecialties {
    return em.create(
      DiagnosticUnitSpecialties,
      {
        diagnosticUnitId: data.diagnosticUnitId,
        specialtyConceptId: data.specialtyConceptId,
        isPrimary: data.isPrimary ?? false,
        verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Marca VERIFIED todas las especialidades vigentes de la unidad (UC-23-03). */
  verifyOpenForUnit(
    em: EntityManager,
    diagnosticUnitId: string,
  ): Promise<number> {
    return em.nativeUpdate(
      DiagnosticUnitSpecialties,
      { diagnosticUnitId, validTo: null },
      {
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        updatedAt: new Date(),
      },
    );
  }
}
