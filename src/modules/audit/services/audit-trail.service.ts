import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { AuditLogRepository } from '../repositories';

/** Datos de negocio a sellar en la cadena WORM desde otro dominio. */
export interface AuditTrailEntry {
  /** Verbo de negocio, p. ej. `MEDICATION_ISSUED`, `CONSENT_WITHDRAWN`. */
  action: string;
  /** Tipo de recurso afectado, p. ej. `medication_request`. */
  entity: string;
  /** Identificador del recurso afectado. */
  entityId?: string;
  /** Tenant propietario del recurso (partición de la cadena). */
  tenantId?: string;
  /** `false` si la operación de negocio falló (por defecto `true`). */
  success?: boolean;
}

/**
 * CAN-AUDIT-001 / §9 (MISSING_AUDIT): traza de auditoría TRANSVERSAL. Cualquier
 * dominio que ejecute una mutación sensible (emisión/invalidación de receta,
 * confirmación de intervención, retiro de consentimiento, asiento contable…)
 * sella un eslabón en la cadena hash `audit.audit_log` DENTRO de su propia
 * transacción, de modo que la mutación y su evidencia son atómicas: si una falla,
 * ambas revierten. Es la contraparte de nivel de dominio de `AuditEventsService`
 * (que posee su propia unidad de trabajo para los casos de uso del módulo audit).
 *
 * Servicio stateless: recibe el `EntityManager` de la transacción activa, igual
 * que `AuditLogRepository`.
 */
@Injectable()
export class AuditTrailService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param auditLogRepo - Repositorio de la cadena WORM `audit.audit_log`.
   */
  constructor(private readonly auditLogRepo: AuditLogRepository) {}

  /**
   * Sella un evento de negocio en la cadena de auditoría, en la transacción del
   * llamador. No hace `flush`: la unidad de trabajo del dominio la controla el
   * servicio que invoca (típicamente dentro de `em.transactional`).
   */
  async record(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: AuditTrailEntry,
  ): Promise<void> {
    await this.auditLogRepo.append(tx, {
      userId: actor.id,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      outcomeConceptId:
        entry.success === false
          ? CONCEPTS.OUTCOME_FAILURE
          : CONCEPTS.OUTCOME_SUCCESS,
      tenantId: entry.tenantId,
      recordedByUserId: actor.id,
    });
  }
}
