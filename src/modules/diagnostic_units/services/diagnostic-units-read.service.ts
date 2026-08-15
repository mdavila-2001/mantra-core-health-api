import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId, ResourceNotFoundException } from '../../../common';
import type { CatalogConcepts } from '../../terminology/entities';
import type {
  DiagnosticEquipment,
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnitAccreditations,
  DiagnosticUnitSites,
  DiagnosticUnits,
} from '../entities';
import type {
  DiagnosticConceptDto,
  DiagnosticPublicPriceDto,
  DiagnosticUnitDetailDto,
  DiagnosticUnitDirectoryItemDto,
  DiagnosticUnitDirectoryResponseDto,
} from '../dto';
import { DiagnosticUnitsReadRepository } from '../repositories';

/** Lecturas del directorio de unidades diagnósticas del tenant activo. */
@Injectable()
export class DiagnosticUnitsReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: DiagnosticUnitsReadRepository,
  ) {}

  /** Lista todas las unidades activas y verificadas del tenant seleccionado. */
  async list(): Promise<DiagnosticUnitDirectoryResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const units = await this.readRepo.findVisibleByTenant(em, tenantId);
    if (units.length === 0) return { items: [], count: 0 };

    const unitIds = units.map((unit) => unit.id);
    const [sites, offerings, concepts] = await Promise.all([
      this.readRepo.findActiveSites(em, unitIds),
      this.readRepo.findActiveOfferings(em, unitIds),
      this.readRepo.findConcepts(
        em,
        unique(units.map((unit) => unit.diagnosticUnitTypeConceptId)),
      ),
    ]);
    const equipment = await this.readRepo.findEquipment(
      em,
      sites.map((site) => site.id),
    );

    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const siteCount = countBy(sites, (site) => site.diagnosticUnitId);
    const studyCount = countBy(
      offerings,
      (offering) => offering.diagnosticUnitId,
    );
    const unitBySite = new Map(
      sites.map((site) => [site.id, site.diagnosticUnitId]),
    );
    const equipmentCount = countBy(equipment, (item) =>
      unitBySite.get(item.diagnosticUnitSiteId),
    );

    const items = units.map((unit) =>
      this.toSummary(
        unit,
        conceptById,
        siteCount.get(unit.id) ?? 0,
        equipmentCount.get(unit.id) ?? 0,
        studyCount.get(unit.id) ?? 0,
      ),
    );
    return { items, count: items.length };
  }

  /** Perfil publicado; otro tenant obtiene el mismo 404 que un id inexistente. */
  async getById(id: string): Promise<DiagnosticUnitDetailDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const unit = await this.readRepo.findVisibleById(em, tenantId, id);
    if (!unit) {
      throw new ResourceNotFoundException('Unidad diagnóstica no encontrada', {
        unitId: id,
      });
    }

    const now = new Date();
    const [sites, offerings, schedules, accreditations] = await Promise.all([
      this.readRepo.findActiveSites(em, [unit.id]),
      this.readRepo.findActiveOfferings(em, [unit.id]),
      this.readRepo.findCurrentPublicSchedules(em, unit.id, now),
      this.readRepo.findCurrentAccreditations(em, unit.id, now),
    ]);
    const [equipment, prices, practiceSites] = await Promise.all([
      this.readRepo.findEquipment(
        em,
        sites.map((site) => site.id),
      ),
      this.readRepo.findCurrentPrices(
        em,
        schedules.map((schedule) => schedule.id),
        offerings.map((offering) => offering.id),
        now,
      ),
      this.readRepo.findPracticeSites(
        em,
        unique(sites.map((site) => site.practiceSiteId)),
      ),
    ]);

    const concepts = await this.readRepo.findConcepts(
      em,
      conceptIdsOf(
        unit,
        sites,
        equipment,
        offerings,
        schedules,
        accreditations,
      ),
    );
    const conceptById = new Map(
      concepts.map((concept) => [concept.id, concept]),
    );
    const practiceSiteById = new Map(
      practiceSites.map((site) => [site.id, site]),
    );
    const scheduleById = new Map(
      schedules.map((schedule) => [schedule.id, schedule]),
    );
    const pricesByOffering = this.pricesByOffering(
      prices,
      scheduleById,
      conceptById,
    );

    const summary = this.toSummary(
      unit,
      conceptById,
      sites.length,
      equipment.length,
      offerings.length,
    );

    return {
      ...summary,
      sites: sites.map((site) => {
        const readable = practiceSiteById.get(site.practiceSiteId);
        return {
          id: site.id,
          code: readable?.code ?? site.accessionPrefix ?? 'SEDE',
          name: readable?.name ?? 'Sede sin nombre registrado',
          role: concept(conceptById, site.siteRoleConceptId),
          sampleCollectionAvailable: site.sampleCollectionAvailable ?? null,
          imagingAvailable: site.imagingAvailable ?? null,
        };
      }),
      equipment: equipment.map((item) => ({
        id: item.id,
        siteId: item.diagnosticUnitSiteId,
        type: concept(conceptById, item.equipmentTypeConceptId),
        manufacturer: item.manufacturer ?? null,
        model: item.model ?? null,
        modality: optionalConcept(conceptById, item.modalityConceptId),
        operationalStatus: concept(
          conceptById,
          item.operationalStatusConceptId,
        ),
        lastCalibrationAt: item.lastCalibrationAt?.toISOString() ?? null,
        nextCalibrationDueAt: item.nextCalibrationDueAt?.toISOString() ?? null,
      })),
      studies: offerings.map((offering) => ({
        id: offering.id,
        code: offering.studyCode,
        name: offering.displayName,
        description: offering.description ?? null,
        siteId: offering.diagnosticUnitSiteId ?? null,
        modality: optionalConcept(conceptById, offering.modalityConceptId),
        preparationInstructions: offering.preparationInstructions ?? null,
        expectedDurationMinutes: offering.expectedDurationMinutes ?? null,
        expectedTurnaroundMinutes: offering.expectedTurnaroundMinutes ?? null,
        requiresMedicalOrder: offering.requiresMedicalOrder ?? null,
        prices: pricesByOffering.get(offering.id) ?? [],
      })),
      accreditations: accreditations.map((item) => ({
        id: item.id,
        type: concept(conceptById, item.accreditationConceptId),
        number: item.accreditationNumber ?? null,
        siteId: item.diagnosticUnitSiteId ?? null,
        validFrom: dateOnly(item.validFrom),
        validTo: dateOnly(item.validTo),
      })),
    };
  }

  private toSummary(
    unit: DiagnosticUnits,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    siteCount: number,
    equipmentCount: number,
    studyCount: number,
  ): DiagnosticUnitDirectoryItemDto {
    return {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      type: concept(concepts, unit.diagnosticUnitTypeConceptId),
      siteCount,
      equipmentCount,
      studyCount,
      acceptsExternalOrders: unit.acceptsExternalOrders ?? null,
      walkInAvailable: unit.walkInAvailable ?? null,
      homeCollectionAvailable: unit.homeCollectionAvailable ?? null,
    };
  }

  private pricesByOffering(
    prices: readonly DiagnosticStudyPrices[],
    schedules: ReadonlyMap<string, DiagnosticPriceSchedules>,
    concepts: ReadonlyMap<string, CatalogConcepts>,
  ): Map<string, DiagnosticPublicPriceDto[]> {
    const result = new Map<string, DiagnosticPublicPriceDto[]>();
    for (const price of prices) {
      const schedule = schedules.get(price.priceScheduleId);
      if (!schedule) continue;
      const current = result.get(price.diagnosticStudyOfferingId) ?? [];
      current.push({
        amount: price.patientAmount ?? price.baseAmount,
        currency: concept(concepts, schedule.currencyConceptId),
        scheduleCode: schedule.code,
        siteId: schedule.diagnosticUnitSiteId ?? null,
      });
      result.set(price.diagnosticStudyOfferingId, current);
    }
    return result;
  }
}

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

function dateOnly(value: Date | undefined): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function countBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string | undefined,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key !== undefined) result.set(key, (result.get(key) ?? 0) + 1);
  }
  return result;
}

function conceptIdsOf(
  unit: DiagnosticUnits,
  sites: readonly DiagnosticUnitSites[],
  equipment: readonly DiagnosticEquipment[],
  offerings: readonly DiagnosticStudyOfferings[],
  schedules: readonly DiagnosticPriceSchedules[],
  accreditations: readonly DiagnosticUnitAccreditations[],
): string[] {
  return unique(
    [
      unit.diagnosticUnitTypeConceptId,
      ...sites.map((site) => site.siteRoleConceptId),
      ...equipment.flatMap((item) => [
        item.equipmentTypeConceptId,
        item.operationalStatusConceptId,
        ...(item.modalityConceptId ? [item.modalityConceptId] : []),
      ]),
      ...offerings.flatMap((item) =>
        item.modalityConceptId ? [item.modalityConceptId] : [],
      ),
      ...schedules.flatMap((item) =>
        item.currencyConceptId ? [item.currencyConceptId] : [],
      ),
      ...accreditations.map((item) => item.accreditationConceptId),
    ].filter((id): id is string => Boolean(id)),
  );
}
