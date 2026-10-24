import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { QueuedJobs } from '../entities';
import type { ListJobsQueryDto, QueuedJobItemDto } from '../dto';

/**
 * Lecturas de colección de `messaging`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class MessagingCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar trabajos encolados del tenant (V35-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listJobs(
    query: ListJobsQueryDto,
  ): Promise<PageResponseDto<QueuedJobItemDto>> {
    return listTenantCollection(this.em.fork(), QueuedJobs, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt', 'completedAt'],
      where: definedFilters({
        queueId: query.queueId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): QueuedJobItemDto => ({
        id: row.id,
        queueId: row.queueId,
        tenantId: row.tenantId ?? null,
        jobType: row.jobType,
        dedupeKey: row.dedupeKey ?? null,
        priority: row.priority,
        statusConceptId: row.statusConceptId,
        availableAt: row.availableAt ?? null,
        startedAt: row.startedAt ?? null,
        completedAt: row.completedAt ?? null,
        attempts: row.attempts,
        maxAttempts: row.maxAttempts,
        lockedBy: row.lockedBy ?? null,
        lockExpiresAt: row.lockExpiresAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
