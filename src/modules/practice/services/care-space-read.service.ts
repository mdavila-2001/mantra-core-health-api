import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import type { CareSpaces } from '../entities';
import { FORMS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import {
  CareSpacesRepository,
  ClinicalUnitsRepository,
  SpaceUnitAssignmentsRepository,
} from '../repositories';
import type {
  CareSpaceDerived,
  CareSpaceDetail,
  CareSpacePathItem,
  SiteStructure,
} from '../dto/infrastructure.types';
import {
  countChildren,
  iso,
  isoDate,
  num,
  ref,
  toAssignmentView,
  toSiteSummary,
  toSpaceNode,
  toUnitNode,
} from './structure-mapper';
import { ATTRIBUTES } from '../infrastructure-catalog';
import { StructureContextService } from './structure-context.service';

/** Opciones de armado del detalle. */
export interface DetailOptions {
  /**
   * Los espacios acaban de crearse: no tienen hijos ni camas, así que se omiten
   * esas consultas (el alta masiva arma 200 detalles).
   */
  readonly fresh?: boolean;
}

/**
 * Lecturas de la estructura física: el árbol plano de un establecimiento y la
 * ficha de un espacio (`GET /sites/:siteId/structure`, `GET /care-spaces/:id`).
 *
 * Lectura = miembro del tenant dentro de su alcance de sucursal (CONTRATO-F0-F1
 * §3); un establecimiento o espacio ajeno responde 404.
 */
@Injectable()
export class CareSpaceReadService {
  /**
   * @param em - Contexto de persistencia.
   * @param context - Carga y autoriza.
   * @param spacesRepo - Espacios.
   * @param unitsRepo - Unidades.
   * @param assignmentsRepo - Vínculos espacio ↔ unidad.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly context: StructureContextService,
    private readonly spacesRepo: CareSpacesRepository,
    private readonly unitsRepo: ClinicalUnitsRepository,
    private readonly assignmentsRepo: SpaceUnitAssignmentsRepository,
  ) {}

  /**
   * Árbol plano del establecimiento: espacios, unidades y vínculos vigentes.
   *
   * @param siteId - Establecimiento.
   * @param actor - Quien lee.
   * @returns La estructura con `asOf` para el estado S7.
   */
  async structure(
    siteId: string,
    actor: AuthenticatedUser,
  ): Promise<SiteStructure> {
    return this.em.transactional(async (tx) => {
      const { site } = await this.context.site(tx, siteId, actor, 'read');
      const [spaces, units] = await Promise.all([
        this.spacesRepo.findBySite(tx, site.id),
        this.unitsRepo.findBySite(tx, site.id),
      ]);
      const assignments = await this.assignmentsRepo.findOpenBySpaces(
        tx,
        spaces.map((s) => s.id),
      );
      const children = countChildren(spaces);
      return {
        site: toSiteSummary(site),
        spaces: spaces
          .sort((a, b) => a.code.localeCompare(b.code))
          .map((space) => toSpaceNode(space, children.get(space.id) ?? 0)),
        units: units
          .sort((a, b) => a.code.localeCompare(b.code))
          .map(toUnitNode),
        assignments: assignments.map(toAssignmentView),
        asOf: new Date().toISOString(),
      };
    });
  }

  /**
   * Ficha de un espacio.
   *
   * @param spaceId - Espacio.
   * @param actor - Quien lee.
   * @returns El detalle con ruta, hijos, vínculos y recuentos derivados.
   */
  async detail(
    spaceId: string,
    actor: AuthenticatedUser,
  ): Promise<CareSpaceDetail> {
    return this.em.transactional(async (tx) => {
      const { space } = await this.context.space(tx, spaceId, actor, 'read');
      return (await this.detailsOf(tx, [space]))[0];
    });
  }

  /**
   * Arma el detalle de varios espacios de la misma sede con el mínimo de
   * consultas: una por los vínculos de todos y, por cada padre distinto, una
   * por su ruta.
   *
   * @param tx - Transacción activa.
   * @param spaces - Espacios ya cargados.
   * @param options - `fresh` omite hijos y recuentos.
   * @returns Un detalle por espacio, en el mismo orden.
   */
  async detailsOf(
    tx: EntityManager,
    spaces: readonly CareSpaces[],
    options: DetailOptions = {},
  ): Promise<CareSpaceDetail[]> {
    const assignments = await this.assignmentsRepo.findOpenBySpaces(
      tx,
      spaces.map((s) => s.id),
    );
    const pathByParent = new Map<string, CareSpacePathItem[]>();
    const details: CareSpaceDetail[] = [];
    for (const space of spaces) {
      const parentId = space.parentSpaceId ?? '';
      if (parentId && !pathByParent.has(parentId)) {
        pathByParent.set(parentId, await this.pathOf(tx, parentId));
      }
      const children = options.fresh
        ? []
        : await this.spacesRepo.findChildren(tx, space.id);
      const grandchildCounts = countChildren(children);
      const derived: CareSpaceDerived = options.fresh
        ? { beds: 0, censableBeds: 0, activeChildren: 0 }
        : await this.derivedOf(tx, space.id, children);
      details.push({
        ...toSpaceNode(
          space,
          children.filter((c) => c.statusConceptId !== PRAC.SPACE_RETIRED)
            .length,
        ),
        practiceSiteId: space.practiceSiteId,
        description: space.description ?? null,
        floorNumber: space.floorNumber ?? null,
        areaM2: num(space.areaM2),
        asepsis: ref(ATTRIBUTES.asepsis.byConceptId(space.asepsisConceptId)),
        pressure: ref(ATTRIBUTES.pressure.byConceptId(space.pressureConceptId)),
        airChangesPerHour: num(space.airChangesPerHour),
        hvacValidatedOn: isoDate(space.hvacValidatedOn),
        sexRestriction: ref(
          ATTRIBUTES.sex.byConceptId(space.sexRestrictionConceptId),
        ),
        ageGroup: ref(ATTRIBUTES.ageGroup.byConceptId(space.ageGroupConceptId)),
        bedCategory: ref(
          ATTRIBUTES.bedCategory.byConceptId(space.bedCategoryConceptId),
        ),
        censable: space.censable ?? null,
        prepMinutes: space.prepMinutes ?? null,
        cleanupMinutes: space.cleanupMinutes ?? null,
        gln: space.gln ?? null,
        validFrom: iso(space.validFrom),
        validTo: iso(space.validTo),
        createdAt: space.createdAt.toISOString(),
        updatedAt: space.updatedAt.toISOString(),
        path: parentId ? (pathByParent.get(parentId) ?? []) : [],
        children: children.map((child) =>
          toSpaceNode(child, grandchildCounts.get(child.id) ?? 0),
        ),
        assignments: assignments
          .filter((a) => a.careSpaceId === space.id)
          .map(toAssignmentView),
        derived,
      });
    }
    return details;
  }

  /**
   * Ruta de ancestros de un espacio (raíz → padre inmediato), a partir del
   * padre: el primer elemento es la raíz.
   */
  private async pathOf(
    tx: EntityManager,
    parentId: string,
  ): Promise<CareSpacePathItem[]> {
    const ancestorIds = await this.spacesRepo.ancestorIds(tx, parentId);
    const ids = [parentId, ...ancestorIds];
    const rows = await this.spacesRepo.findByIds(tx, ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is CareSpaces => Boolean(row))
      .reverse()
      .map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        form: ref(FORMS.byConceptId(row.formConceptId)),
      }));
  }

  /**
   * Recuentos derivados del subárbol (INV-20): nunca se escriben a mano.
   * Camas = espacios de forma `BED` activos; censables = además `censable`.
   */
  private async derivedOf(
    tx: EntityManager,
    id: string,
    children: readonly CareSpaces[],
  ): Promise<CareSpaceDerived> {
    const bed = FORMS.byInput('LOC_FORM_BED')!.id;
    const rows = await tx.execute<{ beds: number; censable: number }[]>(
      `with recursive sub as (
         select id from practice.care_spaces where id = ?
         union
         select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
       )
       select
         count(*) filter (where cs.form_concept_id = ? and cs.status_concept_id = ?)::int as beds,
         count(*) filter (where cs.form_concept_id = ? and cs.status_concept_id = ? and cs.censable is true)::int as censable
       from sub join practice.care_spaces cs on cs.id = sub.id`,
      [id, bed, PRAC.SPACE_ACTIVE, bed, PRAC.SPACE_ACTIVE],
    );
    return {
      beds: rows[0]?.beds ?? 0,
      censableBeds: rows[0]?.censable ?? 0,
      activeChildren: children.filter(
        (c) => c.statusConceptId === PRAC.SPACE_ACTIVE,
      ).length,
    };
  }
}
