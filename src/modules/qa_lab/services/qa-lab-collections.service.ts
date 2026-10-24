import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { TestSchedules } from '../entities';
import type { ListSchedulesQueryDto, TestScheduleItemDto } from '../dto';

/**
 * Lecturas de colección de `qa_lab`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class QaLabCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar agendas de QA del tenant (V36-07).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listSchedules(
    query: ListSchedulesQueryDto,
  ): Promise<PageResponseDto<TestScheduleItemDto>> {
    return listTenantCollection(this.em.fork(), TestSchedules, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): TestScheduleItemDto => ({
        id: row.id,
        suiteId: row.suiteId,
        environmentId: row.environmentId,
        tenantId: row.tenantId ?? null,
        code: row.code,
        name: row.name,
        cronExpression: row.cronExpression ?? null,
        timezone: row.timezone ?? null,
        triggerConceptId: row.triggerConceptId,
        concurrencyPolicyConceptId: row.concurrencyPolicyConceptId ?? null,
        isEnabled: row.isEnabled ?? null,
        lastRunId: row.lastRunId ?? null,
        lastRunAt: row.lastRunAt ?? null,
        nextRunAt: row.nextRunAt ?? null,
        notifyChannelConceptId: row.notifyChannelConceptId ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
