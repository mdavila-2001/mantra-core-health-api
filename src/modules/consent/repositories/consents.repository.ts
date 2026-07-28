import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Consents } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta un consentimiento de directiva de privacidad. */
export interface CreateConsentData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId: string;
  /**
   * Identificador asociado a processing purpose.
   */
  processingPurposeId: string;
  /**
   * Identificador asociado a processing legal basis.
   */
  processingLegalBasisId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a granted by user.
   */
  grantedByUserId?: string;
  /**
   * Identificador asociado a granted by related person.
   */
  grantedByRelatedPersonId?: string;
  /**
   * Valor de policy uri mantenido por la instancia.
   */
  policyUri?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
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
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Consents | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Consents`.
   */
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
