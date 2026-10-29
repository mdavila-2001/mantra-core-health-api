import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { SampleCollectionPointView } from '../../practice/dto/sample-collection-point.types';
import { SampleCollectionPointsService } from '../../practice/services/sample-collection-points.service';

/** Lectura de los puntos de toma de una sede, en una transacción de solo lectura. */
@Injectable()
export class DiagnosticsSamplePointsService {
  /**
   * @param em - Contexto de persistencia.
   * @param points - Puntos de toma (F5b) sobre el estado operativo de F2.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly points: SampleCollectionPointsService,
  ) {}

  /**
   * @param tenantId - Tenant del contexto.
   * @param siteId - Sede (debe ser del tenant).
   * @throws ResourceNotFoundException (404) si la sede no es del tenant.
   */
  list(tenantId: string, siteId: string): Promise<SampleCollectionPointView[]> {
    return this.points.list(this.em.fork(), tenantId, siteId);
  }
}
