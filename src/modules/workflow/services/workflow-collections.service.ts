import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import { WorkflowInstances } from '../entities';
import type { ListInstancesQueryDto, WorkflowInstanceItemDto } from '../dto';

/**
 * Lecturas de colección de `workflow`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class WorkflowCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar instancias de flujo de trabajo del tenant (V32-05).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listInstances(
    query: ListInstancesQueryDto,
  ): Promise<PageResponseDto<WorkflowInstanceItemDto>> {
    return listTenantCollection(this.em.fork(), WorkflowInstances, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        subjectId: query.subjectId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): WorkflowInstanceItemDto => ({
        id: row.id,
        workflowCode: row.workflowCode,
        subjectTypeConceptId: row.subjectTypeConceptId,
        subjectId: row.subjectId,
        tenantId: row.tenantId,
        currentStateConceptId: row.currentStateConceptId,
        currentStepCode: row.currentStepCode ?? null,
        contextJson: row.contextJson ?? null,
        dueAt: row.dueAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
