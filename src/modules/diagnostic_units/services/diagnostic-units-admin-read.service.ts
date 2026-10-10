import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import type { PracticeSites } from '../../practice/entities';
import type { CatalogConcepts } from '../../terminology/entities';
import { DUNIT } from '../diagnostic_units.concepts';
import type {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitPractitionerAssignments,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';
import { DiagnosticUnitsAdminReadRepository } from '../repositories';
import type {
  DiagnosticConceptDto,
  DiagnosticUnitAdminAccreditationDto,
  DiagnosticUnitAdminDetailDto,
  DiagnosticUnitAdminEquipmentDto,
  DiagnosticUnitAdminItemDto,
  DiagnosticUnitAdminListDto,
  DiagnosticUnitAdminPriceDto,
  DiagnosticUnitAdminSiteDto,
  DiagnosticUnitAdminStaffDto,
  DiagnosticUnitAdminStudyDto,
} from '../dto';

/** Milisegundos de un día, para las cuentas de vencimiento y calibración. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * La consola de administración del laboratorio médico (CARRIL 16).
 *
 * ## Por qué no alcanzaba con el directorio
 *
 * `DiagnosticUnitsReadService` sirve la vitrina: sólo unidades activas y
 * verificadas, sólo ofertas activas, sólo precios de cronogramas marcados como
 * públicos y sin una palabra sobre el personal. Es lo correcto para el paciente
 * del carril 11 — y deja al administrador sin ver nada de lo que tiene que
 * administrar: la unidad que todavía no publicó desaparece de todas las
 * pantallas, la oferta que retiró no se puede reactivar porque no se puede
 * encontrar, y el cronograma de una aseguradora no existe.
 *
 * Esta lectura devuelve **el mismo dominio sin los filtros de publicación**, y
 * agrega dos cosas que la vitrina no puede tener: el personal con sus permisos
 * de validación y firma, y las alertas de vencimiento y calibración.
 *
 * ## Los filtros de la vitrina se informan, no se aplican
 *
 * `publiclyListed` calcula con la misma regla del directorio si la unidad
 * aparece hoy ante un paciente. Así la consola dice «esto no se ve todavía» sin
 * reimplementar la regla y sin arriesgarse a contradecirla.
 */
@Injectable()
export class DiagnosticUnitsAdminReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas administrativas del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: DiagnosticUnitsAdminReadRepository,
  ) {}

  /**
   * Todas las unidades del tenant activo, publicadas o no.
   *
   * @returns Las unidades con sus recuentos y su estado de publicación.
   */
  async list(): Promise<DiagnosticUnitAdminListDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const units = await this.readRepo.findByTenant(em, tenantId);
    if (units.length === 0) return { items: [], count: 0 };

    const unitIds = units.map((unit) => unit.id);
    const [sites, offerings] = await Promise.all([
      this.readRepo.findSites(em, unitIds),
      this.readRepo.findOfferings(em, unitIds),
    ]);
    const equipment = await this.readRepo.findEquipment(
      em,
      sites.map((site) => site.id),
    );

    const concepts = await this.readRepo.findConcepts(
      em,
      unique(
        units.flatMap((unit) => [
          unit.diagnosticUnitTypeConceptId,
          unit.statusConceptId,
          unit.verificationStatusConceptId,
        ]),
      ),
    );
    const byId = new Map(concepts.map((concept) => [concept.id, concept]));

    const unitBySite = new Map(
      sites.map((site) => [site.id, site.diagnosticUnitId]),
    );
    const sitesByUnit = countBy(sites, (site) => site.diagnosticUnitId);
    const studiesByUnit = countBy(
      offerings,
      (offering) => offering.diagnosticUnitId,
    );
    const teamsByUnit = countBy(equipment, (item) =>
      unitBySite.get(item.diagnosticUnitSiteId),
    );

    const items = units.map((unit) =>
      this.summary(
        unit,
        byId,
        sitesByUnit.get(unit.id) ?? 0,
        studiesByUnit.get(unit.id) ?? 0,
        teamsByUnit.get(unit.id) ?? 0,
      ),
    );
    return { items, count: items.length };
  }

  /**
   * La ficha administrativa completa de una unidad.
   *
   * @param id - Unidad consultada.
   * @returns Sedes, equipamiento, catálogo con precios, legajo y personal.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async getById(id: string): Promise<DiagnosticUnitAdminDetailDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const unit = await this.readRepo.findById(em, tenantId, id);
    if (!unit) {
      throw new ResourceNotFoundException('Unidad diagnóstica no encontrada', {
        unitId: id,
      });
    }

    const [sites, offerings, schedules, accreditations, assignments] =
      await Promise.all([
        this.readRepo.findSites(em, [unit.id]),
        this.readRepo.findOfferings(em, [unit.id]),
        this.readRepo.findPriceSchedules(em, unit.id),
        this.readRepo.findAccreditations(em, unit.id),
        this.readRepo.findPractitionerAssignments(em, unit.id),
      ]);

    const [equipment, prices, practiceSites, roleAssignments] =
      await Promise.all([
        this.readRepo.findEquipment(
          em,
          sites.map((site) => site.id),
        ),
        this.readRepo.findPrices(
          em,
          schedules.map((schedule) => schedule.id),
        ),
        this.readRepo.findPracticeSites(
          em,
          unique(sites.map((site) => site.practiceSiteId)),
        ),
        this.readRepo.findRoleAssignments(
          em,
          unique(
            assignments.map(
              (assignment) => assignment.practitionerRoleAssignmentId,
            ),
          ),
        ),
      ]);

    const profileByRoleAssignment = new Map(
      roleAssignments.map((row) => [row.id, row.practitionerProfileId]),
    );
    const names = await this.readRepo.findPractitionerNames(
      em,
      unique([...profileByRoleAssignment.values()]),
    );

    const concepts = await this.readRepo.findConcepts(
      em,
      conceptIds({
        unit,
        sites,
        equipment,
        offerings,
        schedules,
        prices,
        accreditations,
        assignments,
        roleAssignments: roleAssignments.map((row) => row.specialtyConceptId),
      }),
    );
    const byId = new Map(concepts.map((concept) => [concept.id, concept]));
    const siteById = new Map(practiceSites.map((site) => [site.id, site]));
    const scheduleById = new Map(
      schedules.map((schedule) => [schedule.id, schedule]),
    );
    const pricesByStudy = this.pricesByStudy(prices, scheduleById, byId);
    const now = new Date();

    return {
      ...this.summary(
        unit,
        byId,
        sites.length,
        offerings.length,
        equipment.length,
      ),
      sites: sites.map((site) => this.site(site, siteById, byId)),
      equipment: equipment.map((item) => this.team(item, byId, now)),
      studies: offerings.map((offering) =>
        this.study(offering, byId, pricesByStudy.get(offering.id) ?? []),
      ),
      accreditations: accreditations.map((doc) =>
        this.accreditation(doc, byId, now),
      ),
      staff: assignments.map((assignment) =>
        this.member(
          assignment,
          byId,
          profileByRoleAssignment.get(assignment.practitionerRoleAssignmentId),
          names,
        ),
      ),
    };
  }

  private summary(
    unit: DiagnosticUnits,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    siteCount: number,
    studyCount: number,
    equipmentCount: number,
  ): DiagnosticUnitAdminItemDto {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      type: concept(concepts, unit.diagnosticUnitTypeConceptId),
      status: concept(concepts, unit.statusConceptId),
      verificationStatus: concept(concepts, unit.verificationStatusConceptId),
      // La misma regla que `findVisibleByTenant`: activa y verificada. Se
      // informa en vez de filtrar, para que la consola pueda decir por qué una
      // unidad todavía no se ve.
      publiclyListed:
        unit.statusConceptId === DUNIT.UNIT_ACTIVE &&
        unit.verificationStatusConceptId === DUNIT.VERIFICATION_VERIFIED,
      siteCount,
      studyCount,
      equipmentCount,
      acceptsExternalOrders: unit.acceptsExternalOrders ?? null,
      walkInAvailable: unit.walkInAvailable ?? null,
      homeCollectionAvailable: unit.homeCollectionAvailable ?? null,
    };
  }

  private site(
    site: DiagnosticUnitSites,
    practiceSites: ReadonlyMap<string, PracticeSites>,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): DiagnosticUnitAdminSiteDto {
    const legible = practiceSites.get(site.practiceSiteId);
    return {
      id: site.id,
      practiceSiteId: site.practiceSiteId,
      code: legible?.code ?? site.accessionPrefix ?? 'SEDE',
      name: legible?.name ?? 'Sede sin nombre registrado',
      role: concept(concepts, site.siteRoleConceptId),
      accessionPrefix: site.accessionPrefix ?? null,
      sampleCollectionAvailable: site.sampleCollectionAvailable ?? null,
      imagingAvailable: site.imagingAvailable ?? null,
      status: concept(concepts, site.statusConceptId),
    };
  }

  private team(
    item: DiagnosticEquipment,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    now: Date,
  ): DiagnosticUnitAdminEquipmentDto {
    return {
      id: item.id,
      siteId: item.diagnosticUnitSiteId,
      type: concept(concepts, item.equipmentTypeConceptId),
      manufacturer: item.manufacturer ?? null,
      model: item.model ?? null,
      serialNumber: item.serialNumber ?? null,
      modality: optionalConcept(concepts, item.modalityConceptId),
      operationalStatus: concept(concepts, item.operationalStatusConceptId),
      lastCalibrationAt: item.lastCalibrationAt?.toISOString() ?? null,
      nextCalibrationDueAt: item.nextCalibrationDueAt?.toISOString() ?? null,
      daysToCalibration: daysUntil(item.nextCalibrationDueAt, now),
    };
  }

  private study(
    offering: DiagnosticStudyOfferings,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    prices: DiagnosticUnitAdminPriceDto[],
  ): DiagnosticUnitAdminStudyDto {
    return {
      id: offering.id,
      code: offering.studyCode,
      name: offering.displayName,
      description: offering.description ?? null,
      siteId: offering.diagnosticUnitSiteId ?? null,
      modality: optionalConcept(concepts, offering.modalityConceptId),
      specimenType: optionalConcept(concepts, offering.specimenTypeConceptId),
      preparationInstructions: offering.preparationInstructions ?? null,
      expectedDurationMinutes: offering.expectedDurationMinutes ?? null,
      expectedTurnaroundMinutes: offering.expectedTurnaroundMinutes ?? null,
      requiresMedicalOrder: offering.requiresMedicalOrder ?? null,
      requiresPriorAuthorization: offering.requiresPriorAuthorization ?? null,
      homeCollectionEligible: offering.homeCollectionEligible ?? null,
      status: concept(concepts, offering.statusConceptId),
      prices,
    };
  }

  private accreditation(
    doc: DiagnosticUnitAccreditations,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    now: Date,
  ): DiagnosticUnitAdminAccreditationDto {
    return {
      id: doc.id,
      siteId: doc.diagnosticUnitSiteId ?? null,
      type: concept(concepts, doc.accreditationConceptId),
      number: doc.accreditationNumber ?? null,
      evidenceFileId: doc.evidenceFileId ?? null,
      validFrom: onlyDate(doc.validFrom),
      validTo: onlyDate(doc.validTo),
      daysToExpiry: daysUntil(doc.validTo, now),
      verificationStatus: concept(concepts, doc.verificationStatusConceptId),
    };
  }

  private member(
    assignment: DiagnosticUnitPractitionerAssignments,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    practitionerProfileId: string | undefined,
    names: ReadonlyMap<string, string>,
  ): DiagnosticUnitAdminStaffDto {
    return {
      id: assignment.id,
      practitionerRoleAssignmentId: assignment.practitionerRoleAssignmentId,
      practitionerProfileId: practitionerProfileId ?? null,
      practitionerName:
        practitionerProfileId === undefined
          ? null
          : (names.get(practitionerProfileId) ?? null),
      siteId: assignment.diagnosticUnitSiteId ?? null,
      assignmentRole: optionalConcept(
        concepts,
        assignment.assignmentRoleConceptId,
      ),
      specialty: optionalConcept(concepts, assignment.specialtyConceptId),
      mayValidateResults: assignment.mayValidateResults ?? null,
      maySignReports: assignment.maySignReports ?? null,
      validFrom: onlyDate(assignment.validFrom),
      validTo: onlyDate(assignment.validTo),
      status: concept(concepts, assignment.statusConceptId),
    };
  }

  /**
   * Los precios agrupados por estudio, con el dato del cronograma pegado.
   *
   * El cronograma viaja resuelto —código, visibilidad y moneda— porque sin él
   * un importe no significa nada: son varios cronogramas por unidad y el mismo
   * estudio tiene precio distinto en cada uno.
   */
  private pricesByStudy(
    prices: readonly DiagnosticStudyPrices[],
    schedules: ReadonlyMap<string, DiagnosticPriceSchedules>,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): Map<string, DiagnosticUnitAdminPriceDto[]> {
    const result = new Map<string, DiagnosticUnitAdminPriceDto[]>();
    for (const price of prices) {
      const schedule = schedules.get(price.priceScheduleId);
      if (!schedule) continue;
      const current = result.get(price.diagnosticStudyOfferingId) ?? [];
      current.push({
        id: price.id,
        scheduleId: schedule.id,
        scheduleCode: schedule.code,
        schedulePublic: schedule.publicVisibility ?? false,
        versionNumber: price.versionNumber,
        baseAmount: price.baseAmount,
        patientAmount: price.patientAmount ?? null,
        insurerAmount: price.insurerAmount ?? null,
        currency: optionalConcept(concepts, schedule.currencyConceptId),
        effectiveFrom: price.effectiveFrom.toISOString(),
        effectiveTo: price.effectiveTo?.toISOString() ?? null,
        status: concept(concepts, price.statusConceptId),
      });
      result.set(price.diagnosticStudyOfferingId, current);
    }
    return result;
  }
}

/**
 * El concepto traducido, o un marcador explícito si el catálogo no lo tiene.
 *
 * Mismo criterio que el directorio público del módulo: nunca el uuid crudo y
 * nunca esconder la fila.
 */
function concept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): DiagnosticConceptDto {
  const value = id === undefined ? undefined : concepts.get(id);
  return value
    ? { code: value.code, display: value.display }
    : { code: 'UNKNOWN', display: 'Sin registrar' };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): DiagnosticConceptDto | null {
  return id === undefined ? null : concept(concepts, id);
}

function onlyDate(value: Date | undefined): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

/**
 * Días de calendario entre hoy y la fecha, comparados a medianoche UTC.
 *
 * A medianoche y no por diferencia de instantes para que algo que vence hoy dé
 * `0` y no `-1` por unas horas: quien lee la alerta piensa en días, no en
 * milisegundos.
 */
function daysUntil(value: Date | undefined, now: Date): number | null {
  if (value === undefined) return null;
  const target = Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  );
  const reference = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.round((target - reference) / ONE_DAY_MS);
}

function unique(values: readonly (string | undefined)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => value !== undefined)),
  ];
}

function countBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string | undefined,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key !== undefined) {
      result.set(key, (result.get(key) ?? 0) + 1);
    }
  }
  return result;
}

/** Todos los `*_concept_id` de la ficha, sin repetir, para una única lectura. */
function conceptIds(sources: {
  readonly unit: DiagnosticUnits;
  readonly sites: readonly DiagnosticUnitSites[];
  readonly equipment: readonly DiagnosticEquipment[];
  readonly offerings: readonly DiagnosticStudyOfferings[];
  readonly schedules: readonly DiagnosticPriceSchedules[];
  readonly prices: readonly DiagnosticStudyPrices[];
  readonly accreditations: readonly DiagnosticUnitAccreditations[];
  readonly assignments: readonly DiagnosticUnitPractitionerAssignments[];
  readonly roleAssignments: readonly (string | undefined)[];
}): string[] {
  return unique([
    sources.unit.diagnosticUnitTypeConceptId,
    sources.unit.statusConceptId,
    sources.unit.verificationStatusConceptId,
    ...sources.sites.flatMap((site) => [
      site.siteRoleConceptId,
      site.statusConceptId,
    ]),
    ...sources.equipment.flatMap((item) => [
      item.equipmentTypeConceptId,
      item.operationalStatusConceptId,
      item.modalityConceptId,
    ]),
    ...sources.offerings.flatMap((item) => [
      item.modalityConceptId,
      item.specimenTypeConceptId,
      item.statusConceptId,
    ]),
    ...sources.schedules.flatMap((item) => [
      item.currencyConceptId,
      item.statusConceptId,
    ]),
    ...sources.prices.map((item) => item.statusConceptId),
    ...sources.accreditations.flatMap((item) => [
      item.accreditationConceptId,
      item.verificationStatusConceptId,
    ]),
    ...sources.assignments.flatMap((item) => [
      item.assignmentRoleConceptId,
      item.specialtyConceptId,
      item.statusConceptId,
    ]),
    ...sources.roleAssignments,
  ]);
}
