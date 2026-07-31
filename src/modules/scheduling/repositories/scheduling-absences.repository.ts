import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CalendarAbsences } from '../entities';

/**
 * Acceso de solo lectura a las ausencias de calendario de
 * `scheduling.calendar_absences`.
 *
 * Una ausencia bloquea la agenda de un recurso (`resource_id`) durante una
 * ventana `start_at → end_at`, de ahí que la consulta natural sea por recurso.
 */
@Injectable()
export class SchedulingAbsencesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CalendarAbsences | null>`.
   */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<CalendarAbsences | null> {
    return em.findOne(CalendarAbsences, { id, tenantId });
  }

  /**
   * Ausencias de un recurso, de la más reciente a la más antigua por inicio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param resourceId - Identificador de resource.
   * @returns Resultado de list by resource conforme al contrato `Promise<CalendarAbsences[]>`.
   */
  listByResource(
    em: EntityManager,
    tenantId: string,
    resourceId: string,
  ): Promise<CalendarAbsences[]> {
    return em.find(
      CalendarAbsences,
      { tenantId, resourceId },
      { orderBy: { startAt: 'DESC' } },
    );
  }
}
