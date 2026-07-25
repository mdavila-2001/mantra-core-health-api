import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { BranchMemberships } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una asignación a branch. */
export interface CreateBranchMembershipData {
  tenantMembershipId: string;
  branchId: string;
  localRoleConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `directory.branch_memberships`. Stateless. */
@Injectable()
export class BranchMembershipsRepository {
  /** Devuelve las asignaciones de una membresía en un estado dado. */
  findByMembershipAndStatus(
    em: EntityManager,
    tenantMembershipId: string,
    statusConceptId: string,
  ): Promise<BranchMemberships[]> {
    return em.find(BranchMemberships, { tenantMembershipId, statusConceptId });
  }

  /** Busca una asignación activa concreta (membership + branch). */
  findByMembershipBranchStatus(
    em: EntityManager,
    tenantMembershipId: string,
    branchId: string,
    statusConceptId: string,
  ): Promise<BranchMemberships | null> {
    return em.findOne(BranchMemberships, { tenantMembershipId, branchId, statusConceptId });
  }

  /** Crea la entidad de asignación en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateBranchMembershipData): BranchMemberships {
    return em.create(
      BranchMemberships,
      {
        tenantMembershipId: data.tenantMembershipId,
        branchId: data.branchId,
        localRoleConceptId: data.localRoleConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
