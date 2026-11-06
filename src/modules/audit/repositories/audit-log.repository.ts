import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import { CONCEPTS } from '../../../common/constants/concepts';
import {
  getAuditRequestContext,
  isUuid,
  markAuditSealed,
} from '../../../common/audit-trail';
import { AuditLog } from '../entities';

/** Datos de un evento de auditoría (provenance) a sellar en la cadena. */
export interface AppendAuditData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Valor de action mantenido por la instancia.
   */
  action: string;
  /**
   * Valor de entity mantenido por la instancia.
   */
  entity: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a entity.
   */
  entityId?: string;
  /**
   * Valor de ip mantenido por la instancia.
   */
  ip?: string;
  /**
   * Identificador asociado a device.
   */
  deviceId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a `audit.audit_log` — tabla WORM (append-only) con cadena hash-encadenada
 * (tamper-evidence, UC-10-03). Cada fila enlaza con la anterior de su partición de
 * tenant mediante `previous_hash` y sella su propio contenido en `record_hash`.
 *
 * Repositorio stateless: recibe el `EntityManager` activo como primer parámetro,
 * de modo que el sellado ocurre en la MISMA transacción que el cambio de negocio.
 */
@Injectable()
export class AuditLogRepository {
  /** Serialización canónica del contenido sellado (estable entre append y verify). */
  static content(row: {
    /**
     * Identificador asociado a user.
     */
    userId: string;
    /**
     * Identificador asociado a tenant.
     */
    tenantId?: string;
    /**
     * Identificador asociado a branch.
     */
    branchId?: string;
    /**
     * Valor de action mantenido por la instancia.
     */
    action: string;
    /**
     * Valor de entity mantenido por la instancia.
     */
    entity: string;
    /**
     * Identificador asociado a entity.
     */
    entityId?: string;
    /**
     * Identificador asociado a outcome concept.
     */
    outcomeConceptId: string;
    /**
     * Valor de ip mantenido por la instancia.
     */
    ip?: string;
    /**
     * Identificador asociado a device.
     */
    deviceId?: string;
  }): string {
    return JSON.stringify([
      row.userId,
      row.tenantId ?? null,
      row.branchId ?? null,
      row.action,
      row.entity,
      row.entityId ?? null,
      row.outcomeConceptId,
      row.ip ?? null,
      row.deviceId ?? null,
    ]);
  }

  /** Hash de un eslabón: H(previous_hash || contenido || recorded_at). */
  static hash(
    previousHash: string | undefined,
    content: string,
    recordedAt: Date,
  ): string {
    return createHash('sha256')
      .update(`${previousHash ?? ''}|${content}|${recordedAt.toISOString()}`)
      .digest('hex');
  }

  /**
   * Serializa el append por partición de tenant dentro de la transacción actual.
   *
   * El cerrojo es un `pg_advisory_xact_lock`: se toma sobre la MISMA transacción
   * que hará el insert y se libera solo al COMMIT/ROLLBACK. Así, entre leer el
   * tip de la cadena (`previous_hash`) e insertar el nuevo eslabón, ningún otro
   * append del mismo tenant puede colarse; sin él, dos escrituras concurrentes
   * leerían el mismo `previous_hash` y bifurcarían la cadena WORM.
   *
   * La clave se compone en JS (`audit:<tenant>`) y se hashea con `hashtext(?)`:
   * así la partición global (`tenant_id IS NULL`) obtiene una clave estable en
   * vez del NULL que devolvería `'audit:'||NULL`, que no bloquearía nada.
   */
  private lockChainPartition(
    em: EntityManager,
    tenantId?: string,
  ): Promise<unknown> {
    return em.execute('SELECT pg_advisory_xact_lock(hashtext(?))', [
      `audit:${tenantId ?? ''}`,
    ]);
  }

  /**
   * Última fila de la cadena de la partición para leer `previous_hash`. La
   * partición es el tenant (o la partición global `tenant_id IS NULL`): así cada
   * cadena es autoconsistente y no se entrelaza con la de otros tenants.
   */
  findChainTip(em: EntityManager, tenantId?: string): Promise<AuditLog | null> {
    // El mismo orden `(recorded_at, id)` con el que la verificación recorre la
    // cadena: si dos eslabones (de antes del desempate) compartieran milisegundo,
    // el último que ve la verificación es el que se toma como previo.
    return em.findOne(
      AuditLog,
      { tenantId: tenantId ?? null },
      { orderBy: { recordedAt: 'desc', id: 'desc' } },
    );
  }

  /**
   * Instante del nuevo eslabón, estrictamente posterior al del tip de su
   * partición. `recorded_at` tiene precisión de milisegundo y varios asientos
   * pueden sellarse en la misma transacción (una búsqueda de pacientes deja
   * hasta media docena): con el reloj solo, dos compartirían instante, el tip
   * (`order by recorded_at desc`) sería ambiguo y la cadena se bifurcaría, y la
   * verificación, que ordena por `(recorded_at, id)` con `id` aleatorio, los
   * recorrería en otro orden que el de inserción. Con un instante único por
   * partición el orden de la cadena es el de `recorded_at`, sin empates.
   */
  static nextRecordedAt(previous: Date | undefined, now = new Date()): Date {
    return previous && now.getTime() <= previous.getTime()
      ? new Date(previous.getTime() + 1)
      : now;
  }

  /**
   * Sella y encola un evento de auditoría (UC-10-03/04). No hace flush: el servicio
   * controla la unidad de trabajo. Debe llamarse una sola vez por tx para no romper
   * el orden de la cadena (lee el tip antes de insertar).
   */
  async append(
    em: EntityManager,
    appendData: AppendAuditData,
  ): Promise<AuditLog> {
    const data = await this.withRequestOrigin(em, appendData);
    // Serializa el append por tenant ANTES de leer el tip: leer el último eslabón
    // e insertar el nuevo pasa a ser atómico frente a otros appends del tenant.
    await this.lockChainPartition(em, data.tenantId);
    const tip = await this.findChainTip(em, data.tenantId);
    const recordedAt = AuditLogRepository.nextRecordedAt(tip?.recordedAt);
    const previousHash = tip?.recordHash;
    const content = AuditLogRepository.content(data);
    const recordHash = AuditLogRepository.hash(
      previousHash,
      content,
      recordedAt,
    );
    const row = em.create(
      AuditLog,
      {
        userId: data.userId,
        tenantId: data.tenantId,
        branchId: data.branchId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        outcomeConceptId: data.outcomeConceptId,
        ip: data.ip,
        deviceId: data.deviceId,
        previousHash,
        recordHash,
        recordedAt,
        recordedByUserId: data.recordedByUserId ?? data.userId,
      },
      { partial: true },
    );
    markAuditSealed(data.outcomeConceptId !== CONCEPTS.OUTCOME_FAILURE);
    return row;
  }

  /**
   * Completa `ip` y `device_id` con el origen de la petición en curso cuando el
   * llamador no los trae (defecto §1.4.1 del informe C: hasta acá ningún sello
   * los llenaba). El dispositivo sale de `iam.sessions.device_id` de la sesión
   * del token y se consulta una sola vez por request.
   */
  private async withRequestOrigin(
    em: EntityManager,
    data: AppendAuditData,
  ): Promise<AppendAuditData> {
    const context = getAuditRequestContext();
    if (!context) return data;
    return {
      ...data,
      ip: data.ip ?? context.ip,
      deviceId: data.deviceId ?? (await this.sessionDeviceId(em)),
    };
  }

  private async sessionDeviceId(
    em: EntityManager,
  ): Promise<string | undefined> {
    const context = getAuditRequestContext();
    if (!context?.sessionId) return undefined;
    if (context.deviceId === undefined) {
      const rows = await em.execute<{ device_id: string | null }[]>(
        'SELECT device_id FROM iam.sessions WHERE token_id = ? LIMIT 1',
        [context.sessionId],
      );
      const deviceId = rows[0]?.device_id;
      context.deviceId = isUuid(deviceId) ? deviceId : null;
    }
    return context.deviceId ?? undefined;
  }

  /**
   * Página de la cadena ordenada (asc) de una partición para recomputar y
   * cotejar (UC-10-06). `after` es el cursor (último eslabón ya leído): la
   * página siguiente arranca estrictamente después de él, de modo que una
   * verificación completa recorre toda la partición con una misma definición
   * de orden `(recorded_at, id)`.
   */
  findChain(
    em: EntityManager,
    tenantId?: string,
    limit = 1000,
    after?: Pick<AuditLog, 'id' | 'recordedAt'>,
  ): Promise<AuditLog[]> {
    return em.find(
      AuditLog,
      {
        tenantId: tenantId ?? null,
        ...(after
          ? {
              $or: [
                { recordedAt: { $gt: after.recordedAt } },
                { recordedAt: after.recordedAt, id: { $gt: after.id } },
              ],
            }
          : {}),
      },
      {
        orderBy: { recordedAt: 'asc', id: 'asc' },
        limit,
        disableIdentityMap: true,
      },
    );
  }
}
