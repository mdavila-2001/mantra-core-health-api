import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HipaaAuthorizations } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para otorgar una autorización HIPAA de divulgación. */
export interface CreateHipaaAuthorizationData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a processing purpose.
   */
  processingPurposeId: string;
  /**
   * Valor de recipient description mantenido por la instancia.
   */
  recipientDescription: string;
  /**
   * Valor de information description mantenido por la instancia.
   */
  informationDescription: string;
  /**
   * Identificador asociado a expiration type concept.
   */
  expirationTypeConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de expiration event text mantenido por la instancia.
   */
  expirationEventText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de signed at mantenido por la instancia.
   */
  signedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.hipaa_authorizations`. */
@Injectable()
export class HipaaAuthorizationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<HipaaAuthorizations | null>`.
   */
  findById(em: EntityManager, id: string): Promise<HipaaAuthorizations | null> {
    return em.findOne(HipaaAuthorizations, { id });
  }

  /** Autorizaciones activas cuya fecha de expiración ya pasó (barrido). */
  findExpirable(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
  ): Promise<HipaaAuthorizations[]> {
    return em.find(HipaaAuthorizations, {
      statusConceptId: activeStatusConceptId,
      expiresAt: { $ne: null, $lte: now },
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `HipaaAuthorizations`.
   */
  create(
    em: EntityManager,
    data: CreateHipaaAuthorizationData,
  ): HipaaAuthorizations {
    return em.create(
      HipaaAuthorizations,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        processingPurposeId: data.processingPurposeId,
        recipientDescription: data.recipientDescription,
        informationDescription: data.informationDescription,
        expirationTypeConceptId: data.expirationTypeConceptId,
        expiresAt: data.expiresAt,
        expirationEventText: data.expirationEventText,
        statusConceptId: data.statusConceptId,
        signedAt: data.signedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
