import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProfessionalCredentials } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Estados de credencial que la acreditan como VIGENTE (verificada/activa). */
const CURRENT_CREDENTIAL_STATES: readonly string[] = [
  CONCEPTS.STATE_VERIFIED,
  CONCEPTS.STATE_ACTIVE,
];

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
   * ¿Tiene el profesional al menos una credencial VIGENTE en este instante?
   * Fuente autoritativa de C-14/CAN-INT-002: la credencial debe estar en estado
   * verificado/activo (no suspendida ni no verificada) y no expirada
   * (`expiry_date` nula o futura). Reemplaza al proxy de "estado del miembro del
   * equipo" que no detectaba una credencial vencida/suspendida.
   */
  async hasCurrentCredential(
    em: EntityManager,
    practitionerProfileId: string,
    now: Date,
  ): Promise<boolean> {
    const count = await em.count(ProfessionalCredentials, {
      practitionerProfileId,
      stateConceptId: { $in: [...CURRENT_CREDENTIAL_STATES] },
      $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    });
    return count > 0;
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
