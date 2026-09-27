import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Acceso a `clinical.medication_reminder_dispatches` (patch v4.2.35).
 *
 * SQL explícito y no `em.create` + `flush`: la deduplicación depende de que el
 * reclamo sea **una sola sentencia atómica** contra el UNIQUE
 * `(medication_request_id, dose_at)`. Con `flush`, dos workers que calculan la
 * misma toma chocarían con una violación de restricción que habría que
 * interpretar; con `ON CONFLICT DO NOTHING RETURNING` el perdedor simplemente
 * no recibe fila.
 */
@Injectable()
export class MedicationReminderDispatchesRepository {
  /**
   * Reclama el aviso de una toma.
   *
   * @param em - Contexto de persistencia.
   * @param medicationRequestId - Receta.
   * @param doseAt - Instante de la toma.
   * @returns El id de la marca si este proceso la insertó; `undefined` si ya
   *   estaba reclamada (otro proceso u otra pasada ya avisó).
   */
  async claim(
    em: EntityManager,
    medicationRequestId: string,
    doseAt: Date,
  ): Promise<string | undefined> {
    const rows = await this.sql<{ id: string }>(
      em,
      `INSERT INTO clinical.medication_reminder_dispatches
              (id, medication_request_id, dose_at, created_at)
       VALUES (?, ?, ?, now())
       ON CONFLICT (medication_request_id, dose_at) DO NOTHING
       RETURNING id`,
      [randomUUID(), medicationRequestId, doseAt],
    );
    return rows[0]?.id;
  }

  /**
   * Anota qué solicitud in-app salió de la marca.
   *
   * @param em - Contexto de persistencia.
   * @param dispatchId - Marca reclamada.
   * @param notificationRequestId - Solicitud creada por `emitInApp`.
   */
  async attachNotification(
    em: EntityManager,
    dispatchId: string,
    notificationRequestId: string,
  ): Promise<void> {
    await this.sql(
      em,
      `UPDATE clinical.medication_reminder_dispatches
          SET notification_request_id = ?
        WHERE id = ?`,
      [notificationRequestId, dispatchId],
    );
  }

  /**
   * Libera una marca cuya emisión falló, para que la siguiente pasada lo
   * reintente mientras la toma siga dentro de la ventana.
   *
   * @param em - Contexto de persistencia.
   * @param dispatchId - Marca reclamada.
   */
  async release(em: EntityManager, dispatchId: string): Promise<void> {
    await this.sql(
      em,
      `DELETE FROM clinical.medication_reminder_dispatches WHERE id = ?`,
      [dispatchId],
    );
  }

  private sql<T>(
    em: EntityManager,
    query: string,
    params: unknown[],
  ): Promise<T[]> {
    return em
      .getConnection()
      .execute<T[]>(query, params, 'all', em.getTransactionContext());
  }
}
