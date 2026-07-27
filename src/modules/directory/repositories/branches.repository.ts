import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Branches } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una branch. */
export interface CreateBranchData {
  tenantId: string;
  code: string;
  name: string;
  branchTypeConceptId: string;
  statusConceptId: string;
  timeZone?: string;
  latitude?: string;
  longitude?: string;
  actorUserId?: string;
}

/** Acceso a datos de `directory.branches`. Stateless. */
@Injectable()
export class BranchesRepository {
  /** Busca una branch por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Branches | null> {
    return em.findOne(Branches, { id });
  }

  /** Busca una branch por (tenant, code) — clave única dentro del tenant. */
  findByTenantAndCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Branches | null> {
    return em.findOne(Branches, { tenantId, code });
  }

  /** Devuelve las branches del tenant en un estado dado (para cascada de suspensión). */
  findByTenantAndStatus(
    em: EntityManager,
    tenantId: string,
    statusConceptId: string,
  ): Promise<Branches[]> {
    return em.find(Branches, { tenantId, statusConceptId });
  }

  /** Crea la entidad branch en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateBranchData): Branches {
    return em.create(
      Branches,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        branchTypeConceptId: data.branchTypeConceptId,
        statusConceptId: data.statusConceptId,
        timeZone: data.timeZone,
        latitude: data.latitude,
        longitude: data.longitude,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
