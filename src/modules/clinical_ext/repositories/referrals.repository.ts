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
   * Tipo de derivación (`CEXT.REFERRAL_TYPE_*`).
   */
  referralTypeConceptId?: string;
  /**
   * Servicio del catálogo del destino.
   */
  targetServiceCatalogId?: string;
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

  /**
   * Detecta una referencia duplicada.
   *
   * Mismo encuentro, mismo tipo y mismo destino: con servicio, el servicio (y
   * el profesional, o su ausencia); sin servicio, el profesional y la
   * especialidad, como antes. Las derivaciones anteriores al tipo (`null`)
   * cuentan como consulta, que es el valor por defecto.
   */
  findDuplicate(
    em: EntityManager,
    criteria: {
      sourceEncounterId: string;
      referralTypeConceptId: string;
      treatNullTypeAsSame: boolean;
      targetProfileId?: string;
      specialtyConceptId?: string;
      targetServiceCatalogId?: string;
    },
  ): Promise<Referrals | null> {
    const where: Record<string, unknown> = {
      sourceEncounterId: criteria.sourceEncounterId,
    };
    if (criteria.treatNullTypeAsSame) {
      where.$or = [
        { referralTypeConceptId: criteria.referralTypeConceptId },
        { referralTypeConceptId: null },
      ];
    } else {
      where.referralTypeConceptId = criteria.referralTypeConceptId;
    }
    if (criteria.targetServiceCatalogId) {
      where.targetServiceCatalogId = criteria.targetServiceCatalogId;
      where.targetProfileId = criteria.targetProfileId ?? null;
    } else {
      where.targetProfileId = criteria.targetProfileId;
      where.specialtyConceptId = criteria.specialtyConceptId;
      where.targetServiceCatalogId = null;
    }
    return em.findOne(Referrals, where);
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Referrals`.
   */
  /**
   * Las derivaciones de un paciente.
   *
   * Es lo que responde «¿a quién lo mandé y en qué quedó?». Se escribían y no
   * había forma de listarlas, así que el expediente no podía mostrarlas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente.
   * @param limit - Tope de filas.
   * @returns Las derivaciones, de la más reciente a la más antigua.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    limit: number,
  ): Promise<Referrals[]> {
    return em.find(
      Referrals,
      { patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

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
        referralTypeConceptId: data.referralTypeConceptId,
        targetServiceCatalogId: data.targetServiceCatalogId,
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
