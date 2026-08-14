import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests, DiagnosticReports } from '../../clinical/entities';

/**
 * Lectura del circuito diagnóstico sobre las tablas del módulo clínico
 * (`clinical.service_requests` y `clinical.diagnostic_reports`).
 *
 * Vive en `diagnostics` y no en `clinical` porque la pregunta es de este
 * dominio —«¿qué le pedí a este paciente y qué volvió?»— y porque el módulo
 * clínico ya expone su propia cara de lectura para la suya. Es una clase sin
 * estado que recibe el `EntityManager` por parámetro, igual que
 * `AppointmentsRepository` en `scheduling`: proveerla acá no duplica ninguna
 * fuente de verdad ni obliga a importar el módulo clínico entero.
 *
 * **No escribe.** El alta de una orden diagnóstica sigue siendo
 * `POST /clinical/service-requests`, que es donde viven sus invariantes.
 */
@Injectable()
export class DiagnosticOrdersRepository {
  /**
   * Órdenes de servicio del paciente acotadas a las categorías diagnósticas.
   *
   * El filtro por categoría es lo que hace que esto sea el circuito diagnóstico
   * y no «todas las órdenes»: una derivación a otra especialidad también es una
   * `service_request`, y mezclarla acá convertiría la pantalla de laboratorio en
   * una bandeja de todo.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente cuyas órdenes se leen.
   * @param categoryConceptIds - Categorías consideradas diagnósticas.
   * @param limit - Tope de filas.
   * @returns Las órdenes, de la más nueva a la más vieja.
   */
  findOrdersByPatient(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    categoryConceptIds: readonly string[],
    limit: number,
  ): Promise<ServiceRequests[]> {
    return em.find(
      ServiceRequests,
      {
        custodianTenantId,
        patientProfileId,
        categoryConceptId: { $in: [...categoryConceptIds] },
      },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }

  /**
   * Informes diagnósticos del paciente.
   *
   * No se filtran por categoría: un informe ya cuelga del circuito diagnóstico
   * por definición —lo emite `POST /clinical/diagnostic-reports` desde una
   * orden—, y recortarlo por categoría escondería los que se emitieron sin
   * declararla.
   *
   * @param em - Contexto de persistencia.
   * @param custodianTenantId - Tenant del contexto.
   * @param patientProfileId - Paciente cuyos informes se leen.
   * @param limit - Tope de filas.
   * @returns Los informes, del más nuevo al más viejo.
   */
  findReportsByPatient(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    limit: number,
  ): Promise<DiagnosticReports[]> {
    return em.find(
      DiagnosticReports,
      { custodianTenantId, patientProfileId },
      { orderBy: { createdAt: 'DESC' }, limit },
    );
  }
}
