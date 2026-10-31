import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DELEG } from '../delegated_access.concepts';
import { RoleTemplates } from '../entities';

/** Datos para crear una plantilla de rol de apoyo. */
export interface CreateRoleTemplateData {
  /** Id fijo (plantillas de plataforma con id determinista). */
  readonly id?: string;
  /** Organización dueña; ausente en una plantilla de plataforma. */
  readonly tenantId?: string;
  /** Código de la plantilla. */
  readonly code: string;
  /** Nombre visible. */
  readonly name: string;
  /** Acciones por defecto. */
  readonly defaultActions: readonly string[];
  /** Concepto de estado. */
  readonly statusConceptId: string;
  /** Número de versión. */
  readonly versionNumber: number;
  /** Mapa `átomo → condición v1` por omisión (plantillas v2). */
  readonly defaultConditions?: Readonly<Record<string, unknown>>;
  /** Techo: átomos o `prefijo.*`; ausente = sin techo propio. */
  readonly ceilingActions?: readonly string[];
}

/** Acceso a datos de `delegated_access.role_templates`. */
@Injectable()
export class RoleTemplatesRepository {
  /**
   * Plantilla por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la plantilla.
   * @returns La plantilla o `null`.
   */
  findById(em: EntityManager, id: string): Promise<RoleTemplates | null> {
    return em.findOne(RoleTemplates, { id });
  }

  /**
   * Plantilla por código: la de la organización tiene prioridad sobre la de plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param code - Código de la plantilla.
   * @returns La plantilla efectiva o `null`.
   */
  async findEffectiveByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<RoleTemplates | null> {
    // La versión vigente: la más alta entre las activas (las anteriores quedan
    // retiradas, pero siguen siendo la plantilla de los vínculos que abrieron).
    const latest = { orderBy: { versionNumber: 'desc' as const } };
    const active = DELEG.ROLE_TEMPLATE_ACTIVE;
    const own = await em.findOne(
      RoleTemplates,
      { tenantId, code, statusConceptId: active },
      latest,
    );
    if (own) return own;
    return em.findOne(
      RoleTemplates,
      { tenantId: null, code, statusConceptId: active },
      latest,
    );
  }

  /**
   * Plantillas visibles para una organización (las suyas y las de plataforma).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Las plantillas ordenadas por código.
   */
  findVisible(em: EntityManager, tenantId: string): Promise<RoleTemplates[]> {
    return em.find(
      RoleTemplates,
      { $or: [{ tenantId }, { tenantId: null }] },
      { orderBy: { code: 'asc', id: 'asc' } },
    );
  }

  /**
   * Crea una plantilla.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la plantilla.
   * @returns La plantilla creada (aún sin flush).
   */
  create(em: EntityManager, data: CreateRoleTemplateData): RoleTemplates {
    const now = new Date();
    return em.create(
      RoleTemplates,
      {
        ...(data.id ? { id: data.id } : {}),
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        defaultActionsJson: [...data.defaultActions],
        statusConceptId: data.statusConceptId,
        versionNumber: data.versionNumber,
        defaultConditionsJson: data.defaultConditions,
        ceilingActionsJson: data.ceilingActions
          ? [...data.ceilingActions]
          : undefined,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }
}
