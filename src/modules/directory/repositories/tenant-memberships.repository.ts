import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantMemberships } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una membresía de tenant. */
export interface CreateMembershipData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a tenant role concept.
   */
  tenantRoleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a access scope concept.
   */
  accessScopeConceptId: string;
  /**
   * Identificador asociado a primary branch.
   */
  primaryBranchId?: string;
  /**
   * Valor de start date mantenido por la instancia.
   */
  startDate: Date;
  /**
   * Identificador asociado a invited by user.
   */
  invitedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `directory.tenant_memberships`. Stateless. */
@Injectable()
export class TenantMembershipsRepository {
  /** Busca una membresía por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, { id });
  }

  /** Busca la membresía de un id restringida a un tenant (aislamiento). */
  findByIdInTenant(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, { id, tenantId });
  }

  /** Busca una membresía activa de un usuario en un tenant (evita duplicados). */
  findActiveByUserTenant(
    em: EntityManager,
    userId: string,
    tenantId: string,
    activeStatusConceptId: string,
  ): Promise<TenantMemberships | null> {
    return em.findOne(TenantMemberships, {
      userId,
      tenantId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Cuenta las membresías activas del tenant con un rol dado (protección del último OWNER). */
  countActiveByTenantRole(
    em: EntityManager,
    tenantId: string,
    tenantRoleConceptId: string,
    activeStatusConceptId: string,
  ): Promise<number> {
    return em.count(TenantMemberships, {
      tenantId,
      tenantRoleConceptId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Devuelve las membresías del tenant en un estado dado (cascada de suspensión). */
  findByTenantAndStatus(
    em: EntityManager,
    tenantId: string,
    statusConceptId: string,
  ): Promise<TenantMemberships[]> {
    return em.find(TenantMemberships, { tenantId, statusConceptId });
  }

  /** Crea la entidad membresía en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateMembershipData): TenantMemberships {
    return em.create(
      TenantMemberships,
      {
        userId: data.userId,
        tenantId: data.tenantId,
        tenantRoleConceptId: data.tenantRoleConceptId,
        statusConceptId: data.statusConceptId,
        accessScopeConceptId: data.accessScopeConceptId,
        primaryBranchId: data.primaryBranchId,
        startDate: data.startDate,
        invitedByUserId: data.invitedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
  /**
   * Una página de las membresías de la organización, por cursor keyset sobre
   * `(created_at, id)`.
   *
   * El desempate por `id` no es decorativo: varias membresías se crean en la
   * misma transacción -y por tanto con el mismo `created_at`-, y sin él dos
   * páginas consecutivas repetirían u omitirían filas.
   *
   * @param em - Contexto de persistencia.
   * @param tenantId - Organización cuyas membresías se listan.
   * @param filters - Estado y cursor.
   * @param limit - Tope de filas a devolver.
   * @returns Membresías ordenadas por antigüedad.
   */
  findPageByTenant(
    em: EntityManager,
    tenantId: string,
    filters: {
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Última fila de la página anterior. */
      after?: {
        /** Fecha de alta de la última fila. */
        createdAt: Date;
        /** Identificador de la última fila. */
        id: string;
      };
    },
    limit: number,
  ): Promise<TenantMemberships[]> {
    const where: Record<string, unknown> = { tenantId };

    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }
    if (filters.after) {
      where.$or = [
        { createdAt: { $gt: filters.after.createdAt } },
        { createdAt: filters.after.createdAt, id: { $gt: filters.after.id } },
      ];
    }

    return em.find(TenantMemberships, where, {
      orderBy: [{ createdAt: 'ASC' }, { id: 'ASC' }],
      limit,
    });
  }
}
