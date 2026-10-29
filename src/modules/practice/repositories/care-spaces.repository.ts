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
  /** Tenant del espacio: el de su sede (FK compuesta `(tenant_id, practice_site_id)` en la base). */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /** Función del espacio (`space_type_concept_id`). */
  spaceTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a operational status concept.
   */
  operationalStatusConceptId: string;
  /** Forma del espacio (`LOC_FORM_*`). */
  formConceptId?: string;
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
  /** Descripción libre. */
  description?: string;
  /** Número de piso. */
  floorNumber?: number;
  /** Superficie útil en m². */
  areaM2?: string;
  /** Asepsia. */
  asepsisConceptId?: string;
  /** Presión. */
  pressureConceptId?: string;
  /** Renovaciones de aire por hora. */
  airChangesPerHour?: string;
  /** Fecha de la última validación HVAC. */
  hvacValidatedOn?: Date;
  /** Restricción de sexo. */
  sexRestrictionConceptId?: string;
  /** Grupo etario. */
  ageGroupConceptId?: string;
  /** Categoría de cama. */
  bedCategoryConceptId?: string;
  /** Si la cama es censable. */
  censable?: boolean;
  /** Preparación previa (minutos). */
  prepMinutes?: number;
  /** Limpieza posterior (minutos). */
  cleanupMinutes?: number;
  /** GLN de 13 dígitos. */
  gln?: string;
  /** Inicio de vigencia. */
  validFrom?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
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
   * Espacio del tenant indicado, o `null`. El filtro por tenant es explícito
   * además del RLS: un id ajeno responde igual que uno inexistente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id del espacio.
   * @param tenantId - Tenant del contexto.
   * @returns El espacio o `null`.
   */
  findByIdInTenant(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<CareSpaces | null> {
    return em.findOne(CareSpaces, { id, tenantId });
  }

  /**
   * Varios espacios por id (el filtro por tenant lo da el RLS y la carga previa del recurso).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids a cargar.
   * @returns Los espacios encontrados.
   */
  findByIds(em: EntityManager, ids: readonly string[]): Promise<CareSpaces[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CareSpaces, { id: { $in: [...ids] } });
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
   * Espacio de la sede con ese código (cualquier estado: el código no se reutiliza).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede.
   * @param code - Código a buscar.
   * @returns El espacio o `null`.
   */
  findBySiteAndCode(
    em: EntityManager,
    practiceSiteId: string,
    code: string,
  ): Promise<CareSpaces | null> {
    return em.findOne(CareSpaces, { practiceSiteId, code });
  }

  /**
   * Códigos ya usados en la sede entre los indicados (incluye clausurados).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Sede.
   * @param codes - Códigos candidatos.
   * @returns El subconjunto que ya existe.
   */
  async takenCodes(
    em: EntityManager,
    practiceSiteId: string,
    codes: readonly string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) return new Set();
    const rows = await em.find(
      CareSpaces,
      { practiceSiteId, code: { $in: [...codes] } },
      { fields: ['code'] },
    );
    return new Set(rows.map((row) => row.code));
  }

  /**
   * Hijos directos de un espacio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param parentSpaceId - Espacio padre.
   * @returns Los hijos, por código.
   */
  async findChildren(
    em: EntityManager,
    parentSpaceId: string,
  ): Promise<CareSpaces[]> {
    const rows = await em.find(CareSpaces, { parentSpaceId });
    return rows.sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Ids del subárbol de un espacio, **incluido él mismo**, por CTE recursiva.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param rootId - Raíz del subárbol.
   * @returns Los ids.
   */
  async subtreeIds(em: EntityManager, rootId: string): Promise<string[]> {
    const rows = await em.execute<{ id: string }[]>(
      `with recursive sub as (
         select id from practice.care_spaces where id = ?
         union
         select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
       ) select id from sub`,
      [rootId],
    );
    return rows.map((row) => row.id);
  }

  /**
   * Ids de los ancestros de un espacio (del padre inmediato a la raíz), **sin**
   * incluirlo. Sirve para armar la ruta y para detectar ciclos en `move`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Espacio de partida.
   * @returns Los ids, del más cercano al más lejano.
   */
  async ancestorIds(em: EntityManager, id: string): Promise<string[]> {
    const rows = await em.execute<{ id: string; depth: number }[]>(
      `with recursive up(id, parent_space_id, depth) as (
         select s.id, s.parent_space_id, 0 from practice.care_spaces s where s.id = ?
         union
         select p.id, p.parent_space_id, up.depth + 1
           from practice.care_spaces p join up on p.id = up.parent_space_id
       ) select id, depth from up where depth > 0 order by depth`,
      [id],
    );
    return rows.map((row) => row.id);
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
        tenantId: data.tenantId,
        clinicalUnitId: data.clinicalUnitId,
        parentSpaceId: data.parentSpaceId,
        code: data.code,
        name: data.name,
        spaceTypeConceptId: data.spaceTypeConceptId,
        formConceptId: data.formConceptId,
        capacity: data.capacity,
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
        prepMinutes: data.prepMinutes,
        cleanupMinutes: data.cleanupMinutes,
        gln: data.gln,
        validFrom: data.validFrom,
        operationalStatusConceptId: data.operationalStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
