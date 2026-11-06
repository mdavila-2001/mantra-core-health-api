import { jest } from '@jest/globals';
import { runWithTenant, type AuthenticatedUser } from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import type { LabServiceDraftDto } from '../dto/lab-portal-service.dto';
import {
  DiagnosticPriceSchedules,
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
  DiagnosticUnits,
} from '../entities';
import {
  DiagnosticPriceSchedulesRepository,
  DiagnosticStudyComponentsRepository,
  DiagnosticStudyOfferingsRepository,
  DiagnosticStudyPricesRepository,
  DiagnosticUnitsRepository,
} from '../repositories';
import { DiagnosticStudiesService } from './diagnostic-studies.service';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';
import { LabPortalCatalogService } from './lab-portal-catalog.service';
import { LabPortalCategoriesService } from './lab-portal-categories.service';
import { LabPortalContextService } from './lab-portal-context.service';
import { LabPortalImportService } from './lab-portal-import.service';
import { LabPortalPricingService } from './lab-portal-pricing.service';
import { LabPortalStudyCatalogService } from './lab-portal-study-catalog.service';
import { LabPortalWriterService } from './lab-portal-writer.service';

export const T1 = '11111111-1111-4111-8111-111111111111';
export const T2 = '22222222-2222-4222-8222-222222222222';
export const T3 = '33333333-3333-4333-8333-333333333333';
export const actor = {
  id: 'user-1',
  roles: ['USER'],
} as unknown as AuthenticatedUser;

export type Row = Record<string, unknown>;

/** In-memory EntityManager: equality / `$in` / null filters, enough for these services. */
export class FakeEm {
  readonly store = new Map<unknown, Row[]>();
  flush = jest.fn(async () => undefined);
  rows(entity: unknown): Row[] {
    if (!this.store.has(entity)) this.store.set(entity, []);
    return this.store.get(entity)!;
  }
  private matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && '$in' in value)
        return (value as { $in: unknown[] }).$in.includes(row[key]);
      if (value === null) return row[key] == null;
      return row[key] === value;
    });
  }
  findOne = async (entity: unknown, where: Row) =>
    this.rows(entity).find((r) => this.matches(r, where)) ?? null;
  find = async (entity: unknown, where: Row, opts?: Row) => {
    const found = this.rows(entity).filter((r) => this.matches(r, where));
    const order = opts?.orderBy as Row | undefined;
    if (order?.versionNumber === 'DESC')
      found.sort(
        (a, b) => (b.versionNumber as number) - (a.versionNumber as number),
      );
    const limit = opts?.limit as number | undefined;
    return limit ? found.slice(0, limit) : found;
  };
  create = (entity: new () => Row, data: Row) => {
    const row = Object.assign(new entity(), data);
    this.rows(entity).push(row);
    return row;
  };
  remove = (row: Row) => {
    for (const rows of this.store.values()) {
      const at = rows.indexOf(row);
      if (at >= 0) rows.splice(at, 1);
    }
  };
  lock = jest.fn(async () => undefined);
  getReference = (_entity: unknown, id: string) => ({ id });
  fork = () => this;
  transactional = async (cb: (tx: FakeEm) => unknown) => cb(this);
}

export function build(concepts: { id: string; display: string }[] = []) {
  const em = new FakeEm();
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() };
  const readRepo = {
    findCurrentPublicSchedules: async (_: unknown, unitId: string) =>
      em
        .rows(DiagnosticPriceSchedules)
        .filter(
          (s) =>
            s.diagnosticUnitId === unitId &&
            s.publicVisibility &&
            s.statusConceptId === DUNIT.SCHEDULE_ACTIVE,
        ),
    findCurrentPrices: async (
      _: unknown,
      scheduleIds: string[],
      offeringIds: string[],
    ) =>
      em
        .rows(DiagnosticStudyPrices)
        .filter(
          (p) =>
            scheduleIds.includes(p.priceScheduleId as string) &&
            offeringIds.includes(p.diagnosticStudyOfferingId as string) &&
            p.statusConceptId === DUNIT.PRICE_ACTIVE,
        ),
    findConcepts: async (_: unknown, ids: string[]) =>
      concepts.filter((c) => ids.includes(c.id)),
  };
  const offeringsRepo = new DiagnosticStudyOfferingsRepository();
  const scope = new DiagnosticUnitScopeService(
    new DiagnosticUnitsRepository(),
    {} as never,
    {} as never,
    {} as never,
    offeringsRepo,
    {} as never,
    {} as never,
  );
  const studies = new DiagnosticStudiesService(
    em as never,
    scope,
    offeringsRepo,
    new DiagnosticStudyComponentsRepository(),
    logger as never,
  );
  const context = new LabPortalContextService(readRepo as never);
  const pricing = new LabPortalPricingService(
    new DiagnosticPriceSchedulesRepository(),
    new DiagnosticStudyPricesRepository(),
  );
  const writer = new LabPortalWriterService(context, offeringsRepo, pricing);
  const catalog = new LabPortalCatalogService(
    em as never,
    context,
    writer,
    studies,
    logger as never,
  );
  const categories = new LabPortalCategoriesService(
    em as never,
    context,
    logger as never,
  );
  const importer = new LabPortalImportService(
    em as never,
    context,
    writer,
    logger as never,
  );
  const studyCatalog = new LabPortalStudyCatalogService(
    em as never,
    { findPage: jest.fn(async () => STUDY_ROWS) } as never,
    { findDirectComponents: jest.fn(async () => PART_ROWS) } as never,
    context,
    writer,
    offeringsRepo,
    new DiagnosticStudyComponentsRepository(),
    pricing,
    logger as never,
  );
  for (const [tenantId, code] of [
    [T1, 'LAB1'],
    [T2, 'LAB2'],
  ]) {
    em.create(DiagnosticUnits as unknown as new () => Row, {
      tenantId,
      code,
      statusConceptId: DUNIT.UNIT_ACTIVE,
      createdAt: new Date(),
    });
  }
  return { em, catalog, categories, importer, studyCatalog };
}

export const HEMO = 'aaaaaaaa-0000-4000-8000-000000000001';
export const HB = 'aaaaaaaa-0000-4000-8000-000000000002';
export const ODD = 'aaaaaaaa-0000-4000-8000-000000000003';
const STUDY_ROWS = [
  {
    id: HEMO,
    code: 'HEMOGRAMA',
    name: 'Hemograma completo',
    family: 'LAB',
    props: {
      study_catalog_code: 'HEMOGRAMA',
      loinc_code: '57021-8',
      catalog_version: '2026-10-31',
      specimen: { codigo: 'SANGRE_EDTA', nombre: 'Sangre total (EDTA)' },
      section: { codigo: 'HEMATO', nombre: 'Hematología' },
    },
  },
];
const PART_ROWS = [
  {
    id: HB,
    parent_id: HEMO,
    ordinal: 1,
    code: 'HEMOGRAMA.HB',
    name: 'Hemoglobina',
    props: { unit_ucum: 'g/dL' },
  },
  {
    id: ODD,
    parent_id: HEMO,
    ordinal: 2,
    code: 'HEMOGRAMA.SIN_ARANCEL',
    name: 'Sin arancel',
    props: null,
  },
];

export const inT = <T>(tenantId: string, fn: () => Promise<T>) =>
  runWithTenant(tenantId, fn);
export const draft = (code: string, extra: Row = {}) =>
  ({
    code,
    name: `Estudio ${code}`,
    price: '45',
    ...extra,
  }) as unknown as LabServiceDraftDto;
