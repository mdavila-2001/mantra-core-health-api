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
}
