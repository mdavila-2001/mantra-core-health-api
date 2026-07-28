import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrescriptionSignaturePolicies } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una política de firma de receta. */
export interface CreatePrescriptionSignaturePolicyData {
  tenantId: string;
  jurisdictionCode?: string;
  medicationTypeConceptId?: string;
  channelConceptId?: string;
  signatureRequired: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.prescription_signature_policies` (stateless). */
@Injectable()
export class PrescriptionSignaturePoliciesRepository {
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
