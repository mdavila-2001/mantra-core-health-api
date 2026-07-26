import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DsarRequests } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una solicitud DSAR del titular (UC-10-08). */
export interface CreateDsarData {
  userId: string;
  typeConceptId: string;
  statusConceptId: string;
  jurisdictionConceptId?: string;
  actorUserId?: string;
}

/**
 * Acceso a `audit.dsar_requests` — a diferencia de las tablas WORM, tiene ciclo de
 * vida (`row_version` optimista, `created_at`/`updated_at`). Nunca fijamos
 * `row_version` (lo gestiona MikroORM). Stateless.
 */
@Injectable()
export class DsarRequestsRepository {
  /** Busca una solicitud por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<DsarRequests | null> {
    return em.findOne(DsarRequests, { id });
  }

  /** Crea la solicitud (estado inicial) en la unidad de trabajo; sin flush. */
  create(em: EntityManager, data: CreateDsarData): DsarRequests {
    return em.create(
      DsarRequests,
      {
        userId: data.userId,
        typeConceptId: data.typeConceptId,
        statusConceptId: data.statusConceptId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        requestedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
