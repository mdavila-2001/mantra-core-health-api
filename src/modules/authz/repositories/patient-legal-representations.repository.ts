import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientLegalRepresentations } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para registrar una representación legal del paciente. */
export interface CreateLegalRepresentationData {
  tenantId: string;
  patientProfileId: string;
  representativeUserId: string;
  representationTypeConceptId: string;
  validFrom: Date;
  validTo?: Date;
  documentRef?: string;
  actorUserId?: string;
}

/** Acceso a datos de `authz.patient_legal_representations`. */
@Injectable()
export class PatientLegalRepresentationsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PatientLegalRepresentations | null> {
    return em.findOne(PatientLegalRepresentations, { id });
  }

  /** Representación ACTIVA concreta (paciente, representante), evita duplicados. */
  findActive(
    em: EntityManager,
    patientProfileId: string,
    representativeUserId: string,
  ): Promise<PatientLegalRepresentations | null> {
    return em.findOne(PatientLegalRepresentations, {
      patientProfileId,
      representativeUserId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Representaciones ACTIVAS de un usuario sobre un paciente (para el PDP). */
  findActiveForRepresentativePatient(
    em: EntityManager,
    representativeUserId: string,
    patientProfileId: string,
  ): Promise<PatientLegalRepresentations[]> {
    return em.find(PatientLegalRepresentations, {
      representativeUserId,
      patientProfileId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Todas las representaciones de un paciente (scoping por tenant). */
  findByPatient(
    em: EntityManager,
    tenantId: string,
    patientProfileId: string,
  ): Promise<PatientLegalRepresentations[]> {
    return em.find(
      PatientLegalRepresentations,
      { tenantId, patientProfileId },
      { orderBy: { validFrom: 'DESC' } },
    );
  }

  create(
    em: EntityManager,
    data: CreateLegalRepresentationData,
  ): PatientLegalRepresentations {
    return em.create(
      PatientLegalRepresentations,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        representativeUserId: data.representativeUserId,
        representationTypeConceptId: data.representationTypeConceptId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        documentRef: data.documentRef,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
