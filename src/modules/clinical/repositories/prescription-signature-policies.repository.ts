import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrescriptionSignaturePolicies } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una política de firma de receta. */
export interface CreatePrescriptionSignaturePolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de jurisdiction code mantenido por la instancia.
   */
  jurisdictionCode?: string;
  /**
   * Identificador asociado a medication type concept.
   */
  medicationTypeConceptId?: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId?: string;
  /**
   * Valor de signature required mantenido por la instancia.
   */
  signatureRequired: boolean;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Valor de effective to mantenido por la instancia.
   */
  effectiveTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.prescription_signature_policies` (stateless). */
@Injectable()
export class PrescriptionSignaturePoliciesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PrescriptionSignaturePolicies | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PrescriptionSignaturePolicies | null> {
    return em.findOne(PrescriptionSignaturePolicies, { id });
  }

  /** Todas las políticas de un tenant (para el listado administrativo). */
  findByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<PrescriptionSignaturePolicies[]> {
    return em.find(
      PrescriptionSignaturePolicies,
      { tenantId },
      { orderBy: { effectiveFrom: 'DESC', createdAt: 'DESC' } },
    );
  }

  /**
   * Políticas vigentes de un tenant en un instante: `effective_from <= now` y
   * (`effective_to` nula o futura). El filtro por dimensiones (comodines) y el
   * desempate por especificidad los aplica el servicio en memoria.
   */
  findActive(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<PrescriptionSignaturePolicies[]> {
    return em.find(
      PrescriptionSignaturePolicies,
      {
        tenantId,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
      },
      { orderBy: { effectiveFrom: 'DESC', createdAt: 'DESC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PrescriptionSignaturePolicies`.
   */
  create(
    em: EntityManager,
    data: CreatePrescriptionSignaturePolicyData,
  ): PrescriptionSignaturePolicies {
    return em.create(
      PrescriptionSignaturePolicies,
      {
        tenantId: data.tenantId,
        jurisdictionCode: data.jurisdictionCode,
        medicationTypeConceptId: data.medicationTypeConceptId,
        channelConceptId: data.channelConceptId,
        signatureRequired: data.signatureRequired,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
