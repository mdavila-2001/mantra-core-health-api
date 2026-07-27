import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Consents } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta un consentimiento de directiva de privacidad. */
export interface CreateConsentData {
  patientProfileId: string;
  categoryConceptId: string;
  processingPurposeId: string;
  processingLegalBasisId?: string;
  statusConceptId: string;
  tenantId?: string;
  grantedByUserId?: string;
  grantedByRelatedPersonId?: string;
  policyUri?: string;
  policyVersion?: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/**
 * Acceso a datos de `consent.consents`. Stateless: cada método recibe el
 * `EntityManager` activo para que el servicio controle la transacción y el
 * `flush` padre-antes-de-hijo (las FK son columnas uuid, MikroORM no ordena
 * inserts entre entidades no relacionadas).
 */
@Injectable()
export class ConsentsRepository {
  findById(em: EntityManager, id: string): Promise<Consents | null> {
    return em.findOne(Consents, { id });
  }

  /** Consentimiento activo duplicado (mismo paciente/propósito) para el guard de unicidad. */
  findActiveByPurpose(
    em: EntityManager,
    patientProfileId: string,
    processingPurposeId: string,
    activeStatusConceptId: string,
  ): Promise<Consents | null> {
    return em.findOne(Consents, {
      patientProfileId,
      processingPurposeId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Consentimientos activos cuyo `valid_to` ya venció (barrido de expiración). */
  findExpirable(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
  ): Promise<Consents[]> {
    return em.find(Consents, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lte: now },
    });
  }

  create(em: EntityManager, data: CreateConsentData): Consents {
    return em.create(
      Consents,
      {
        patientProfileId: data.patientProfileId,
        categoryConceptId: data.categoryConceptId,
        processingPurposeId: data.processingPurposeId,
        processingLegalBasisId: data.processingLegalBasisId,
        statusConceptId: data.statusConceptId,
        tenantId: data.tenantId,
        grantedByUserId: data.grantedByUserId,
        grantedByRelatedPersonId: data.grantedByRelatedPersonId,
        policyUri: data.policyUri,
        policyVersion: data.policyVersion,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
