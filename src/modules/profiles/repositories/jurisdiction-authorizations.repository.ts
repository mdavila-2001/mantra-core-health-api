import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { JurisdictionAuthorizations } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una autorización jurisdiccional (licencia). */
export interface CreateJurisdictionAuthorizationData {
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId: string;
  /**
   * Valor de license number mantenido por la instancia.
   */
  licenseNumber: string;
  /**
   * Valor de regulatory authority mantenido por la instancia.
   */
  regulatoryAuthority?: string;
  /**
   * Identificador asociado a practice scope concept.
   */
  practiceScopeConceptId?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * El respaldo de la matrícula, ya subido por `POST /common/files/upload`.
   */
  fileId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.jurisdiction_authorizations`. */
@Injectable()
export class JurisdictionAuthorizationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<JurisdictionAuthorizations | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<JurisdictionAuthorizations | null> {
    return em.findOne(JurisdictionAuthorizations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `JurisdictionAuthorizations`.
   */
  /**
   * Matrículas de un profesional.
   *
   * Las consume el autoservicio de identidad: una verificación de matrícula
   * tiene como sujeto la autorización, no la persona, así que sin esta lista no
   * hay forma de reunir los casos propios de quien tiene más de una.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - Perfil profesional dueño de las matrículas.
   * @returns Sus autorizaciones jurisdiccionales.
   */
  findByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<JurisdictionAuthorizations[]> {
    return em.find(JurisdictionAuthorizations, { practitionerProfileId });
  }

  create(
    em: EntityManager,
    data: CreateJurisdictionAuthorizationData,
  ): JurisdictionAuthorizations {
    return em.create(
      JurisdictionAuthorizations,
      {
        practitionerProfileId: data.practitionerProfileId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        licenseNumber: data.licenseNumber,
        regulatoryAuthority: data.regulatoryAuthority,
        practiceScopeConceptId: data.practiceScopeConceptId,
        stateConceptId: data.stateConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        fileId: data.fileId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
