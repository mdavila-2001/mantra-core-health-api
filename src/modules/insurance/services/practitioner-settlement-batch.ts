import { PreconditionFailedException } from '../../../common';
import { mismosDecimales, sumarDecimales } from '../../../common';
import { INS } from '../insurance.concepts';
import type {
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientExplanationsOfBenefit,
} from '../entities';
import { buildClaimSettlementBreakdown } from './claim-settlement-breakdown';

/**
 * Dominio puro del lote periódico de liquidación al profesional (Tarea 3 ·
 * H8 · CA-3.2). Sin efectos ni consultas: todo lo que necesita se lo pasa el
 * servicio ya cargado. Ver
 * `docs/contracts/insurer-practitioner-settlement-batches.md` §7–§10.
 */

export type SettlementCadence = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

/** Un día civil `YYYY-MM-DD`, sin zona horaria. */
export interface CivilDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number;
}

function parseCivilDate(value: string): CivilDate {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match)
    throw new PreconditionFailedException(
      `Fecha de período inválida: ${value}`,
    );
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatCivilDate(date: CivilDate): string {
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

function daysInMonth(year: number, month: number): number {
  // Día 0 del mes siguiente = último día del mes actual.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function lastDayOfMonth(year: number, month: number): CivilDate {
  return { year, month, day: daysInMonth(year, month) };
}

/** Suma `days` días civiles a una fecha, sin pasar por zona horaria. */
export function addCivilDays(civil: string, days: number): string {
  const { year, month, day } = parseCivilDate(civil);
  const utc = new Date(Date.UTC(year, month - 1, day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return formatCivilDate({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  });
}

/**
 * Medianoche en La Paz (UTC-4 todo el año, sin horario de verano) de un día
 * civil. Mismo cálculo que `insurance-analytics.service.ts` (`laPazMidnightUtc`).
 */
export function laPazMidnightUtc(civil: string): Date {
  parseCivilDate(civil); // valida el formato
  return new Date(`${civil}T00:00:00.000-04:00`);
}

/**
 * Deriva el período del contrato a partir de la cadencia y el inicio
 * declarado (contrato §8). El inicio desalineado responde 422: no hay
 * cadencia "aproximada".
 */
export function resolveSettlementPeriod(
  cadence: SettlementCadence,
  periodStartCivil: string,
): { periodStart: string; periodEnd: string } {
  const start = parseCivilDate(periodStartCivil);
  if (cadence === 'WEEKLY') {
    return {
      periodStart: periodStartCivil,
      periodEnd: addCivilDays(periodStartCivil, 6),
    };
  }
  if (cadence === 'BIWEEKLY') {
    if (start.day === 1) {
      return {
        periodStart: periodStartCivil,
        periodEnd: formatCivilDate({ ...start, day: 15 }),
      };
    }
    if (start.day === 16) {
      return {
        periodStart: periodStartCivil,
        periodEnd: formatCivilDate(lastDayOfMonth(start.year, start.month)),
      };
    }
    throw new PreconditionFailedException(
      'Una quincena empieza el día 1 o el día 16 del mes',
    );
  }
  // MONTHLY
  if (start.day !== 1)
    throw new PreconditionFailedException('Un mes empieza el día 1');
  return {
    periodStart: periodStartCivil,
    periodEnd: formatCivilDate(lastDayOfMonth(start.year, start.month)),
  };
}

/**
 * Reconstruye la cadencia de un lote ya persistido a partir de su período
 * (la tabla reutilizada no tiene columna de cadencia). No se usa para
 * generar; sólo para mostrar un lote existente.
 */
export function inferSettlementCadence(
  periodStartCivil: string,
  periodEndCivil: string,
): SettlementCadence {
  const start = parseCivilDate(periodStartCivil);
  const end = parseCivilDate(periodEndCivil);
  if (addCivilDays(periodStartCivil, 6) === periodEndCivil) return 'WEEKLY';
  if (start.day === 1 && end.day === 15) return 'BIWEEKLY';
  if (
    start.day === 16 &&
    formatCivilDate(lastDayOfMonth(start.year, start.month)) === periodEndCivil
  )
    return 'BIWEEKLY';
  if (
    start.day === 1 &&
    formatCivilDate(lastDayOfMonth(start.year, start.month)) === periodEndCivil
  )
    return 'MONTHLY';
  throw new PreconditionFailedException(
    `No se pudo inferir la cadencia del período ${periodStartCivil}..${periodEndCivil}`,
  );
}

/**
 * `ALREADY_BATCHED` no aparece acá: un reclamo ya incluido en un lote
 * anterior no es un candidato de este corte nuevo, es invisible (ver el
 * comentario en el bucle principal de `selectSettlementClaims`).
 */
export type SettlementExclusionReason =
  | 'NOT_ADJUDICATED'
  | 'REVERSED'
  | 'EOB_NOT_PUBLISHED'
  | 'NOT_RECONCILED'
  | 'OUT_OF_PERIOD'
  | 'CURRENCY_MISMATCH';

export interface SettlementIncludedClaim {
  readonly claimId: string;
  readonly claimIdentifier: string;
  readonly adjudicationVersionId: string;
  readonly adjudicationVersion: number;
  readonly eobPublishedAt: Date;
  readonly totalBilledAmount: string;
  readonly totalApprovedAmount: string;
  readonly totalPatientAmount: string;
  readonly totalDeniedAmount: string;
  readonly exclusionsCount: number;
}

export interface SettlementExcludedClaim {
  readonly claimId: string;
  readonly claimIdentifier: string;
  readonly reason: SettlementExclusionReason;
}

export interface SettlementReversalAdjustment {
  readonly claimId: string;
  readonly claimIdentifier: string;
  readonly previousItemId: string;
  readonly adjustmentAmount: string;
}

export interface SettlementSelectionTotals {
  readonly totalBilledAmount: string;
  readonly totalApprovedAmount: string;
  readonly totalPatientAmount: string;
  readonly totalDeniedAmount: string;
  readonly totalReversalAdjustmentAmount: string;
}

export interface SettlementSelectionResult {
  readonly included: readonly SettlementIncludedClaim[];
  readonly excluded: readonly SettlementExcludedClaim[];
  readonly reversalAdjustments: readonly SettlementReversalAdjustment[];
  readonly totals: SettlementSelectionTotals;
  /** `null` cuando no hay ningún reclamo incluido (lote vacío, contrato §7). */
  readonly currencyConceptId: string | null;
}

/** Un reclamo ya incluido en un lote anterior del mismo par, para §10. */
export interface PreviouslyIncludedItem {
  readonly id: string;
  readonly expectedAmount: string;
}

export function selectSettlementClaims(params: {
  readonly claims: readonly InsuranceClaims[];
  readonly linesByClaimId: ReadonlyMap<string, readonly InsuranceClaimLines[]>;
  readonly currentVersionByClaimId: ReadonlyMap<
    string,
    ClaimAdjudicationVersions | undefined
  >;
  readonly adjudicationsByVersionId: ReadonlyMap<
    string,
    readonly ClaimLineAdjudications[]
  >;
  readonly eobByVersionId: ReadonlyMap<string, PatientExplanationsOfBenefit>;
  readonly reversedClaimIds: ReadonlySet<string>;
  /** Reclamos ya incluidos (`SETTLEMENT_ITEM_INCLUDED`) en CUALQUIER lote previo del par. */
  readonly previouslyIncludedItemByClaimId: ReadonlyMap<
    string,
    PreviouslyIncludedItem
  >;
  /** Reclamos que ya tienen su ajuste de reversión persistido (§10, no se ajusta dos veces). */
  readonly alreadyAdjustedClaimIds: ReadonlySet<string>;
  readonly period: { readonly periodStart: string; readonly periodEnd: string };
}): SettlementSelectionResult {
  const {
    claims,
    linesByClaimId,
    currentVersionByClaimId,
    adjudicationsByVersionId,
    eobByVersionId,
    reversedClaimIds,
    previouslyIncludedItemByClaimId,
    alreadyAdjustedClaimIds,
    period,
  } = params;

  const included: SettlementIncludedClaim[] = [];
  const excluded: SettlementExcludedClaim[] = [];
  const reversalAdjustments: SettlementReversalAdjustment[] = [];
  let currencyConceptId: string | null = null;
  // Medianoche del día siguiente al fin del período: el corte incluye toda
  // EOB publicada hasta el último instante de `periodEnd` inclusive.
  const periodUpperBoundExclusive = laPazMidnightUtc(
    addCivilDays(period.periodEnd, 1),
  );

  for (const claim of claims) {
    const previouslyIncluded = previouslyIncludedItemByClaimId.get(claim.id);
    if (previouslyIncluded) {
      // Ya salió en un lote anterior. Sólo vuelve a aparecer si se revirtió
      // después y todavía no tiene su ajuste (§10); si no, es invisible para
      // este corte nuevo — no es un candidato, ya se resolvió.
      if (
        reversedClaimIds.has(claim.id) &&
        !alreadyAdjustedClaimIds.has(claim.id)
      ) {
        reversalAdjustments.push({
          claimId: claim.id,
          claimIdentifier: claim.claimIdentifier,
          previousItemId: previouslyIncluded.id,
          adjustmentAmount: negate(previouslyIncluded.expectedAmount),
        });
      }
      continue;
    }

    if (reversedClaimIds.has(claim.id)) {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'REVERSED',
      });
      continue;
    }
    if (
      ![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)
    ) {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'NOT_ADJUDICATED',
      });
      continue;
    }

    const version = currentVersionByClaimId.get(claim.id);
    const lines = linesByClaimId.get(claim.id) ?? [];
    const adjudications = version
      ? (adjudicationsByVersionId.get(version.id) ?? [])
      : [];
    const eob = version ? eobByVersionId.get(version.id) : undefined;
    const breakdown = buildClaimSettlementBreakdown({
      claim,
      lines,
      version,
      adjudications,
      eob,
      reversed: false,
      itemNames: new Map(),
    });

    if (breakdown.availability === 'PENDING_PUBLICATION') {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'EOB_NOT_PUBLISHED',
      });
      continue;
    }
    if (breakdown.availability !== 'AVAILABLE') {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'NOT_RECONCILED',
      });
      continue;
    }
    // A partir de acá `eob` y `version` existen: lo garantiza AVAILABLE.
    const publishedAt = eob!.publishedAt!;
    if (publishedAt.getTime() >= periodUpperBoundExclusive.getTime()) {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'OUT_OF_PERIOD',
      });
      continue;
    }
    if (currencyConceptId === null) {
      currencyConceptId = claim.currencyConceptId ?? null;
    } else if ((claim.currencyConceptId ?? null) !== currencyConceptId) {
      excluded.push({
        claimId: claim.id,
        claimIdentifier: claim.claimIdentifier,
        reason: 'CURRENCY_MISMATCH',
      });
      continue;
    }

    included.push({
      claimId: claim.id,
      claimIdentifier: claim.claimIdentifier,
      adjudicationVersionId: version!.id,
      adjudicationVersion: version!.adjudicationVersion,
      eobPublishedAt: publishedAt,
      totalBilledAmount: breakdown.totalBilledAmount!,
      totalApprovedAmount: breakdown.totalApprovedAmount!,
      totalPatientAmount: breakdown.totalPatientAmount!,
      totalDeniedAmount: breakdown.totalDeniedAmount!,
      exclusionsCount: breakdown.exclusions.length,
    });
  }

  const totals: SettlementSelectionTotals = {
    totalBilledAmount:
      sumarDecimales(included.map((row) => row.totalBilledAmount)) ?? '0',
    totalApprovedAmount:
      sumarDecimales(included.map((row) => row.totalApprovedAmount)) ?? '0',
    totalPatientAmount:
      sumarDecimales(included.map((row) => row.totalPatientAmount)) ?? '0',
    totalDeniedAmount:
      sumarDecimales(included.map((row) => row.totalDeniedAmount)) ?? '0',
    totalReversalAdjustmentAmount:
      sumarDecimales(reversalAdjustments.map((row) => row.adjustmentAmount)) ??
      '0',
  };

  return { included, excluded, reversalAdjustments, totals, currencyConceptId };
}

/** Invierte el signo de un importe decimal exacto, sin pasar por `Number`. */
function negate(amount: string): string {
  const trimmed = amount.trim();
  if (mismosDecimales(trimmed, '0')) return trimmed;
  return trimmed.startsWith('-') ? trimmed.slice(1) : `-${trimmed}`;
}
