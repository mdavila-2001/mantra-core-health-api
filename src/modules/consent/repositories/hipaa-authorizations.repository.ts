import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { HipaaAuthorizations } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para otorgar una autorización HIPAA de divulgación. */
export interface CreateHipaaAuthorizationData {
  patientProfileId: string;
  tenantId: string;
  processingPurposeId: string;
  recipientDescription: string;
  informationDescription: string;
  expirationTypeConceptId: string;
  expiresAt?: Date;
  expirationEventText?: string;
  statusConceptId: string;
  signedAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `consent.hipaa_authorizations`. */
@Injectable()
export class HipaaAuthorizationsRepository {
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
