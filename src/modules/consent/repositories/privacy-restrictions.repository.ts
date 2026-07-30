import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrivacyRestrictions } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una restricción de privacidad. */
export interface CreatePrivacyRestrictionData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a restriction type concept.
   */
  restrictionTypeConceptId: string;
  /**
   * Identificador asociado a data class concept.
   */
  dataClassConceptId: string;
  /**
   * Identificador asociado a target actor type concept.
   */
  targetActorTypeConceptId?: string;
  /**
   * Identificador asociado a target actor.
   */
  targetActorId?: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `consent.privacy_restrictions`. */
@Injectable()
export class PrivacyRestrictionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PrivacyRestrictions | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PrivacyRestrictions | null> {
    return em.findOne(PrivacyRestrictions, { id });
  }

  /** Restricciones activas vinculadas a un paciente (para resolución/expiración). */
  findActiveByPatient(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string,
  ): Promise<PrivacyRestrictions[]> {
    return em.find(PrivacyRestrictions, {
      patientProfileId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Restricciones activas cuyo `valid_to` ya venció (barrido). */
  findExpirable(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
  ): Promise<PrivacyRestrictions[]> {
    return em.find(PrivacyRestrictions, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lte: now },
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PrivacyRestrictions`.
   */
  create(
    em: EntityManager,
    data: CreatePrivacyRestrictionData,
  ): PrivacyRestrictions {
    return em.create(
      PrivacyRestrictions,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        restrictionTypeConceptId: data.restrictionTypeConceptId,
        dataClassConceptId: data.dataClassConceptId,
        targetActorTypeConceptId: data.targetActorTypeConceptId,
        targetActorId: data.targetActorId,
        reasonText: data.reasonText,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
