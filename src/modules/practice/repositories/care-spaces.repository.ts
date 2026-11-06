import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareSpaces } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un espacio de atención bajo un sitio. */
export interface CreateCareSpaceData {
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a space type concept.
   */
  spaceTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a operational status concept. Nulo mientras el
   * espacio está PLANNED (F1).
   */
  operationalStatusConceptId?: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a parent space.
   */
  parentSpaceId?: string;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
  /**
   * Tenant de la sede (F1): con RLS, una fila sin tenant es invisible para
   * `mantra_app`, así que todo alta lo escribe.
   */
  tenantId: string;
  /** Forma FHIR `Location.form` (`LOC_FORM_*`). */
  formConceptId?: string;
  /** Atributos descriptivos y técnicos (F1, contrato §1.1). */
  description?: string;
  floorNumber?: number;
  areaM2?: string;
  asepsisConceptId?: string;
  pressureConceptId?: string;
  airChangesPerHour?: string;
  hvacValidatedOn?: Date;
  sexRestrictionConceptId?: string;
  ageGroupConceptId?: string;
  bedCategoryConceptId?: string;
  censable?: boolean;
  gln?: string;
  prepMinutes?: number;
  cleanupMinutes?: number;
  validFrom?: Date;
}

/** Acceso a datos de `practice.care_spaces` (stateless). */
@Injectable()
export class CareSpacesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareSpaces | null>`.
   */
  findById(em: EntityManager, id: string): Promise<CareSpaces | null> {
    return em.findOne(CareSpaces, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<CareSpaces[]>`.
   */
  findBySite(em: EntityManager, practiceSiteId: string): Promise<CareSpaces[]> {
    return em.find(CareSpaces, { practiceSiteId });
  }

  /**
   * Espacios por id, acotados a una sede.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids buscados.
   * @returns Los que existen.
   */
  findByIds(em: EntityManager, ids: readonly string[]): Promise<CareSpaces[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CareSpaces, { id: { $in: [...ids] } });
  }

  /**
   * Hijos directos de un espacio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param parentSpaceId - Padre.
   * @returns Sus hijos, en cualquier estado.
   */
  findChildren(
    em: EntityManager,
    parentSpaceId: string,
  ): Promise<CareSpaces[]> {
    return em.find(CareSpaces, { parentSpaceId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareSpaces`.
   */
  create(em: EntityManager, data: CreateCareSpaceData): CareSpaces {
    return em.create(
      CareSpaces,
      {
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        parentSpaceId: data.parentSpaceId,
        code: data.code,
        name: data.name,
        spaceTypeConceptId: data.spaceTypeConceptId,
        capacity: data.capacity,
        operationalStatusConceptId: data.operationalStatusConceptId,
        statusConceptId: data.statusConceptId,
        tenantId: data.tenantId,
        // F2: `ops_version` es NOT NULL con DEFAULT 1 en la base (lo pone el
        // patch, `gen_entities` no emite ese default). Sin valor, MikroORM
        // rechaza el insert («Value for CareSpaces.opsVersion is required»).
        opsVersion: 1,
        formConceptId: data.formConceptId,
        description: data.description,
        floorNumber: data.floorNumber,
        areaM2: data.areaM2,
        asepsisConceptId: data.asepsisConceptId,
        pressureConceptId: data.pressureConceptId,
        airChangesPerHour: data.airChangesPerHour,
        hvacValidatedOn: data.hvacValidatedOn,
        sexRestrictionConceptId: data.sexRestrictionConceptId,
        ageGroupConceptId: data.ageGroupConceptId,
        bedCategoryConceptId: data.bedCategoryConceptId,
        censable: data.censable,
        gln: data.gln,
        prepMinutes: data.prepMinutes,
        cleanupMinutes: data.cleanupMinutes,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
