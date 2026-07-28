import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createHash } from 'node:crypto';
import { AuditLog } from '../entities';

/** Datos de un evento de auditoría (provenance) a sellar en la cadena. */
export interface AppendAuditData {
  userId: string;
  action: string;
  entity: string;
  outcomeConceptId: string;
  tenantId?: string;
  branchId?: string;
  entityId?: string;
  ip?: string;
  deviceId?: string;
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
    userId: string;
    tenantId?: string;
    branchId?: string;
    action: string;
    entity: string;
    entityId?: string;
    outcomeConceptId: string;
    ip?: string;
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
  private lockChainPartition(em: EntityManager, tenantId?: string): Promise<unknown> {
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
    return em.findOne(
      AuditLog,
      { tenantId: tenantId ?? null },
      { orderBy: { recordedAt: 'desc' } },
    );
  }

  /**
   * Sella y encola un evento de auditoría (UC-10-03/04). No hace flush: el servicio
   * controla la unidad de trabajo. Debe llamarse una sola vez por tx para no romper
   * el orden de la cadena (lee el tip antes de insertar).
   */
  async append(em: EntityManager, data: AppendAuditData): Promise<AuditLog> {
    const recordedAt = new Date();
    // Serializa el append por tenant ANTES de leer el tip: leer el último eslabón
    // e insertar el nuevo pasa a ser atómico frente a otros appends del tenant.
    await this.lockChainPartition(em, data.tenantId);
    const tip = await this.findChainTip(em, data.tenantId);
    const previousHash = tip?.recordHash;
    const content = AuditLogRepository.content(data);
    const recordHash = AuditLogRepository.hash(
      previousHash,
      content,
      recordedAt,
    );
    return em.create(
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
  }

  /** Cadena ordenada (asc) de una partición para recomputar y cotejar (UC-10-06). */
  findChain(
    em: EntityManager,
    tenantId?: string,
    limit = 1000,
  ): Promise<AuditLog[]> {
    return em.find(
      AuditLog,
      { tenantId: tenantId ?? null },
      { orderBy: { recordedAt: 'asc' }, limit },
    );
  }
}
