import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { EffectiveSupportAccess } from '../entities';

/** Fila derivada que se escribe en `effective_support_access`. */
export interface EffectiveAccessRow {
  /** Persona de apoyo. */
  readonly userId: string;
  /** Organización. */
  readonly tenantId: string;
  /** Doctor (asignación de rol); ausente = cualquier profesional. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio, si el permiso lo acota. */
  readonly healthcareServiceId?: string;
  /** Espacio, si el permiso lo acota. */
  readonly careSpaceId?: string;
  /** Código de la acción. */
  readonly permissionCode: string;
  /** Permiso que la origina. */
  readonly grantId: string;
}

/** Filtro de la consulta de acceso efectivo. */
export interface EffectiveAccessFilter {
  /** Organización (obligatoria). */
  readonly tenantId: string;
  /** Solo esta persona de apoyo. */
  readonly userId?: string;
  /** Solo este doctor. */
  readonly practitionerRoleAssignmentId?: string;
  /** Solo este servicio. */
  readonly healthcareServiceId?: string;
  /** Solo estos espacios (los contenidos en una ubicación consultada). */
  readonly careSpaceIds?: readonly string[];
}

/** Acceso a datos de la tabla derivada `delegated_access.effective_support_access`. */
@Injectable()
export class EffectiveSupportAccessRepository {
  /**
   * Reemplaza las filas derivadas de una organización (o de una persona en ella).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userIds - Personas cuyas filas se recalculan; vacío = toda la organización.
   * @param rows - Filas nuevas.
   * @param refreshedAt - Instante del cálculo.
   */
  async replace(
    em: EntityManager,
    tenantId: string,
    userIds: readonly string[],
    rows: readonly EffectiveAccessRow[],
    refreshedAt: Date,
  ): Promise<void> {
    await em.nativeDelete(EffectiveSupportAccess, {
      tenantId,
      ...(userIds.length > 0 ? { userId: { $in: [...userIds] } } : {}),
    });
    for (const row of rows) {
      em.create(
        EffectiveSupportAccess,
        { ...row, refreshedAt },
        { partial: true },
      );
    }
  }

  /**
   * Quién tiene acceso a qué, según el filtro.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Organización y, opcionalmente, doctor, servicio, espacio o persona.
   * @param limit - Tope de filas.
   * @returns Las filas derivadas que coinciden.
   */
  find(
    em: EntityManager,
    filter: EffectiveAccessFilter,
    limit: number,
  ): Promise<EffectiveSupportAccess[]> {
    return em.find(
      EffectiveSupportAccess,
      {
        tenantId: filter.tenantId,
        ...(filter.userId ? { userId: filter.userId } : {}),
        // NULL en la fila = el permiso no acota esa dimensión, así que la cubre.
        ...(filter.practitionerRoleAssignmentId
          ? {
              practitionerRoleAssignmentId: {
                $in: [filter.practitionerRoleAssignmentId, null],
              },
            }
          : {}),
        ...(filter.healthcareServiceId
          ? { healthcareServiceId: { $in: [filter.healthcareServiceId, null] } }
          : {}),
        ...(filter.careSpaceIds
          ? { careSpaceId: { $in: [...filter.careSpaceIds, null] } }
          : {}),
      },
      { orderBy: { userId: 'asc', id: 'asc' }, limit },
    );
  }
}
