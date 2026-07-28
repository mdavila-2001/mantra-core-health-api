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
