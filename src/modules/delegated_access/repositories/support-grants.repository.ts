import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import { AuditLog } from '../../audit/entities';
import { SupportGrantActions, SupportScopeGrants } from '../entities';

/** Datos para crear un permiso de apoyo. */
export interface CreateSupportGrantData {
  /** Organización del vínculo (la del contexto verificado, no la del cuerpo). */
  readonly tenantId: string;
  /** Vínculo al que pertenece. */
  readonly organizationUserAssignmentId: string;
  /** Concepto del tipo de objetivo. */
  readonly targetKindConceptId: string;
  /** Doctor del objetivo. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacio del objetivo. */
  readonly careSpaceId?: string;
  /** Sede del objetivo. */
  readonly practiceSiteId?: string;
  /** Concepto del modo de expansión. */
  readonly expansionModeConceptId: string;
  /** Foto congelada (solo `FIXED`). */
  readonly fixedSnapshot?: unknown;
  /** Inicio de vigencia. */
  readonly validFrom?: Date;
  /** Fin de vigencia. */
  readonly validTo?: Date;
  /** Concepto de estado. */
  readonly statusConceptId: string;
  /** Quien lo aprueba. */
  readonly approvedByUserId?: string;
  /** Quien lo crea. */
  readonly actorUserId?: string;
  /** Concepto del efecto (`authz:EFFECT_ALLOW|DENY`); ausente = el DEFAULT de la base (ALLOW). */
  readonly effectConceptId?: string;
  /** Condición ABAC de toda la concesión (esquema versionado). */
  readonly condition?: unknown;
  /** Versión del esquema de la condición (obligatoria si hay condición). */
  readonly conditionSchemaVersion?: number;
  /** Por qué se otorgó. */
  readonly reasonText?: string;
  /** Plantilla (y versión) de origen. */
  readonly sourceRoleTemplateId?: string;
}

/** Una acción de una concesión con su condición propia. */
export interface SupportGrantActionInput {
  /** Permiso de `authz.permissions` (átomo o alias). */
  readonly permissionId: string;
  /** Condición ABAC propia de la acción. */
  readonly condition?: unknown;
  /** Versión del esquema de la condición. */
  readonly conditionSchemaVersion?: number;
}

/** Acceso a datos de `support_scope_grants` y `support_grant_actions`. */
@Injectable()
export class SupportGrantsRepository {
  /**
   * Permiso por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id del permiso.
   * @returns El permiso o `null`.
   */
  findById(em: EntityManager, id: string): Promise<SupportScopeGrants | null> {
    return em.findOne(SupportScopeGrants, { id });
  }

  /**
   * Permisos de un vínculo, en orden estable.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagementId - Vínculo.
   * @returns Sus permisos.
   */
  findByEngagement(
    em: EntityManager,
    engagementId: string,
  ): Promise<SupportScopeGrants[]> {
    return em.find(
      SupportScopeGrants,
      { organizationUserAssignmentId: engagementId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Permisos en un estado dado, de varios vínculos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagementIds - Vínculos.
   * @param statusConceptId - Estado buscado.
   * @returns Los permisos.
   */
  findByEngagementsAndStatus(
    em: EntityManager,
    engagementIds: readonly string[],
    statusConceptId: string,
  ): Promise<SupportScopeGrants[]> {
    if (engagementIds.length === 0) return Promise.resolve([]);
    return em.find(SupportScopeGrants, {
      organizationUserAssignmentId: { $in: [...engagementIds] },
      statusConceptId,
    });
  }

  /**
   * Crea un permiso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del permiso.
   * @returns El permiso creado (aún sin flush).
   */
  create(em: EntityManager, data: CreateSupportGrantData): SupportScopeGrants {
    return em.create(
      SupportScopeGrants,
      {
        tenantId: data.tenantId,
        organizationUserAssignmentId: data.organizationUserAssignmentId,
        targetKindConceptId: data.targetKindConceptId,
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        healthcareServiceId: data.healthcareServiceId,
        careSpaceId: data.careSpaceId,
        practiceSiteId: data.practiceSiteId,
        expansionModeConceptId: data.expansionModeConceptId,
        fixedSnapshotJson: data.fixedSnapshot,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        approvedByUserId: data.approvedByUserId,
        // Sin efecto ni condición la fila nace como siempre: el efecto lo pone
        // el DEFAULT de la base (ALLOW) y la condición queda nula.
        ...(data.effectConceptId
          ? { effectConceptId: data.effectConceptId }
          : {}),
        conditionJson: data.condition,
        conditionSchemaVersion: data.conditionSchemaVersion,
        reasonText: data.reasonText,
        sourceRoleTemplateId: data.sourceRoleTemplateId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Acciones (permisos de `authz`) de un permiso de apoyo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grantId - Permiso de apoyo.
   * @returns Sus filas de acción.
   */
  findActions(
    em: EntityManager,
    grantId: string,
  ): Promise<SupportGrantActions[]> {
    return em.find(SupportGrantActions, { supportScopeGrantId: grantId });
  }

  /**
   * Acciones VIGENTES de un permiso: las que no reemplazaron átomos
   * (`superseded_at IS NULL`). Es lo que evalúa la política.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grantId - Permiso de apoyo.
   * @returns Sus filas de acción no reemplazadas.
   */
  findLiveActions(
    em: EntityManager,
    grantId: string,
  ): Promise<SupportGrantActions[]> {
    return em.find(SupportGrantActions, {
      supportScopeGrantId: grantId,
      supersededAt: null,
    });
  }

  /**
   * Agrega acciones a un permiso. Acepta ids sueltos (como siempre) o acciones
   * con su condición propia.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grant - Permiso de apoyo (id y organización).
   * @param actions - Ids de `authz.permissions` o acciones con condición.
   */
  addActions(
    em: EntityManager,
    grant: Pick<SupportScopeGrants, 'id' | 'tenantId'>,
    actions: readonly (string | SupportGrantActionInput)[],
  ): void {
    const now = new Date();
    for (const action of actions) {
      const input =
        typeof action === 'string' ? { permissionId: action } : action;
      em.create(
        SupportGrantActions,
        {
          tenantId: grant.tenantId,
          supportScopeGrantId: grant.id,
          permissionId: input.permissionId,
          ...('condition' in input && input.condition !== undefined
            ? {
                conditionJson: input.condition,
                conditionSchemaVersion: input.conditionSchemaVersion,
              }
            : {}),
          createdAt: now,
        },
        { partial: true },
      );
    }
  }

  /**
   * Marca filas de acción como reemplazadas por átomos (normalize-legacy). Las
   * filas NO se borran: se ignoran al evaluar y la operación se puede revertir.
   *
   * @param rows - Filas de alias reemplazadas.
   * @param now - Instante de la marca.
   * @param actorUserId - Quien normaliza.
   */
  markSuperseded(
    rows: readonly SupportGrantActions[],
    now: Date,
    actorUserId: string | undefined,
  ): void {
    for (const row of rows) {
      row.supersededAt = now;
      row.updatedAt = now;
      row.updatedByUserId = actorUserId;
    }
  }

  /**
   * ¿Ya se revirtió ese lote de normalización? El revert deja un asiento
   * `SUPPORT_GRANT_NORMALIZE_REVERTED` con el id del lote en la cadena de
   * auditoría de la organización; sin él, el lote no existe o aún está aplicado.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param batchId - Id del lote.
   * @returns `true` si hay constancia de su reversión.
   */
  async wasBatchReverted(
    em: EntityManager,
    tenantId: string,
    batchId: string,
  ): Promise<boolean> {
    return (
      (await em.count(AuditLog, {
        tenantId,
        action: 'SUPPORT_GRANT_NORMALIZE_REVERTED',
        entityId: batchId,
      })) > 0
    );
  }

  /**
   * Limpia la marca de reemplazo (revert de normalize-legacy).
   *
   * @param rows - Filas cuyo reemplazo se deshace.
   * @param now - Instante.
   * @param actorUserId - Quien revierte.
   */
  clearSuperseded(
    rows: readonly SupportGrantActions[],
    now: Date,
    actorUserId: string | undefined,
  ): void {
    for (const row of rows) {
      row.supersededAt = null;
      row.updatedAt = now;
      row.updatedByUserId = actorUserId;
    }
  }

  /**
   * Quita acciones de un permiso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rows - Filas de acción a retirar.
   */
  removeActions(em: EntityManager, rows: readonly SupportGrantActions[]): void {
    for (const row of rows) em.remove(row);
  }

  /**
   * Agrega filas de acción con una fecha de alta EXACTA: la normalización de
   * permisos heredados las crea todas en el mismo instante, que es lo que
   * identifica el lote al revertirlo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param grant - Permiso que las recibe.
   * @param permissionIds - Ids de `authz.permissions` de los átomos.
   * @param at - Instante de alta (el del lote).
   */
  addActionsAt(
    em: EntityManager,
    grant: Pick<SupportScopeGrants, 'id' | 'tenantId'>,
    permissionIds: readonly string[],
    at: Date,
  ): void {
    for (const permissionId of permissionIds) {
      em.create(
        SupportGrantActions,
        {
          tenantId: grant.tenantId,
          supportScopeGrantId: grant.id,
          permissionId,
          createdAt: at,
        },
        { partial: true },
      );
    }
  }

  /**
   * Filas de acción reemplazadas (`superseded_at`) en un instante exacto de una
   * organización: las alias que un lote de normalización dejó atrás.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param at - Instante del lote.
   * @returns Las filas reemplazadas en ese instante.
   */
  findSupersededAt(
    em: EntityManager,
    tenantId: string,
    at: Date,
  ): Promise<SupportGrantActions[]> {
    return em.find(SupportGrantActions, { tenantId, supersededAt: at });
  }

  /**
   * Filas de acción de unos permisos dadas de alta en un instante exacto: los
   * átomos que un lote de normalización insertó.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param grantIds - Permisos del lote.
   * @param at - Instante del lote.
   * @returns Las filas creadas en ese instante.
   */
  findCreatedAt(
    em: EntityManager,
    tenantId: string,
    grantIds: readonly string[],
    at: Date,
  ): Promise<SupportGrantActions[]> {
    if (grantIds.length === 0) return Promise.resolve([]);
    return em.find(SupportGrantActions, {
      tenantId,
      supportScopeGrantId: { $in: [...grantIds] },
      createdAt: at,
    });
  }
}
