import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnitSpecialties } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de una especialidad declarada por la unidad (UC-23-04/10). */
export interface UpsertSpecialtyData {
  diagnosticUnitId: string;
  specialtyConceptId: string;
  isPrimary?: boolean;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `diagnostic_units.diagnostic_unit_specialties`. */
@Injectable()
export class DiagnosticUnitSpecialtiesRepository {
  /** Especialidades vigentes (valid_to nulo) de la unidad. */
  findOpenForUnit(em: EntityManager, diagnosticUnitId: string): Promise<DiagnosticUnitSpecialties[]> {
    return em.find(DiagnosticUnitSpecialties, { diagnosticUnitId, validTo: null });
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

  create(em: EntityManager, data: UpsertSpecialtyData): DiagnosticUnitSpecialties {
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
  verifyOpenForUnit(em: EntityManager, diagnosticUnitId: string): Promise<number> {
    return em.nativeUpdate(
      DiagnosticUnitSpecialties,
      { diagnosticUnitId, validTo: null },
      { verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED, updatedAt: new Date() },
    );
  }
}
