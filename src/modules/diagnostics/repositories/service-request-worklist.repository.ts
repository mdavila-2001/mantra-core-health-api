import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CLIN } from '../../clinical/clinical.concepts';

/** Estado de una orden en la bandeja del ejecutor, derivado de datos reales. */
export type WorklistState =
  'PENDING' | 'RECEIVED' | 'IN_PROCESS' | 'REPORTED' | 'CANCELLED';

export const WORKLIST_STATES: readonly WorklistState[] = [
  'PENDING',
  'RECEIVED',
  'IN_PROCESS',
  'REPORTED',
  'CANCELLED',
];

/** Fila del bloque: la orden y su estado derivado. */
export interface WorklistRow {
  readonly id: string;
  readonly createdAt: Date;
  readonly state: WorklistState;
}

/** Última fila de la página anterior (keyset, de la más nueva a la más vieja). */
export interface WorklistAfterKey {
  readonly createdAt: Date;
  readonly id: string;
}

/**
 * Lecturas de la bandeja del ejecutor (laboratorio o imagenología).
 *
 * El estado NO se guarda: se deriva en la consulta de lo que existe.
 *
 * - `CANCELLED`: la orden está revocada o fue satisfecha por un informe previo
 *   (el ejecutor no tiene nada que hacer). Los borradores no se listan.
 * - `REPORTED`: hay un informe liberado de la orden (mismos criterios que la
 *   antiduplicación: versión liberada, `DR_RELEASED` o `DR_FINAL`).
 * - `IN_PROCESS`: laboratorio, un renglón de orden de trabajo
 *   (`laboratory_work_order_tests`) de este ejecutor; imagen, un informe aún no
 *   liberado de un estudio ya recibido.
 * - `RECEIVED`: laboratorio, una acesión de este ejecutor o un espécimen con
 *   `received_at`; imagen, un `imaging_studies` de este ejecutor.
 * - `PENDING`: nada de lo anterior.
 *
 * Todo dato del ejecutor (acesión, orden de trabajo, estudio, espécimen) se
 * acota por `custodian_tenant_id` = el tenant del ejecutor: lo que haya hecho
 * otro centro con la misma orden no cuenta.
 */
@Injectable()
export class ServiceRequestWorklistRepository {
  /** Un bloque de órdenes del ejecutor, de la más nueva a la más vieja. */
  async findBlock(
    em: EntityManager,
    performerTenantId: string,
    categoryConceptIds: readonly string[],
    states: readonly WorklistState[] | undefined,
    after: WorklistAfterKey | undefined,
    limit: number,
  ): Promise<WorklistRow[]> {
    const { stateSql, stateParams } = stateExpression();
    const params: unknown[] = [
      ...stateParams,
      performerTenantId,
      categoryConceptIds.join(','),
      CLIN.SERVICE_REQUEST_DRAFT,
    ];
    let keyset = '';
    if (after) {
      keyset = ' AND (sr.created_at, sr.id) < (?::timestamptz, ?::uuid)';
      params.push(after.createdAt, after.id);
    }
    let outer = '';
    const outerParams: unknown[] = [];
    if (states && states.length > 0) {
      outer = " WHERE b.state = ANY(string_to_array(?, ','))";
      outerParams.push(states.join(','));
    }
    const rows = await em
      .getConnection()
      .execute<{ id: string; created_at: Date; state: WorklistState }[]>(
        `SELECT b.id, b.created_at, b.state FROM (
         SELECT sr.id, sr.created_at, ${stateSql} AS state
           FROM clinical.service_requests sr
          WHERE sr.performer_tenant_id = ?
            AND sr.category_concept_id = ANY(string_to_array(?, ',')::uuid[])
            AND sr.status_concept_id <> ?${keyset}
       ) b${outer}
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT ?`,
        [...params, ...outerParams, limit],
        'all',
      );
    return rows.map((r) => ({
      id: r.id,
      createdAt: new Date(r.created_at),
      state: r.state,
    }));
  }

  /** El estado derivado de UNA orden del ejecutor, o `null` si no es suya. */
  async findState(
    em: EntityManager,
    performerTenantId: string,
    serviceRequestId: string,
  ): Promise<WorklistState | null> {
    const { stateSql, stateParams } = stateExpression();
    const rows = await em.getConnection().execute<{ state: WorklistState }[]>(
      `SELECT ${stateSql} AS state
         FROM clinical.service_requests sr
        WHERE sr.id = ? AND sr.performer_tenant_id = ?`,
      [...stateParams, serviceRequestId, performerTenantId],
      'all',
    );
    return rows[0]?.state ?? null;
  }
}

/**
 * La expresión CASE del estado. Los `?` que lleva se refieren al tenant del
 * ejecutor (`sr.performer_tenant_id`): se repite como parámetro donde hace falta.
 * Para no depender de un parámetro externo usa `sr.performer_tenant_id` directo.
 */
function stateExpression(): { stateSql: string; stateParams: unknown[] } {
  const released = `(r.current_released_version_id IS NOT NULL
                     OR r.result_release_status_concept_id = ?
                     OR r.lifecycle_status_concept_id = ?)`;
  const stateSql = `CASE
    WHEN sr.status_concept_id = ANY(string_to_array(?, ',')::uuid[]) THEN 'CANCELLED'
    WHEN EXISTS (SELECT 1 FROM clinical.diagnostic_reports r
                  WHERE r.service_request_id = sr.id AND ${released}) THEN 'REPORTED'
    WHEN EXISTS (SELECT 1 FROM diagnostics.laboratory_work_order_tests t
                   JOIN diagnostics.laboratory_work_orders w ON w.id = t.laboratory_work_order_id
                  WHERE t.service_request_id = sr.id
                    AND w.custodian_tenant_id = sr.performer_tenant_id)
      OR (EXISTS (SELECT 1 FROM diagnostics.imaging_studies s
                   WHERE s.service_request_id = sr.id
                     AND s.custodian_tenant_id = sr.performer_tenant_id)
          AND EXISTS (SELECT 1 FROM clinical.diagnostic_reports r
                       WHERE r.service_request_id = sr.id)) THEN 'IN_PROCESS'
    WHEN EXISTS (SELECT 1 FROM diagnostics.laboratory_accessions a
                  WHERE a.service_request_id = sr.id
                    AND a.custodian_tenant_id = sr.performer_tenant_id)
      OR EXISTS (SELECT 1 FROM diagnostics.specimens sp
                  WHERE sp.service_request_id = sr.id
                    AND sp.custodian_tenant_id = sr.performer_tenant_id
                    AND sp.received_at IS NOT NULL)
      OR EXISTS (SELECT 1 FROM diagnostics.imaging_studies s
                  WHERE s.service_request_id = sr.id
                    AND s.custodian_tenant_id = sr.performer_tenant_id) THEN 'RECEIVED'
    ELSE 'PENDING'
  END`;
  return {
    stateSql,
    stateParams: [
      [
        CLIN.SERVICE_REQUEST_REVOKED,
        CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR,
      ].join(','),
      CLIN.RELEASE_RELEASED,
      CLIN.REPORT_FINAL,
    ],
  };
}
