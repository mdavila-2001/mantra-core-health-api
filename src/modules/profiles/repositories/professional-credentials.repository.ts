import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProfessionalCredentials } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una credencial profesional. */
export interface CreateCredentialData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a credential type concept.
   */
  credentialTypeConceptId: string;
  /**
   * Valor de number mantenido por la instancia.
   */
  number: string;
  /**
   * Valor de issuing institution text mantenido por la instancia.
   */
  issuingInstitutionText?: string;
  /**
   * Valor de verification source uri mantenido por la instancia.
   */
  verificationSourceUri?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.professional_credentials`. */
@Injectable()
export class ProfessionalCredentialsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ProfessionalCredentials | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ProfessionalCredentials | null> {
    return em.findOne(ProfessionalCredentials, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ProfessionalCredentials`.
   */
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
