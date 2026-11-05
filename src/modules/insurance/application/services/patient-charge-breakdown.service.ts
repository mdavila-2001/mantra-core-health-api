import { Injectable } from '@nestjs/common';
import { EntityManager, QueryOrder } from '@mikro-orm/postgresql';
import { ClaimReadRepository } from '../../infrastructure/repositories';
import {
  ClaimDisputes,
  InsuranceClaimLines,
  InsuranceClaims,
  PatientCoverages,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import type { PatientObjectionReason } from '../../presentation/dto';
import type {
  MyClaimBreakdownDto,
  MyClaimBreakdownLineDto,
  MyClaimObjectionDto,
} from '../../presentation/dto/my-claims.dto';
import { ClaimCoveragePolicy } from './claim-coverage-policy';

/**
 * Cuántas solicitudes, de las más recientes, llevan desglose. Cada línea se
 * cotiza contra el beneficio del plan (varias lecturas), así que el desglose
 * no se arma para las 500 que puede devolver la lista: las que quedan afuera
 * traen `breakdown: null` y la pantalla lo dice.
 */
export const BREAKDOWN_CLAIM_LIMIT = 50;

/** Lo que este servicio agrega a cada solicitud de la vista del paciente. */
export interface PatientChargeExtras {
  readonly breakdown: MyClaimBreakdownDto | null;
  readonly patientObjection: MyClaimObjectionDto | null;
}

/** Motivo guardado en la disputa → motivo cerrado que se le muestra. */
const REASON_BY_CONCEPT = new Map<string, PatientObjectionReason>([
  [INS.DISPUTE_REASON_CHARGE_AMOUNT, 'AMOUNT_DIFFERS'],
  [INS.DISPUTE_REASON_SERVICE_NOT_RECEIVED, 'SERVICE_NOT_RECEIVED'],
  [INS.DISPUTE_REASON_NOT_INFORMED, 'NOT_INFORMED'],
]);

const DECIMAL = /^\d+(\.\d+)?$/;

/**
 * El desglose del cobro y la objeción del paciente para «Mis solicitudes»
 * (carril 16, REQ-16-031 y REQ-16-032).
 *
 * **Lo calcula el servidor, el front no recalcula.** Cada línea se cotiza con
 * la misma regla del cobro (`ClaimCoveragePolicy.quoteLine`), con la fecha en
 * que se envió el reclamo, y el reparto sale de ahí: por eso es el mismo que
 * mostró la cotización y el que se facturó. Una línea sin beneficio en el plan
 * es un cobro particular: la persona paga el total y la aseguradora, nada.
 *
 * Solo lo pide la vista del paciente, que ya acotó las solicitudes a las de
 * sus propias coberturas. No lee nada fuera de esas solicitudes.
 */
@Injectable()
export class PatientChargeBreakdownService {
  constructor(
    private readonly policy: ClaimCoveragePolicy,
    private readonly claimReadRepo: ClaimReadRepository,
  ) {}

  /**
   * @param em - Contexto de lectura.
   * @param claims - Solicitudes del titular, de la más reciente a la más antigua.
   * @returns El desglose y la objeción por id de solicitud.
   */
  async read(
    em: EntityManager,
    claims: readonly InsuranceClaims[],
  ): Promise<Map<string, PatientChargeExtras>> {
    const result = new Map<string, PatientChargeExtras>();
    if (claims.length === 0) return result;
    const claimIds = claims.map((claim) => claim.id);

    const [coverages, lines, disputes] = await Promise.all([
      em.find(PatientCoverages, {
        id: { $in: unique(claims.map((claim) => claim.patientCoverageId)) },
      }),
      em.find(
        InsuranceClaimLines,
        { insuranceClaimId: { $in: claimIds } },
        { orderBy: { lineSequence: QueryOrder.ASC } },
      ),
      em.find(
        ClaimDisputes,
        {
          insuranceClaimId: { $in: claimIds },
          disputeTypeConceptId: INS.DISPUTE_TYPE_PATIENT_OBJECTION,
        },
        { orderBy: { submittedAt: QueryOrder.DESC } },
      ),
    ]);
    const planOf = new Map(
      coverages.map((coverage) => [coverage.id, coverage.insurancePlanId]),
    );
    const concepts = await this.conceptNames(em, [
      ...lines.map((line) => line.serviceConceptId),
      ...claims.map((claim) => claim.currencyConceptId),
    ]);
    const linesOf = groupBy(lines, (line) => line.insuranceClaimId);
    const objectionOf = new Map<string, MyClaimObjectionDto>();
    for (const dispute of disputes) {
      const reason = REASON_BY_CONCEPT.get(dispute.disputeReasonConceptId);
      // La primera por claim es la más reciente (orden descendente).
      if (reason === undefined || objectionOf.has(dispute.insuranceClaimId)) {
        continue;
      }
      objectionOf.set(dispute.insuranceClaimId, {
        id: dispute.id,
        reason,
        submittedAt: (dispute.submittedAt ?? dispute.createdAt).toISOString(),
        status:
          dispute.statusConceptId === INS.DISPUTE_OPEN ? 'OPEN' : 'RESOLVED',
      });
    }

    for (const [index, claim] of claims.entries()) {
      const planId = planOf.get(claim.patientCoverageId);
      const claimLines = linesOf.get(claim.id) ?? [];
      const breakdown =
        index < BREAKDOWN_CLAIM_LIMIT &&
        planId !== undefined &&
        claimLines.length > 0
          ? await this.breakdownOf(em, claim, planId, claimLines, concepts)
          : null;
      result.set(claim.id, {
        breakdown,
        patientObjection: objectionOf.get(claim.id) ?? null,
      });
    }
    return result;
  }

  /** El desglose de una solicitud: una cotización por línea, con la fecha del envío. */
  private async breakdownOf(
    em: EntityManager,
    claim: InsuranceClaims,
    planId: string,
    claimLines: readonly InsuranceClaimLines[],
    concepts: ReadonlyMap<string, { code: string; display: string }>,
  ): Promise<MyClaimBreakdownDto> {
    const at = claim.submittedAt ?? new Date();
    // Las líneas comparten el acumulado de la aprobación previa, como al cotizar.
    const billedInThisClaim = new Map<string, string>();
    const toEvaluate = claimLines.map((line) => ({
      lineSequence: line.lineSequence,
      serviceConceptId: line.serviceConceptId ?? null,
      billedAmount: decimalOr(line.billedAmount, '0.00'),
    }));
    const rows: MyClaimBreakdownLineDto[] = [];
    for (const [index, line] of claimLines.entries()) {
      const evaluated = toEvaluate[index];
      const billed = evaluated.billedAmount;
      const quoted = await this.policy.quoteLine(
        em,
        {
          planId,
          patientCoverageId: claim.patientCoverageId,
          priorAuthorizationRequestId:
            claim.priorAuthorizationRequestId ?? null,
          serviceRequestId: claim.serviceRequestId ?? null,
          inventoryReservationId: claim.inventoryReservationId ?? null,
          lines: toEvaluate,
          at,
        },
        evaluated,
        billedInThisClaim,
      );
      const service =
        concepts.get(line.serviceConceptId ?? '')?.display ?? 'Servicio';
      const stored = decimalOr(line.patientResponsibilityAmount, null);
      const split =
        quoted.patientAmount !== null && quoted.insurerAmount !== null;
      if (split || stored !== null) {
        const patientAmount = split ? quoted.patientAmount : stored!;
        rows.push({
          key: line.id,
          service,
          billedAmount: billed,
          coveragePercent: quoted.coveragePercent ?? '0',
          copayAmount: quoted.copayAmount ?? '0.00',
          patientAmount,
          insurerAmount: split
            ? quoted.insurerAmount
            : minusDecimals(billed, patientAmount),
          chargeKind: 'INSURED_SHARE',
          authorizationStatus: quoted.priorAuthorizationStatus,
        });
      } else {
        rows.push({
          key: line.id,
          service,
          billedAmount: billed,
          coveragePercent: '0',
          copayAmount: '0.00',
          patientAmount: billed,
          insurerAmount: '0.00',
          chargeKind: 'PRIVATE_FULL',
          authorizationStatus: null,
        });
      }
    }
    return {
      currencyCode: concepts.get(claim.currencyConceptId ?? '')?.code ?? null,
      patientTotal: sumDecimals(rows.map((row) => row.patientAmount)),
      insurerTotal: sumDecimals(rows.map((row) => row.insurerAmount)),
      lines: rows,
    };
  }

  private async conceptNames(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<Map<string, { code: string; display: string }>> {
    const concepts = await this.claimReadRepo.findConceptsByIds(
      em,
      unique(ids),
    );
    return new Map(
      concepts.map((concept) => [
        concept.id,
        { code: concept.code, display: concept.display },
      ]),
    );
  }
}

/** Quita nulos y repetidos. */
function unique(ids: ReadonlyArray<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function groupBy<T>(
  items: readonly T[],
  key: (item: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const group = groups.get(key(item)) ?? [];
    group.push(item);
    groups.set(key(item), group);
  }
  return groups;
}

/** La cadena si es un decimal no negativo; si no, el valor de respaldo. */
function decimalOr<F extends string | null>(
  value: string | null | undefined,
  fallback: F,
): string | F {
  return value != null && DECIMAL.test(value.trim()) ? value.trim() : fallback;
}

/** Escala común (mínimo dos decimales) y valor entero de cada cadena. */
function scaled(values: readonly string[]): { scale: number; ints: bigint[] } {
  const scale = Math.max(
    2,
    ...values.map((v) => (v.split('.')[1] ?? '').length),
  );
  const ints = values.map((v) => {
    const [whole, fraction = ''] = v.split('.');
    return BigInt(whole + fraction.padEnd(scale, '0'));
  });
  return { scale, ints };
}

function format(value: bigint, scale: number): string {
  const negative = value < 0n;
  const digits = (negative ? -value : value)
    .toString()
    .padStart(scale + 1, '0');
  return `${negative ? '-' : ''}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

/** Resta decimal exacta (nunca `Number`). */
export function minusDecimals(a: string, b: string): string {
  const { scale, ints } = scaled([a, b]);
  return format(ints[0] - ints[1], scale);
}

/** Suma decimal exacta (nunca `Number`). */
export function sumDecimals(values: readonly string[]): string {
  if (values.length === 0) return '0.00';
  const { scale, ints } = scaled(values);
  return format(
    ints.reduce((total, value) => total + value, 0n),
    scale,
  );
}
