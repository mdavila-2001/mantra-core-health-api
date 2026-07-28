import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Referrals } from '../entities';
import { createdBy } from '../../../common';

/** Datos para emitir una referencia clínica. */
export interface CreateReferralData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a source encounter.
   */
  sourceEncounterId?: string;
  /**
   * Identificador asociado a referring profile.
   */
  referringProfileId?: string;
  /**
   * Identificador asociado a target profile.
   */
  targetProfileId?: string;
  /**
   * Identificador asociado a target tenant.
   */
  targetTenantId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid until mantenido por la instancia.
   */
  validUntil?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.referrals`. */
@Injectable()
export class ReferralsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Referrals | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Referrals | null> {
    return em.findOne(Referrals, { id });
  }

  /** Detecta una referencia duplicada (mismo encuentro, destino y especialidad). */
  findDuplicate(
    em: EntityManager,
    sourceEncounterId: string,
    targetProfileId: string,
    specialtyConceptId: string,
  ): Promise<Referrals | null> {
    return em.findOne(Referrals, {
      sourceEncounterId,
      targetProfileId,
      specialtyConceptId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Referrals`.
   */
  create(em: EntityManager, data: CreateReferralData): Referrals {
    return em.create(
      Referrals,
      {
        patientProfileId: data.patientProfileId,
        sourceEncounterId: data.sourceEncounterId,
        referringProfileId: data.referringProfileId,
        targetProfileId: data.targetProfileId,
        targetTenantId: data.targetTenantId,
        specialtyConceptId: data.specialtyConceptId,
        serviceRequestId: data.serviceRequestId,
        reasonConceptId: data.reasonConceptId,
        reasonText: data.reasonText,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        validUntil: data.validUntil,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
