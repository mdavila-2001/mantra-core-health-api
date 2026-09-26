import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSites } from '../../practice/entities';
import { Addresses } from '../../common/entities';
import { CatalogConcepts } from '../../terminology/entities';
import {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';
import { DUNIT } from '../diagnostic_units.concepts';

/** Consultas que componen las dos lecturas públicas del módulo 23. */
@Injectable()
export class DiagnosticUnitsReadRepository {
  /** Unidades activas y verificadas del tenant activo. */
  findVisibleByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<DiagnosticUnits[]> {
    return em.find(
      DiagnosticUnits,
      {
        tenantId,
        statusConceptId: DUNIT.UNIT_ACTIVE,
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Detalle con el mismo filtro de publicación y aislamiento que el listado. */
  findVisibleById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<DiagnosticUnits | null> {
    return em.findOne(DiagnosticUnits, {
      id,
      tenantId,
      statusConceptId: DUNIT.UNIT_ACTIVE,
      verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
    });
  }

  findActiveSites(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticUnitSites[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticUnitSites,
      {
        diagnosticUnitId: { $in: unitIds },
        statusConceptId: DUNIT.SITE_ACTIVE,
      },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /**
   * Direcciones de `common.addresses`, para leer la ciudad de cada sede
   * (CL-45, CL-51). `findPracticeSites` (más abajo) ya daba la sede de
   * `practice`; sólo faltaba este último salto hasta la dirección.
   */
  findAddresses(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Addresses[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(Addresses, { id: { $in: [...ids] } });
  }

  findEquipment(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<DiagnosticEquipment[]> {
    if (siteIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticEquipment,
      { diagnosticUnitSiteId: { $in: siteIds } },
      { orderBy: { manufacturer: 'ASC', model: 'ASC' } },
    );
  }

  findActiveOfferings(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<DiagnosticStudyOfferings[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(
      DiagnosticStudyOfferings,
      {
        diagnosticUnitId: { $in: unitIds },
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      },
      { orderBy: { displayName: 'ASC' } },
    );
  }

  findCurrentPublicSchedules(
    em: EntityManager,
    unitId: string,
    now: Date,
  ): Promise<DiagnosticPriceSchedules[]> {
    return em.find(DiagnosticPriceSchedules, {
      diagnosticUnitId: unitId,
      publicVisibility: true,
      statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
      ],
    });
  }

  findCurrentPrices(
    em: EntityManager,
    scheduleIds: readonly string[],
    offeringIds: readonly string[],
    now: Date,
  ): Promise<DiagnosticStudyPrices[]> {
    if (scheduleIds.length === 0 || offeringIds.length === 0) {
      return Promise.resolve([]);
    }
    return em.find(DiagnosticStudyPrices, {
      priceScheduleId: { $in: scheduleIds },
      diagnosticStudyOfferingId: { $in: offeringIds },
      statusConceptId: DUNIT.PRICE_ACTIVE,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
    });
  }

  findCurrentAccreditations(
    em: EntityManager,
    unitId: string,
    now: Date,
  ): Promise<DiagnosticUnitAccreditations[]> {
    return em.find(
      DiagnosticUnitAccreditations,
      {
        diagnosticUnitId: unitId,
        verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
        $and: [
          { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
          { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
        ],
      },
      { orderBy: { validTo: 'DESC' } },
    );
  }

  findPracticeSites(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<PracticeSites[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(PracticeSites, { id: { $in: ids } });
  }

  findConcepts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: ids } });
  }

  /* ---- el buscador de centros ---------------------------------------------
     El directorio de arriba contesta «qué centros tiene mi organización». Lo
     que sigue contesta la otra pregunta, la del paciente: «dónde me hago este
     estudio». Por eso no se acota al tenant y por eso lleva filtros. */

  /**
   * Unidades publicadas que casan con los filtros del buscador.
   *
   * @param em - Contexto de persistencia.
   * @param criteria - Filtros ya resueltos a conceptos e ids.
   * @param limit - Tope de filas.
   * @param offset - Filas a saltar.
   * @returns Las unidades, por nombre.
   */
  searchVisible(
    em: EntityManager,
    criteria: SearchDiagnosticUnitsCriteria,
    limit: number,
    offset: number,
  ): Promise<DiagnosticUnits[]> {
    return em.find(DiagnosticUnits, searchWhere(criteria), {
      orderBy: { name: 'ASC' },
      limit,
      offset,
    });
  }

  /**
   * Cuántas unidades publicadas casan con los filtros.
   *
   * @param em - Contexto de persistencia.
   * @param criteria - Filtros ya resueltos.
   * @returns El total, para poder paginar sin adivinar.
   */
  countVisible(
    em: EntityManager,
    criteria: SearchDiagnosticUnitsCriteria,
  ): Promise<number> {
    return em.count(DiagnosticUnits, searchWhere(criteria));
  }

  /**
   * Unidades que ofrecen un estudio, por su código.
   *
   * Se resuelve primero y **acota** la búsqueda de unidades, en vez de traerlas
   * todas y descartarlas después.
   *
   * @param em - Contexto de persistencia.
   * @param studyCode - Código del estudio.
   * @returns Los ids de unidad, sin repetir.
   */
  async findUnitIdsOfferingStudy(
    em: EntityManager,
    studyCode: string,
  ): Promise<string[]> {
    const filas = await em.find(
      DiagnosticStudyOfferings,
      { studyCode, statusConceptId: DUNIT.OFFERING_ACTIVE },
      { fields: ['diagnosticUnitId'] },
    );
    return [...new Set(filas.map((fila) => fila.diagnosticUnitId))];
  }

  /**
   * Unidades con convenio vigente con una aseguradora.
   *
   * Un convenio es, en este modelo, un cronograma de precios de tipo
   * aseguradora a nombre de ese tenant: no hay otra tabla que lo declare, y
   * agregar una duplicaría lo que el precio ya dice.
   *
   * @param em - Contexto de persistencia.
   * @param insurerTenantId - Aseguradora buscada.
   * @returns Los ids de unidad, sin repetir.
   */
  async findUnitIdsWithInsurerAgreement(
    em: EntityManager,
    insurerTenantId: string,
  ): Promise<string[]> {
    const filas = await em.find(
      DiagnosticPriceSchedules,
      { insurerTenantId, statusConceptId: DUNIT.SCHEDULE_ACTIVE },
      { fields: ['diagnosticUnitId'] },
    );
    return [...new Set(filas.map((fila) => fila.diagnosticUnitId))];
  }

  /**
   * Cronogramas públicos vigentes de varias unidades.
   *
   * La versión en lote de {@link findCurrentPublicSchedules}: el buscador
   * necesita el precio mínimo de veinte centros a la vez, y una consulta por
   * centro convierte una página en veinte viajes.
   *
   * @param em - Contexto de persistencia.
   * @param unitIds - Unidades consultadas.
   * @param now - Instante contra el que se mide la vigencia.
   * @returns Los cronogramas públicos vigentes.
   */
  findCurrentPublicSchedulesFor(
    em: EntityManager,
    unitIds: readonly string[],
    now: Date,
  ): Promise<DiagnosticPriceSchedules[]> {
    if (unitIds.length === 0) return Promise.resolve([]);
    return em.find(DiagnosticPriceSchedules, {
      diagnosticUnitId: { $in: unitIds },
      publicVisibility: true,
      statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
      ],
    });
  }

  /**
   * Precios vigentes de unos cronogramas, sin acotar por oferta.
   *
   * @param em - Contexto de persistencia.
   * @param scheduleIds - Cronogramas consultados.
   * @param now - Instante contra el que se mide la vigencia.
   * @returns Los precios vigentes.
   */
  findCurrentPricesForSchedules(
    em: EntityManager,
    scheduleIds: readonly string[],
    now: Date,
  ): Promise<DiagnosticStudyPrices[]> {
    if (scheduleIds.length === 0) return Promise.resolve([]);
    return em.find(DiagnosticStudyPrices, {
      priceScheduleId: { $in: scheduleIds },
      statusConceptId: DUNIT.PRICE_ACTIVE,
      effectiveFrom: { $lte: now },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gt: now } }],
    });
  }
}

/** Filtros del buscador, ya resueltos a conceptos e identificadores. */
export interface SearchDiagnosticUnitsCriteria {
  /** Texto libre sobre nombre y código. */
  q?: string;
  /** Organización propietaria, si se acota a una. */
  tenantId?: string;
  /** Tipo de unidad (concept id). */
  diagnosticUnitTypeConceptId?: string;
  /** Sólo las que toman muestras a domicilio. */
  homeCollection?: boolean;
  /** Sólo las que atienden sin turno. */
  walkIn?: boolean;
  /** Sólo las que aceptan órdenes de otras instituciones. */
  acceptsExternalOrders?: boolean;
  /** Unidades a las que un filtro previo ya restringió el resultado. */
  restrictToUnitIds?: readonly string[];
}

/**
 * El criterio del buscador.
 *
 * Estado activo y verificación verificada **no son opcionales**: el buscador es
 * la puerta por la que un paciente elige dónde atenderse, y un centro dado de
 * alta y todavía sin verificar no es un centro al que se pueda mandar a nadie.
 * Es el mismo filtro de publicación que aplica el directorio.
 */
function searchWhere(
  criteria: SearchDiagnosticUnitsCriteria,
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    statusConceptId: DUNIT.UNIT_ACTIVE,
    verificationStatusConceptId: DUNIT.VERIFICATION_VERIFIED,
  };
  if (criteria.tenantId !== undefined) where.tenantId = criteria.tenantId;
  if (criteria.diagnosticUnitTypeConceptId !== undefined) {
    where.diagnosticUnitTypeConceptId = criteria.diagnosticUnitTypeConceptId;
  }
  if (criteria.homeCollection !== undefined) {
    where.homeCollectionAvailable = criteria.homeCollection;
  }
  if (criteria.walkIn !== undefined) where.walkInAvailable = criteria.walkIn;
  if (criteria.acceptsExternalOrders !== undefined) {
    where.acceptsExternalOrders = criteria.acceptsExternalOrders;
  }
  if (criteria.restrictToUnitIds !== undefined) {
    where.id = { $in: [...criteria.restrictToUnitIds] };
  }
  if (criteria.q !== undefined && criteria.q !== '') {
    // `$ilike` y no `$like`: quien busca «lab central» no escribe la mayúscula,
    // y una búsqueda que distingue mayúsculas no encuentra nada.
    const patron = `%${criteria.q}%`;
    where.$or = [{ name: { $ilike: patron } }, { code: { $ilike: patron } }];
  }
  return where;
}
