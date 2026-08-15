import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { PharmaCostAllocations, VisitorPostSubmissions } from '../entities';

/**
 * Acceso a datos de la imputación analítica y de las publicaciones de visitador
 * pendientes de aprobación. Son dos superficies pequeñas que comparten
 * repositorio para no multiplicar clases de dos métodos.
 */
@Injectable()
export class AnalyticsRepository {
  /**
   * Crea una imputación analítica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createAllocation(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PharmaCostAllocations {
    return em.create(
      PharmaCostAllocations,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Lista las imputaciones de un laboratorio dentro de un periodo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @param from - Inicio del periodo, `YYYY-MM-DD`.
   * @param to - Fin del periodo, `YYYY-MM-DD`.
   * @returns Imputaciones del periodo.
   */
  listAllocations(
    em: EntityManager,
    pharmaLabId: string,
    from: string,
    to: string,
  ): Promise<PharmaCostAllocations[]> {
    return em.find(
      PharmaCostAllocations,
      { pharmaLabId, allocatedOn: { $gte: from, $lte: to } },
      { orderBy: { allocatedOn: 'asc' }, limit: 5000 },
    );
  }

  /**
   * Crea una propuesta de publicación de visitador.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la nueva fila.
   * @returns La entidad creada, aún sin `flush`.
   */
  createPostSubmission(
    em: EntityManager,
    data: Record<string, unknown>,
  ): VisitorPostSubmissions {
    return em.create(
      VisitorPostSubmissions,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene una propuesta de publicación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la propuesta.
   * @returns La propuesta, o `null` si no existe.
   */
  findPostSubmission(
    em: EntityManager,
    id: string,
  ): Promise<VisitorPostSubmissions | null> {
    return em.findOne(VisitorPostSubmissions, { id });
  }

  /**
   * Lista las propuestas de publicación de un laboratorio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pharmaLabId - Laboratorio.
   * @returns Propuestas de la más reciente a la más antigua.
   */
  listPostSubmissions(
    em: EntityManager,
    pharmaLabId: string,
  ): Promise<VisitorPostSubmissions[]> {
    return em.find(
      VisitorPostSubmissions,
      { pharmaLabId },
      { orderBy: { createdAt: 'desc' }, limit: 200 },
    );
  }
}
