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
const UN_DIA_MS = 24 * 60 * 60 * 1000;

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

    const conceptos = await this.readRepo.findConcepts(
      em,
      unicos(
        units.flatMap((unit) => [
          unit.diagnosticUnitTypeConceptId,
          unit.statusConceptId,
          unit.verificationStatusConceptId,
        ]),
      ),
    );
    const porId = new Map(conceptos.map((concepto) => [concepto.id, concepto]));

    const unidadPorSede = new Map(
      sites.map((site) => [site.id, site.diagnosticUnitId]),
    );
    const sedesPorUnidad = contarPor(sites, (site) => site.diagnosticUnitId);
    const estudiosPorUnidad = contarPor(
      offerings,
      (offering) => offering.diagnosticUnitId,
    );
    const equiposPorUnidad = contarPor(equipment, (item) =>
      unidadPorSede.get(item.diagnosticUnitSiteId),
    );

    const items = units.map((unit) =>
      this.resumen(
        unit,
        porId,
        sedesPorUnidad.get(unit.id) ?? 0,
        estudiosPorUnidad.get(unit.id) ?? 0,
        equiposPorUnidad.get(unit.id) ?? 0,
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
          unicos(sites.map((site) => site.practiceSiteId)),
        ),
        this.readRepo.findRoleAssignments(
          em,
          unicos(
            assignments.map(
              (assignment) => assignment.practitionerRoleAssignmentId,
            ),
          ),
        ),
      ]);

    const perfilPorAsignacionDeRol = new Map(
      roleAssignments.map((row) => [row.id, row.practitionerProfileId]),
    );
    const nombres = await this.readRepo.findPractitionerNames(
      em,
      unicos([...perfilPorAsignacionDeRol.values()]),
    );

    const conceptos = await this.readRepo.findConcepts(
      em,
      conceptIdsDe({
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
    const porId = new Map(conceptos.map((concepto) => [concepto.id, concepto]));
    const sedePorId = new Map(practiceSites.map((site) => [site.id, site]));
    const cronogramaPorId = new Map(
      schedules.map((schedule) => [schedule.id, schedule]),
    );
    const preciosPorEstudio = this.preciosPorEstudio(
      prices,
      cronogramaPorId,
      porId,
    );
    const ahora = new Date();

    return {
      ...this.resumen(
        unit,
        porId,
        sites.length,
        offerings.length,
        equipment.length,
      ),
      sites: sites.map((site) => this.sede(site, sedePorId, porId)),
      equipment: equipment.map((item) => this.equipo(item, porId, ahora)),
      studies: offerings.map((offering) =>
        this.estudio(offering, porId, preciosPorEstudio.get(offering.id) ?? []),
      ),
      accreditations: accreditations.map((doc) =>
        this.acreditacion(doc, porId, ahora),
      ),
      staff: assignments.map((assignment) =>
        this.integrante(
          assignment,
          porId,
          perfilPorAsignacionDeRol.get(assignment.practitionerRoleAssignmentId),
          nombres,
        ),
      ),
    };
  }

  private resumen(
    unit: DiagnosticUnits,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    siteCount: number,
    studyCount: number,
    equipmentCount: number,
  ): DiagnosticUnitAdminItemDto {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      type: concepto(conceptos, unit.diagnosticUnitTypeConceptId),
      status: concepto(conceptos, unit.statusConceptId),
      verificationStatus: concepto(conceptos, unit.verificationStatusConceptId),
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

  private sede(
    site: DiagnosticUnitSites,
    practiceSites: ReadonlyMap<string, PracticeSites>,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): DiagnosticUnitAdminSiteDto {
    const legible = practiceSites.get(site.practiceSiteId);
    return {
      id: site.id,
      practiceSiteId: site.practiceSiteId,
      code: legible?.code ?? site.accessionPrefix ?? 'SEDE',
      name: legible?.name ?? 'Sede sin nombre registrado',
      role: concepto(conceptos, site.siteRoleConceptId),
      accessionPrefix: site.accessionPrefix ?? null,
      sampleCollectionAvailable: site.sampleCollectionAvailable ?? null,
      imagingAvailable: site.imagingAvailable ?? null,
      status: concepto(conceptos, site.statusConceptId),
    };
  }

  private equipo(
    item: DiagnosticEquipment,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    ahora: Date,
  ): DiagnosticUnitAdminEquipmentDto {
    return {
      id: item.id,
      siteId: item.diagnosticUnitSiteId,
      type: concepto(conceptos, item.equipmentTypeConceptId),
      manufacturer: item.manufacturer ?? null,
      model: item.model ?? null,
      serialNumber: item.serialNumber ?? null,
      modality: conceptoOpcional(conceptos, item.modalityConceptId),
      operationalStatus: concepto(conceptos, item.operationalStatusConceptId),
      lastCalibrationAt: item.lastCalibrationAt?.toISOString() ?? null,
      nextCalibrationDueAt: item.nextCalibrationDueAt?.toISOString() ?? null,
      daysToCalibration: diasHasta(item.nextCalibrationDueAt, ahora),
    };
  }

  private estudio(
    offering: DiagnosticStudyOfferings,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    prices: DiagnosticUnitAdminPriceDto[],
  ): DiagnosticUnitAdminStudyDto {
    return {
      id: offering.id,
      code: offering.studyCode,
      name: offering.displayName,
      description: offering.description ?? null,
      siteId: offering.diagnosticUnitSiteId ?? null,
      modality: conceptoOpcional(conceptos, offering.modalityConceptId),
      specimenType: conceptoOpcional(conceptos, offering.specimenTypeConceptId),
      preparationInstructions: offering.preparationInstructions ?? null,
      expectedDurationMinutes: offering.expectedDurationMinutes ?? null,
      expectedTurnaroundMinutes: offering.expectedTurnaroundMinutes ?? null,
      requiresMedicalOrder: offering.requiresMedicalOrder ?? null,
      requiresPriorAuthorization: offering.requiresPriorAuthorization ?? null,
      homeCollectionEligible: offering.homeCollectionEligible ?? null,
      status: concepto(conceptos, offering.statusConceptId),
      prices,
    };
  }

  private acreditacion(
    doc: DiagnosticUnitAccreditations,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    ahora: Date,
  ): DiagnosticUnitAdminAccreditationDto {
    return {
      id: doc.id,
      siteId: doc.diagnosticUnitSiteId ?? null,
      type: concepto(conceptos, doc.accreditationConceptId),
      number: doc.accreditationNumber ?? null,
      evidenceFileId: doc.evidenceFileId ?? null,
      validFrom: soloFecha(doc.validFrom),
      validTo: soloFecha(doc.validTo),
      daysToExpiry: diasHasta(doc.validTo, ahora),
      verificationStatus: concepto(conceptos, doc.verificationStatusConceptId),
    };
  }

  private integrante(
    assignment: DiagnosticUnitPractitionerAssignments,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
    practitionerProfileId: string | undefined,
    nombres: ReadonlyMap<string, string>,
  ): DiagnosticUnitAdminStaffDto {
    return {
      id: assignment.id,
      practitionerRoleAssignmentId: assignment.practitionerRoleAssignmentId,
      practitionerProfileId: practitionerProfileId ?? null,
      practitionerName:
        practitionerProfileId === undefined
          ? null
          : (nombres.get(practitionerProfileId) ?? null),
      siteId: assignment.diagnosticUnitSiteId ?? null,
      assignmentRole: conceptoOpcional(
        conceptos,
        assignment.assignmentRoleConceptId,
      ),
      specialty: conceptoOpcional(conceptos, assignment.specialtyConceptId),
      mayValidateResults: assignment.mayValidateResults ?? null,
      maySignReports: assignment.maySignReports ?? null,
      validFrom: soloFecha(assignment.validFrom),
      validTo: soloFecha(assignment.validTo),
      status: concepto(conceptos, assignment.statusConceptId),
    };
  }

  /**
   * Los precios agrupados por estudio, con el dato del cronograma pegado.
   *
   * El cronograma viaja resuelto —código, visibilidad y moneda— porque sin él
   * un importe no significa nada: son varios cronogramas por unidad y el mismo
   * estudio tiene precio distinto en cada uno.
   */
  private preciosPorEstudio(
    prices: readonly DiagnosticStudyPrices[],
    schedules: ReadonlyMap<string, DiagnosticPriceSchedules>,
    conceptos: ReadonlyMap<string, CatalogConcepts>,
  ): Map<string, DiagnosticUnitAdminPriceDto[]> {
    const resultado = new Map<string, DiagnosticUnitAdminPriceDto[]>();
    for (const price of prices) {
      const schedule = schedules.get(price.priceScheduleId);
      if (!schedule) continue;
      const actuales = resultado.get(price.diagnosticStudyOfferingId) ?? [];
      actuales.push({
        id: price.id,
        scheduleId: schedule.id,
        scheduleCode: schedule.code,
        schedulePublic: schedule.publicVisibility ?? false,
        versionNumber: price.versionNumber,
        baseAmount: price.baseAmount,
        patientAmount: price.patientAmount ?? null,
        insurerAmount: price.insurerAmount ?? null,
        currency: conceptoOpcional(conceptos, schedule.currencyConceptId),
        effectiveFrom: price.effectiveFrom.toISOString(),
        effectiveTo: price.effectiveTo?.toISOString() ?? null,
        status: concepto(conceptos, price.statusConceptId),
      });
      resultado.set(price.diagnosticStudyOfferingId, actuales);
    }
    return resultado;
  }
}

/**
 * El concepto traducido, o un marcador explícito si el catálogo no lo tiene.
 *
 * Mismo criterio que el directorio público del módulo: nunca el uuid crudo y
 * nunca esconder la fila.
 */
function concepto(
  conceptos: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): DiagnosticConceptDto {
  const valor = id === undefined ? undefined : conceptos.get(id);
  return valor
    ? { code: valor.code, display: valor.display }
    : { code: 'UNKNOWN', display: 'Sin registrar' };
}

function conceptoOpcional(
  conceptos: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): DiagnosticConceptDto | null {
  return id === undefined ? null : concepto(conceptos, id);
}

function soloFecha(valor: Date | undefined): string | null {
  return valor?.toISOString().slice(0, 10) ?? null;
}

/**
 * Días de calendario entre hoy y la fecha, comparados a medianoche UTC.
 *
 * A medianoche y no por diferencia de instantes para que algo que vence hoy dé
 * `0` y no `-1` por unas horas: quien lee la alerta piensa en días, no en
 * milisegundos.
 */
function diasHasta(valor: Date | undefined, ahora: Date): number | null {
  if (valor === undefined) return null;
  const objetivo = Date.UTC(
    valor.getUTCFullYear(),
    valor.getUTCMonth(),
    valor.getUTCDate(),
  );
  const referencia = Date.UTC(
    ahora.getUTCFullYear(),
    ahora.getUTCMonth(),
    ahora.getUTCDate(),
  );
  return Math.round((objetivo - referencia) / UN_DIA_MS);
}

function unicos(valores: readonly (string | undefined)[]): string[] {
  return [
    ...new Set(valores.filter((valor): valor is string => valor !== undefined)),
  ];
}

function contarPor<T>(
  filas: readonly T[],
  claveDe: (fila: T) => string | undefined,
): Map<string, number> {
  const resultado = new Map<string, number>();
  for (const fila of filas) {
    const clave = claveDe(fila);
    if (clave !== undefined) {
      resultado.set(clave, (resultado.get(clave) ?? 0) + 1);
    }
  }
  return resultado;
}

/** Todos los `*_concept_id` de la ficha, sin repetir, para una única lectura. */
function conceptIdsDe(fuentes: {
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
  return unicos([
    fuentes.unit.diagnosticUnitTypeConceptId,
    fuentes.unit.statusConceptId,
    fuentes.unit.verificationStatusConceptId,
    ...fuentes.sites.flatMap((site) => [
      site.siteRoleConceptId,
      site.statusConceptId,
    ]),
    ...fuentes.equipment.flatMap((item) => [
      item.equipmentTypeConceptId,
      item.operationalStatusConceptId,
      item.modalityConceptId,
    ]),
    ...fuentes.offerings.flatMap((item) => [
      item.modalityConceptId,
      item.specimenTypeConceptId,
      item.statusConceptId,
    ]),
    ...fuentes.schedules.flatMap((item) => [
      item.currencyConceptId,
      item.statusConceptId,
    ]),
    ...fuentes.prices.map((item) => item.statusConceptId),
    ...fuentes.accreditations.flatMap((item) => [
      item.accreditationConceptId,
      item.verificationStatusConceptId,
    ]),
    ...fuentes.assignments.flatMap((item) => [
      item.assignmentRoleConceptId,
      item.specialtyConceptId,
      item.statusConceptId,
    ]),
    ...fuentes.roleAssignments,
  ]);
}
