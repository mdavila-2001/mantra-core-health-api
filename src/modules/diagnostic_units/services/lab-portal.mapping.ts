import { multiplyDecimalsToMoney } from '../../../common/money/decimal-money';
import { DUNIT } from '../diagnostic_units.concepts';
import type {
  DiagnosticStudyOfferings,
  DiagnosticStudyPrices,
} from '../entities';
import type { LabServiceDto } from '../dto/lab-portal-responses.dto';

/**
 * Pure translation between the lab portal contract (`/diagnostics/lab/*`) and
 * the module tables. No I/O: every rule here is unit-testable on its own.
 */

export const LAB_SERVICE_STATUSES = [
  'PUBLISHED',
  'DRAFT',
  'WITHDRAWN',
] as const;
export type LabServiceStatus = (typeof LAB_SERVICE_STATUSES)[number];

const STATUS_CONCEPT: Record<LabServiceStatus, string> = {
  // OFFERING_ACTIVE is the flag the public directory and search read.
  PUBLISHED: DUNIT.OFFERING_ACTIVE,
  DRAFT: DUNIT.OFFERING_DRAFT,
  WITHDRAWN: DUNIT.OFFERING_RETIRED,
};

/** Offering status concept for a portal status. */
export function statusConcept(status: LabServiceStatus): string {
  return STATUS_CONCEPT[status];
}

/** Portal status of an offering; any non-published, non-retired state reads as DRAFT. */
export function statusOf(conceptId: string): LabServiceStatus {
  if (conceptId === DUNIT.OFFERING_ACTIVE) return 'PUBLISHED';
  if (conceptId === DUNIT.OFFERING_RETIRED) return 'WITHDRAWN';
  return 'DRAFT';
}

/** A decimal amount with exactly two decimals ('45' -> '45.00'). */
export function money(amount: string): string {
  return multiplyDecimalsToMoney(amount, '1');
}

/** Basis points (1/10000) as a fixed four-decimal string. */
function basisPoints(bp: number): string {
  return `${Math.floor(bp / 10000)}.${String(bp % 10000).padStart(4, '0')}`;
}

/**
 * `discount_factor` stores the discount as a fraction (10 % -> '0.1000'), the
 * same convention as the `CreateStudyPriceDto` example ('0.10').
 */
export function discountFactorOf(percent: number | null): string | undefined {
  return percent === null ? undefined : basisPoints(Math.round(percent * 100));
}

/** Discount percent from a stored fraction, or null when none was set. */
export function percentOf(factor: string | null | undefined): number | null {
  if (factor === null || factor === undefined || factor === '') return null;
  return Math.round(Number(factor) * 10000) / 100;
}

/** What an AloVida user pays: list price minus the discount, rounded half-up. */
export function alovidaPrice(price: string, percent: number | null): string {
  const remaining = 10000 - Math.round((percent ?? 0) * 100);
  return multiplyDecimalsToMoney(price, basisPoints(remaining));
}

/** Hours (portal) to minutes (`expected_turnaround_minutes`). */
export function hoursToMinutes(hours: number | null): number | undefined {
  return hours === null ? undefined : hours * 60;
}

/** Minutes to whole hours, or null when not published. */
export function minutesToHours(
  minutes: number | null | undefined,
): number | null {
  return minutes === null || minutes === undefined
    ? null
    : Math.round(minutes / 60);
}

/** Blank or missing text becomes undefined (stored as NULL). */
export function cleanText(
  value: string | null | undefined,
): string | undefined {
  const text = (value ?? '').trim();
  return text === '' ? undefined : text;
}

/**
 * Response shape of one service.
 *
 * `categoryId`/`categoryName` are always null and `available` always true: the
 * model has no column for lab categories nor for same-day availability of an
 * offering. `sampleType` is the display of `specimen_type_concept_id`.
 */
export function toLabService(
  offering: DiagnosticStudyOfferings,
  price: DiagnosticStudyPrices | undefined,
  sampleType: string | null,
): LabServiceDto {
  const listPrice = money(price?.baseAmount ?? '0');
  const percent = percentOf(price?.discountFactor);
  return {
    id: offering.id,
    code: offering.studyCode,
    name: offering.displayName,
    categoryId: null,
    categoryName: null,
    sampleType,
    preparation: offering.preparationInstructions ?? null,
    description: offering.description ?? null,
    turnaroundHours: minutesToHours(offering.expectedTurnaroundMinutes),
    requiresMedicalOrder: offering.requiresMedicalOrder ?? false,
    homeCollection: offering.homeCollectionEligible ?? false,
    price: listPrice,
    alovidaDiscountPercent: percent,
    alovidaPrice: alovidaPrice(listPrice, percent),
    currency: 'BOB',
    status: statusOf(offering.statusConceptId),
    available: true,
    updatedAt: offering.updatedAt.toISOString(),
  };
}
