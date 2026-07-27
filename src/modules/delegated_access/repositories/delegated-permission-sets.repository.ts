import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedPermissionSets } from '../entities';
import { createdBy } from '../../../common';

/** Datos para publicar la versión 1 de un set de permisos delegados. */
export interface CreatePermissionSetData {
  tenantId: string;
  code: string;
  name: string;
  delegateTypeConceptId: string;
  description?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.delegated_permission_sets`. */
@Injectable()
export class DelegatedPermissionSetsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DelegatedPermissionSets | null> {
    return em.findOne(DelegatedPermissionSets, { id });
  }

  /** Set por (tenant, code): la unicidad es por tenant. */
  findByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<DelegatedPermissionSets | null> {
    return em.findOne(DelegatedPermissionSets, { tenantId, code });
  }

  create(
    em: EntityManager,
    data: CreatePermissionSetData,
  ): DelegatedPermissionSets {
    return em.create(
      DelegatedPermissionSets,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        delegateTypeConceptId: data.delegateTypeConceptId,
        description: data.description,
        statusConceptId: data.statusConceptId,
        versionNumber: 1,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
