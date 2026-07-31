import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SecurityIncidents,
  BreachNotifications,
  KeyRotationEvents,
  PartitionSpecs,
} from '../entities';

/**
 * Acceso a datos de seguridad y operaciones de sistema: incidentes de seguridad,
 * notificaciones de brecha derivadas de un incidente, eventos de rotación de
 * claves de cifrado y especificaciones de partición de tablas. Solo lectura por
 * id y listados con sentido según las FK/columnas reales.
 */
@Injectable()
export class SystemOpsSecurityRepository {
  /**
   * Obtiene find incident by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find incident by id conforme al contrato `Promise<SecurityIncidents | null>`.
   */
  /**
   * `tenant_id` es nullable (hay incidentes de plataforma sin tenant): quien
   * conecte este método a un endpoint debe decidir con qué rol se expone —
   * `tenantId` aquí sólo acota cuando el incidente SÍ tiene tenant.
   */
  findIncidentById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<SecurityIncidents | null> {
    return em.findOne(SecurityIncidents, { id, tenantId });
  }

  /** Incidentes de un tenant, del más reciente al más antiguo. */
  listIncidentsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<SecurityIncidents[]> {
    return em.find(
      SecurityIncidents,
      { tenantId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Obtiene find breach notification by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find breach notification by id conforme al contrato `Promise<BreachNotifications | null>`.
   */
  findBreachNotificationById(
    em: EntityManager,
    id: string,
  ): Promise<BreachNotifications | null> {
    return em.findOne(BreachNotifications, { id });
  }

  /** Notificaciones de brecha asociadas a un incidente de seguridad. */
  listBreachNotificationsByIncident(
    em: EntityManager,
    securityIncidentId: string,
  ): Promise<BreachNotifications[]> {
    return em.find(
      BreachNotifications,
      { securityIncidentId },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /**
   * Obtiene find key rotation by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find key rotation by id conforme al contrato `Promise<KeyRotationEvents | null>`.
   */
  findKeyRotationById(
    em: EntityManager,
    id: string,
  ): Promise<KeyRotationEvents | null> {
    return em.findOne(KeyRotationEvents, { id });
  }

  /** Eventos de rotación de una clave de cifrado, del más reciente al más antiguo. */
  listKeyRotationsByKey(
    em: EntityManager,
    encryptionKeyId: string,
  ): Promise<KeyRotationEvents[]> {
    return em.find(
      KeyRotationEvents,
      { encryptionKeyId },
      { orderBy: { occurredAt: 'DESC' } },
    );
  }

  /**
   * Obtiene find partition spec by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find partition spec by id conforme al contrato `Promise<PartitionSpecs | null>`.
   */
  findPartitionSpecById(
    em: EntityManager,
    id: string,
  ): Promise<PartitionSpecs | null> {
    return em.findOne(PartitionSpecs, { id });
  }

  /** Especificaciones de partición de una tabla concreta (schema.table). */
  listPartitionSpecsByTable(
    em: EntityManager,
    schemaName: string,
    tableName: string,
  ): Promise<PartitionSpecs[]> {
    return em.find(
      PartitionSpecs,
      { schemaName, tableName },
      { orderBy: { code: 'ASC' } },
    );
  }
}
