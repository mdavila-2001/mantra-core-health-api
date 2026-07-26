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
  findRequest(em: EntityManager, id: string): Promise<PriorAuthorizationRequests | null> {
    return em.findOne(PriorAuthorizationRequests, { id });
  }

  createRequest(em: EntityManager, data: Record<string, unknown>): PriorAuthorizationRequests {
    return em.create(PriorAuthorizationRequests, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

  createItem(em: EntityManager, data: Record<string, unknown>): PriorAuthorizationItems {
    return em.create(
      PriorAuthorizationItems,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }

  /** Mayor `determination_version` existente para la solicitud (0 si ninguna). */
  async maxDeterminationVersion(em: EntityManager, requestId: string): Promise<number> {
    const last = await em.findOne(
      PriorAuthorizationDeterminations,
      { priorAuthorizationRequestId: requestId },
      { orderBy: { determinationVersion: 'DESC' } },
    );
    return last?.determinationVersion ?? 0;
  }

  createDetermination(em: EntityManager, data: Record<string, unknown>): PriorAuthorizationDeterminations {
    return em.create(
      PriorAuthorizationDeterminations,
      { ...data, decidedAt: new Date(), decidedByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }
}
