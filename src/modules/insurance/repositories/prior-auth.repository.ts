import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  PriorAuthorizationRequests,
  PriorAuthorizationItems,
  PriorAuthorizationDeterminations,
} from '../entities';

/**
 * Acceso a datos de autorización previa: solicitudes (mutables, con estado y
 * `row_version`), ítems (solo-alta) y determinaciones (append-only/inmutables).
 */
@Injectable()
export class PriorAuthRepository {
  /**
   * Obtiene find request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find request conforme al contrato `Promise<PriorAuthorizationRequests | null>`.
   */
  findRequest(
    em: EntityManager,
    id: string,
  ): Promise<PriorAuthorizationRequests | null> {
    return em.findOne(PriorAuthorizationRequests, { id });
  }

  /**
   * Crea create request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create request conforme al contrato `PriorAuthorizationRequests`.
   */
  createRequest(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PriorAuthorizationRequests {
    return em.create(
      PriorAuthorizationRequests,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `PriorAuthorizationItems`.
   */
  createItem(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PriorAuthorizationItems {
    return em.create(
      PriorAuthorizationItems,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }

  /**
   * Ids de las solicitudes cuya cobertura pertenece a la aseguradora
   * (cobertura → plan → producto → aseguradora; la solicitud no tiene columna
   * de aseguradora). El filtro va dentro de la consulta: nunca se lee una
   * solicitud ajena para descartarla después.
   *
   * @param em - Contexto de persistencia.
   * @param carrierId - Aseguradora del tenant activo.
   * @param statusConceptIds - Estados admitidos; vacío = todos.
   * @param limit - Máximo de filas, las más recientes primero.
   */
  async findIdsForCarrier(
    em: EntityManager,
    carrierId: string,
    statusConceptIds: readonly string[],
    limit: number,
  ): Promise<string[]> {
    const rows = await em.getConnection().execute<{ id: string }[]>(
      `SELECT r.id
         FROM insurance.prior_authorization_requests r
         JOIN insurance.patient_coverages pc ON pc.id = r.patient_coverage_id
         JOIN insurance.insurance_plans pl ON pl.id = pc.insurance_plan_id
         JOIN insurance.insurance_products pr ON pr.id = pl.insurance_product_id
        WHERE pr.insurance_carrier_id = ?
          AND (cardinality(?::uuid[]) = 0 OR r.status_concept_id = ANY(?::uuid[]))
        ORDER BY r.submitted_at DESC NULLS LAST, r.id DESC
        LIMIT ?`,
      [
        carrierId,
        `{${statusConceptIds.join(',')}}`,
        `{${statusConceptIds.join(',')}}`,
        limit,
      ],
    );
    return rows.map((row) => row.id);
  }

  /** Solicitudes por id, sin orden garantizado. */
  findRequestsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PriorAuthorizationRequests[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PriorAuthorizationRequests, { id: { $in: [...ids] } });
  }

  /** Ítems de las solicitudes, en su orden de secuencia. */
  findItemsByRequestIds(
    em: EntityManager,
    requestIds: readonly string[],
  ): Promise<PriorAuthorizationItems[]> {
    if (requestIds.length === 0) return Promise.resolve([]);
    return em.find(
      PriorAuthorizationItems,
      { priorAuthorizationRequestId: { $in: [...requestIds] } },
      { orderBy: { itemSequence: 'ASC' } },
    );
  }

  /** Determinaciones de las solicitudes, de la versión más nueva a la más vieja. */
  findDeterminationsByRequestIds(
    em: EntityManager,
    requestIds: readonly string[],
  ): Promise<PriorAuthorizationDeterminations[]> {
    if (requestIds.length === 0) return Promise.resolve([]);
    return em.find(
      PriorAuthorizationDeterminations,
      { priorAuthorizationRequestId: { $in: [...requestIds] } },
      { orderBy: { determinationVersion: 'DESC' } },
    );
  }

  /** Mayor `determination_version` existente para la solicitud (0 si ninguna). */
  async maxDeterminationVersion(
    em: EntityManager,
    requestId: string,
  ): Promise<number> {
    const last = await em.findOne(
      PriorAuthorizationDeterminations,
      { priorAuthorizationRequestId: requestId },
      { orderBy: { determinationVersion: 'DESC' } },
    );
    return last?.determinationVersion ?? 0;
  }

  /**
   * Crea create determination.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create determination conforme al contrato `PriorAuthorizationDeterminations`.
   */
  createDetermination(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PriorAuthorizationDeterminations {
    return em.create(
      PriorAuthorizationDeterminations,
      {
        ...data,
        decidedAt: new Date(),
        decidedByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }
}
