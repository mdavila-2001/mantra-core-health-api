import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { AccessDecisionLog } from '../entities';

/** Asiento de decisión que se anexa a la bitácora. */
export interface AppendAccessDecisionData {
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo a la que se decidió. */
  readonly userId: string;
  /** Átomo (o alias) evaluado. */
  readonly permissionCode: string;
  /** Concepto del efecto (`DECISION_EFFECT_*`). */
  readonly effectConceptId: string;
  /** Razón estable de la decisión (`SupportAccessReason`). */
  readonly reasonCode: string;
  /** Concesión que decidió. */
  readonly grantId?: string;
  /** Regla de la organización que decidió. */
  readonly ruleId?: string;
  /** Doctor del objetivo. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacio del objetivo. */
  readonly careSpaceId?: string;
  /** Paciente del hecho. */
  readonly patientProfileId?: string;
  /** Aprobación (cuatro ojos) usada. */
  readonly approvalId?: string;
  /** Correlación de la petición. */
  readonly correlationId?: string;
  /** Sesión (`iam.sessions.token_id`). */
  readonly sessionId?: string;
  /** Dirección de origen. */
  readonly ip?: string;
  /** Identificadores y números; nunca texto libre ni datos del paciente. */
  readonly detail?: unknown;
  /** Instante del asiento. */
  readonly recordedAt: Date;
  /** Quien lo registra. */
  readonly recordedByUserId?: string;
}

/** Filtro de la consulta de asientos. */
export interface AccessDecisionLogFilter {
  /** Solo esta persona. */
  readonly userId?: string;
  /** Solo este efecto. */
  readonly effectConceptId?: string;
  /** Solo este átomo. */
  readonly permissionCode?: string;
  /** Desde (inclusive). */
  readonly from?: Date;
  /** Hasta (exclusive). */
  readonly to?: Date;
}

/** Paginación por desplazamiento. */
export interface AccessDecisionLogPage {
  /** Tope de filas. */
  readonly limit: number;
  /** Filas a saltar. */
  readonly offset?: number;
}

/** Asiento equivalente buscado para deduplicar. */
export interface EquivalentDecisionQuery {
  /** Organización. */
  readonly tenantId: string;
  /** Persona. */
  readonly userId: string;
  /** Átomo. */
  readonly permissionCode: string;
  /** Efecto. */
  readonly effectConceptId: string;
  /** Razón. */
  readonly reasonCode: string;
  /** Doctor del objetivo, si lo hay. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio del objetivo, si lo hay. */
  readonly healthcareServiceId?: string;
  /** Espacio del objetivo, si lo hay. */
  readonly careSpaceId?: string;
  /** Solo asientos desde este instante. */
  readonly since: Date;
}

/**
 * Acceso a datos de `delegated_access.access_decision_log`, la bitácora WORM de
 * decisiones: el repositorio solo ANEXA y LEE. La base lo impone
 * (`trg_forbid_mutation` + `REVOKE UPDATE`); aquí además no existe ninguna
 * operación que modifique o borre.
 */
@Injectable()
export class AccessDecisionLogRepository {
  /**
   * Anexa un asiento (aún sin flush: participa de la transacción del llamador).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del asiento.
   * @returns El asiento creado.
   */
  append(em: EntityManager, data: AppendAccessDecisionData): AccessDecisionLog {
    return em.create(
      AccessDecisionLog,
      {
        tenantId: data.tenantId,
        userId: data.userId,
        permissionCode: data.permissionCode,
        effectConceptId: data.effectConceptId,
        reasonCode: data.reasonCode,
        grantId: data.grantId,
        ruleId: data.ruleId,
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        healthcareServiceId: data.healthcareServiceId,
        careSpaceId: data.careSpaceId,
        patientProfileId: data.patientProfileId,
        approvalId: data.approvalId,
        correlationId: data.correlationId,
        sessionId: data.sessionId,
        ip: data.ip,
        detailJson: data.detail,
        recordedAt: data.recordedAt,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Anexa un asiento AL INSTANTE con un INSERT nativo: no toca la unidad de
   * trabajo del llamador (no hace flush de lo que él tenga pendiente) y falla
   * aquí mismo si la base no lo acepta. Es lo que usa la política para dejar la
   * evidencia obligatoria de una decisión dentro de la transacción en curso.
   *
   * @param em - Transacción activa (o contexto con transacción propia).
   * @param data - Datos del asiento.
   * @returns El id del asiento escrito.
   */
  async appendNow(
    em: EntityManager,
    data: AppendAccessDecisionData,
  ): Promise<string> {
    const id = randomUUID();
    await em.insert(AccessDecisionLog, {
      id,
      tenantId: data.tenantId,
      userId: data.userId,
      permissionCode: data.permissionCode,
      effectConceptId: data.effectConceptId,
      reasonCode: data.reasonCode,
      grantId: data.grantId,
      ruleId: data.ruleId,
      practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
      healthcareServiceId: data.healthcareServiceId,
      careSpaceId: data.careSpaceId,
      patientProfileId: data.patientProfileId,
      approvalId: data.approvalId,
      correlationId: data.correlationId,
      sessionId: data.sessionId,
      ip: data.ip,
      detailJson: data.detail,
      recordedAt: data.recordedAt,
      recordedByUserId: data.recordedByUserId,
    });
    return id;
  }

  /**
   * Página de asientos de una organización, los más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param filter - Filtros opcionales.
   * @param page - Tope y desplazamiento.
   * @returns Los asientos.
   */
  findPage(
    em: EntityManager,
    tenantId: string,
    filter: AccessDecisionLogFilter,
    page: AccessDecisionLogPage,
  ): Promise<AccessDecisionLog[]> {
    return em.find(
      AccessDecisionLog,
      {
        tenantId,
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.effectConceptId
          ? { effectConceptId: filter.effectConceptId }
          : {}),
        ...(filter.permissionCode
          ? { permissionCode: filter.permissionCode }
          : {}),
        ...(filter.from || filter.to
          ? {
              recordedAt: {
                ...(filter.from ? { $gte: filter.from } : {}),
                ...(filter.to ? { $lt: filter.to } : {}),
              },
            }
          : {}),
      },
      {
        orderBy: { recordedAt: 'desc', id: 'desc' },
        limit: page.limit,
        offset: page.offset ?? 0,
      },
    );
  }

  /**
   * Último asiento equivalente desde un instante (misma persona, átomo, efecto,
   * razón y objetivo). La deduplicación de 60 s la decide el grabador con esta
   * lectura: el asiento anterior NO se modifica (es WORM); el grabador cuenta
   * las repeticiones en proceso y las anota en el asiento siguiente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param query - Llave del asiento equivalente.
   * @returns El asiento más reciente o `null`.
   */
  findRecentEquivalent(
    em: EntityManager,
    query: EquivalentDecisionQuery,
  ): Promise<AccessDecisionLog | null> {
    return em.findOne(
      AccessDecisionLog,
      {
        tenantId: query.tenantId,
        userId: query.userId,
        permissionCode: query.permissionCode,
        effectConceptId: query.effectConceptId,
        reasonCode: query.reasonCode,
        ...(query.practitionerRoleAssignmentId
          ? { practitionerRoleAssignmentId: query.practitionerRoleAssignmentId }
          : {}),
        ...(query.healthcareServiceId
          ? { healthcareServiceId: query.healthcareServiceId }
          : {}),
        ...(query.careSpaceId ? { careSpaceId: query.careSpaceId } : {}),
        recordedAt: { $gte: query.since },
      },
      { orderBy: { recordedAt: 'desc' } },
    );
  }

  /**
   * Asientos de una concesión, los más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param grantId - Concesión.
   * @param limit - Tope de filas.
   * @returns Los asientos.
   */
  findByGrant(
    em: EntityManager,
    tenantId: string,
    grantId: string,
    limit: number,
  ): Promise<AccessDecisionLog[]> {
    return em.find(
      AccessDecisionLog,
      { tenantId, grantId },
      { orderBy: { recordedAt: 'desc', id: 'desc' }, limit },
    );
  }
}
