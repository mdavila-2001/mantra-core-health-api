import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DiagnosticUnits } from '../entities';
import { createdBy } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Datos de alta de una unidad diagnóstica (UC-23-01). */
export interface CreateDiagnosticUnitData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a diagnostic unit type concept.
   */
  diagnosticUnitTypeConceptId: string;
  /**
   * Identificador asociado a ownership type concept.
   */
  ownershipTypeConceptId?: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a primary practice site.
   */
  primaryPracticeSiteId?: string;
  /**
   * Valor de accepts external orders mantenido por la instancia.
   */
  acceptsExternalOrders?: boolean;
  /**
   * Valor de walk in available mantenido por la instancia.
   */
  walkInAvailable?: boolean;
  /**
   * Valor de home collection available mantenido por la instancia.
   */
  homeCollectionAvailable?: boolean;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `diagnostic_units.diagnostic_units`. Stateless: cada método
 * recibe el `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class DiagnosticUnitsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DiagnosticUnits | null>`.
   */
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
