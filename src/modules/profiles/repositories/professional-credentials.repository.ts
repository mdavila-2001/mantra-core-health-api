import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProfessionalCredentials } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una credencial profesional. */
export interface CreateCredentialData {
  practitionerProfileId: string;
  credentialTypeConceptId: string;
  number: string;
  issuingInstitutionText?: string;
  verificationSourceUri?: string;
  stateConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.professional_credentials`. */
@Injectable()
export class ProfessionalCredentialsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ProfessionalCredentials | null> {
    return em.findOne(ProfessionalCredentials, { id });
  }

  create(
    em: EntityManager,
    data: CreateCredentialData,
  ): ProfessionalCredentials {
    return em.create(
      ProfessionalCredentials,
      {
        practitionerProfileId: data.practitionerProfileId,
        credentialTypeConceptId: data.credentialTypeConceptId,
        number: data.number,
        issuingInstitutionText: data.issuingInstitutionText,
        verificationSourceUri: data.verificationSourceUri,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Nº de credenciales del profesional que siguen en un estado dado (típicamente
   * "pendiente"), excluyendo una credencial concreta. Sirve para decidir si el
   * profesional pasa a verificado cuando ya no le quedan credenciales pendientes.
   */
  countInStateExcept(
    em: EntityManager,
    practitionerProfileId: string,
    stateConceptId: string,
    exceptId: string,
  ): Promise<number> {
    return em.count(ProfessionalCredentials, {
      practitionerProfileId,
      stateConceptId,
      id: { $ne: exceptId },
    });
  }
}
