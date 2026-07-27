import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnits } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de una unidad diagnóstica (UC-23-01). */
export interface CreateDiagnosticUnitData {
  tenantId: string;
  code: string;
  name: string;
  diagnosticUnitTypeConceptId: string;
  ownershipTypeConceptId?: string;
  practiceId?: string;
  primaryPracticeSiteId?: string;
  acceptsExternalOrders?: boolean;
  walkInAvailable?: boolean;
  homeCollectionAvailable?: boolean;
  actorUserId?: string;
}

/**
 * Acceso a datos de `diagnostic_units.diagnostic_units`. Stateless: cada método
 * recibe el `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class DiagnosticUnitsRepository {
  findById(em: EntityManager, id: string): Promise<DiagnosticUnits | null> {
    return em.findOne(DiagnosticUnits, { id });
  }

  /** Busca una unidad por (tenant, code): la UK que evita duplicados. */
  findByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<DiagnosticUnits | null> {
    return em.findOne(DiagnosticUnits, { tenantId, code });
  }

  /** Crea la unidad en estado PENDING de verificación y ACTIVA (sin flush). */
  create(em: EntityManager, data: CreateDiagnosticUnitData): DiagnosticUnits {
    return em.create(
      DiagnosticUnits,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        diagnosticUnitTypeConceptId: data.diagnosticUnitTypeConceptId,
        ownershipTypeConceptId: data.ownershipTypeConceptId,
        practiceId: data.practiceId,
        primaryPracticeSiteId: data.primaryPracticeSiteId,
        acceptsExternalOrders: data.acceptsExternalOrders,
        walkInAvailable: data.walkInAvailable,
        homeCollectionAvailable: data.homeCollectionAvailable,
        verificationStatusConceptId: DUNIT.VERIFICATION_PENDING,
        statusConceptId: DUNIT.UNIT_ACTIVE,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
