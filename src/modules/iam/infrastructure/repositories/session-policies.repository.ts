import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../../common';
import { SessionPolicies } from '../../entities';

/** Datos de una política de sesión. */
export interface SessionPolicyData {
  /** Concepto de alcance. */
  readonly scopeConceptId: string;
  /** Rol, si el alcance es `ROLE`. */
  readonly roleCode?: string;
  /** Minutos de inactividad. */
  readonly idleTimeoutMinutes: number;
  /** Avisar de dispositivo nuevo. */
  readonly newDeviceAlert: boolean;
  /** Horario permitido. */
  readonly allowedHours?: unknown;
  /** Hacer cumplir reglas de IP. */
  readonly enforceIpRules: boolean;
  /** Exigir segundo factor. */
  readonly requireMfa: boolean;
}

/** Acceso a datos de `iam.session_policies`. */
@Injectable()
export class SessionPoliciesRepository {
  /**
   * Políticas de la organización en un estado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param statusConceptId - Estado buscado (activo).
   * @returns Sus políticas, en orden estable.
   */
  findByTenant(
    em: EntityManager,
    tenantId: string,
    statusConceptId: string,
  ): Promise<SessionPolicies[]> {
    return em.find(
      SessionPolicies,
      { tenantId, statusConceptId },
      { orderBy: { scopeConceptId: 'asc', roleCode: 'asc', id: 'asc' } },
    );
  }

  /**
   * Políticas de varias organizaciones en un estado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantIds - Organizaciones.
   * @param statusConceptId - Estado buscado (activo).
   * @returns Sus políticas.
   */
  findByTenants(
    em: EntityManager,
    tenantIds: readonly string[],
    statusConceptId: string,
  ): Promise<SessionPolicies[]> {
    if (tenantIds.length === 0) return Promise.resolve([]);
    return em.find(SessionPolicies, {
      tenantId: { $in: [...tenantIds] },
      statusConceptId,
    });
  }

  /**
   * Crea una política.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param data - Datos de la política.
   * @param statusConceptId - Estado inicial (activo).
   * @param actorUserId - Quien la crea.
   * @returns La política creada (aún sin flush).
   */
  create(
    em: EntityManager,
    tenantId: string,
    data: SessionPolicyData,
    statusConceptId: string,
    actorUserId?: string,
  ): SessionPolicies {
    return em.create(
      SessionPolicies,
      {
        tenantId,
        scopeConceptId: data.scopeConceptId,
        roleCode: data.roleCode,
        idleTimeoutMinutes: data.idleTimeoutMinutes,
        newDeviceAlert: data.newDeviceAlert,
        allowedHoursJson: data.allowedHours,
        enforceIpRules: data.enforceIpRules,
        requireMfa: data.requireMfa,
        statusConceptId,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }
}
