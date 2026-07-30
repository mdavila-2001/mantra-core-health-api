import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerSpecialties } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una especialidad de profesional. */
export interface CreateSpecialtyData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId: string;
  /**
   * Identificador asociado a supporting credential.
   */
  supportingCredentialId?: string;
  /**
   * Identificador asociado a specialty role concept.
   */
  specialtyRoleConceptId?: string;
  /**
   * Valor de is primary mantenido por la instancia.
   */
  isPrimary?: boolean;
  /**
   * Valor de board certified mantenido por la instancia.
   */
  boardCertified?: boolean;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.practitioner_specialties`. */
@Injectable()
export class PractitionerSpecialtiesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerSpecialties`.
   */
  create(
    em: EntityManager,
    data: CreateSpecialtyData,
  ): PractitionerSpecialties {
    return em.create(
      PractitionerSpecialties,
      {
        practitionerProfileId: data.practitionerProfileId,
        specialtyConceptId: data.specialtyConceptId,
        supportingCredentialId: data.supportingCredentialId,
        specialtyRoleConceptId: data.specialtyRoleConceptId,
        isPrimary: data.isPrimary ?? false,
        boardCertified: data.boardCertified ?? false,
        verificationStatusConceptId: data.verificationStatusConceptId,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Especialidad activa duplicada (uq_practitioner_specialty_active, valid_to IS NULL). */
  findActive(
    em: EntityManager,
    practitionerProfileId: string,
    specialtyConceptId: string,
  ): Promise<PractitionerSpecialties | null> {
    return em.findOne(PractitionerSpecialties, {
      practitionerProfileId,
      specialtyConceptId,
      validTo: null,
    });
  }

  /** Desmarca como primaria la especialidad primaria vigente previa. */
  demotePrimary(
    em: EntityManager,
    practitionerProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PractitionerSpecialties,
      { practitionerProfileId, isPrimary: true, validTo: null },
      { isPrimary: false, updatedAt: now },
    );
  }
}
