import { Injectable } from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  mismosDecimales,
  sumarDecimales,
} from '../../../../common';
import {
  InsuranceClaimLines,
  InsuranceClaims,
  InsurancePlanBenefits,
  PriorAuthorizationDeterminations,
  PriorAuthorizationItems,
  PriorAuthorizationRequests,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import {
  CoverageSplitError,
  splitCoveredAmount,
} from '../../domain/coverage-split';

/**
 * Motivos tipificados por los que un cobro a la aseguradora no se acepta.
 * Viajan en `details.reason` del 422 para que la UI y la bitácora los
 * distingan sin parsear el mensaje.
 */
export const CLAIM_COVERAGE_REASON = {
  SERVICE_REQUIRED: 'CLAIM_LINE_SERVICE_REQUIRED',
  SERVICE_NOT_COVERED: 'SERVICE_NOT_COVERED',
  BENEFIT_AMBIGUOUS: 'BENEFIT_AMBIGUOUS',
  BENEFIT_WITHOUT_TERMS: 'BENEFIT_WITHOUT_TERMS',
  INVALID_AMOUNT: 'INVALID_CLAIM_AMOUNT',
  PRIOR_AUTH_REQUIRED: 'PRIOR_AUTHORIZATION_REQUIRED',
  PRIOR_AUTH_MISMATCH: 'PRIOR_AUTHORIZATION_MISMATCH',
  PRIOR_AUTH_PENDING: 'PRIOR_AUTHORIZATION_PENDING',
  PRIOR_AUTH_DENIED: 'PRIOR_AUTHORIZATION_DENIED',
  PRIOR_AUTH_EXPIRED: 'PRIOR_AUTHORIZATION_EXPIRED',
  PRIOR_AUTH_AMOUNT_EXCEEDED: 'PRIOR_AUTHORIZATION_AMOUNT_EXCEEDED',
  PATIENT_SHARE_MISMATCH: 'PATIENT_SHARE_MISMATCH',
} as const;

/** Lo que el cobro declara de cada línea. */
export interface ClaimLineToEvaluate {
  readonly lineSequence: number;
  readonly serviceConceptId?: string | null;
  readonly billedAmount: string;
  readonly patientResponsibilityAmount?: string | null;
}

/** El pedido que el cobro dice representar. */
export interface ClaimToEvaluate {
  readonly planId: string;
  readonly patientCoverageId: string;
  readonly priorAuthorizationRequestId?: string | null;
  readonly serviceRequestId?: string | null;
  readonly inventoryReservationId?: string | null;
  readonly lines: readonly ClaimLineToEvaluate[];
  /** Fecha contra la que se mira la vigencia del beneficio y de la aprobación. */
  readonly at: Date;
}

/** Línea ya contrastada con el plan: lo que se persiste sale de acá. */
export interface EvaluatedClaimLine {
  readonly lineSequence: number;
  readonly benefitId: string;
  readonly coveragePercent: string | null;
  readonly copayAmount: string | null;
  readonly requiresPriorAuthorization: boolean;
  readonly patientAmount: string;
  readonly insurerAmount: string;
}

/**
 * Contrasta un cobro con el plan del paciente (carril 16, REQ-16-023 a 025).
 *
 * El servidor —no el médico— decide, por línea:
 * 1. qué beneficio vigente del plan cubre el servicio (si ninguno, no se cobra
 *    a la aseguradora);
 * 2. si ese beneficio exige aprobación previa y, en ese caso, que la del cobro
 *    sea de esta cobertura, de este servicio, esté aprobada, vigente y alcance
 *    el monto;
 * 3. cuánto paga el paciente y cuánto la aseguradora (`splitCoveredAmount`). Si
 *    el cliente mandó otra parte del paciente, el cobro se rechaza: el valor del
 *    cliente nunca se guarda.
 *
 * Cada rechazo es un 422 con `details.reason` de {@link CLAIM_COVERAGE_REASON}.
 */
@Injectable()
export class ClaimCoveragePolicy {
  /**
   * @param tx - Transacción del caso de uso.
   * @param claim - Cobro a contrastar.
   * @returns Las líneas con el reparto calculado, en el mismo orden.
   * @throws PreconditionFailedException (422) con el motivo tipificado.
   */
  async evaluate(
    tx: EntityManager,
    claim: ClaimToEvaluate,
  ): Promise<EvaluatedClaimLine[]> {
    const evaluated: EvaluatedClaimLine[] = [];
    // Lo que este mismo cobro ya cargó contra cada ítem de la aprobación: dos
    // líneas no pueden repartirse un tope que cada una por separado no supera.
    const billedInThisClaim = new Map<string, string>();
    for (const line of claim.lines) {
      const benefit = await this.benefitFor(tx, claim, line);
      if (benefit.requiresPriorAuthorization) {
        await this.assertPriorAuthorization(tx, claim, line, billedInThisClaim);
      }
      const split = this.split(line, benefit);
      if (
        line.patientResponsibilityAmount != null &&
        !mismosDecimales(line.patientResponsibilityAmount, split.patientAmount)
      ) {
        throw reject(
          'El monto a cargo del paciente no coincide con la cobertura del plan',
          CLAIM_COVERAGE_REASON.PATIENT_SHARE_MISMATCH,
          line,
          {
            declaredPatientAmount: line.patientResponsibilityAmount,
            expectedPatientAmount: split.patientAmount,
          },
        );
      }
      evaluated.push({
        lineSequence: line.lineSequence,
        benefitId: benefit.id,
        coveragePercent: benefit.coveragePercent ?? null,
        copayAmount: benefit.copayAmount ?? null,
        requiresPriorAuthorization: Boolean(benefit.requiresPriorAuthorization),
        patientAmount: split.patientAmount,
        insurerAmount: split.insurerAmount,
      });
    }
    return evaluated;
  }

  /** El único beneficio vigente del plan para el servicio de la línea. */
  private async benefitFor(
    tx: EntityManager,
    claim: ClaimToEvaluate,
    line: ClaimLineToEvaluate,
  ): Promise<InsurancePlanBenefits> {
    if (!line.serviceConceptId) {
      throw reject(
        'Cada ítem del cobro debe indicar el servicio',
        CLAIM_COVERAGE_REASON.SERVICE_REQUIRED,
        line,
      );
    }
    const benefits = await tx.find(InsurancePlanBenefits, {
      insurancePlanId: claim.planId,
      serviceConceptId: line.serviceConceptId,
      statusConceptId: INS.BENEFIT_ACTIVE,
      effectiveFrom: { $lte: claim.at },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: claim.at } }],
    });
    if (benefits.length === 0) {
      throw reject(
        'El plan del paciente no cubre este servicio',
        CLAIM_COVERAGE_REASON.SERVICE_NOT_COVERED,
        line,
      );
    }
    if (benefits.length > 1) {
      // Dos beneficios vigentes para el mismo servicio: no se elige uno a ojo.
      throw reject(
        'El plan tiene más de una condición vigente para este servicio',
        CLAIM_COVERAGE_REASON.BENEFIT_AMBIGUOUS,
        line,
      );
    }
    return benefits[0];
  }

  /** Reparto paciente/aseguradora, traduciendo los fallos de dominio a 422. */
  private split(line: ClaimLineToEvaluate, benefit: InsurancePlanBenefits) {
    try {
      return splitCoveredAmount(line.billedAmount, {
        coveragePercent: benefit.coveragePercent ?? null,
        copayAmount: benefit.copayAmount ?? null,
      });
    } catch (error) {
      if (!(error instanceof CoverageSplitError)) throw error;
      if (error.failure === 'BENEFIT_WITHOUT_TERMS') {
        throw reject(
          'El plan no define cuánto cubre este servicio',
          CLAIM_COVERAGE_REASON.BENEFIT_WITHOUT_TERMS,
          line,
        );
      }
      throw reject(
        'El monto del ítem no es válido',
        CLAIM_COVERAGE_REASON.INVALID_AMOUNT,
        line,
      );
    }
  }

  /**
   * La aprobación previa del cobro cubre este servicio y está aprobada,
   * vigente y por un monto suficiente.
   *
   * El tope aprobado es acumulado: cuenta lo que ya se cobró con esa aprobación
   * en otros reclamos activos y en las líneas anteriores de este mismo cobro. La
   * fila de la aprobación se bloquea (`FOR UPDATE`) hasta el fin de la
   * transacción, así dos cobros simultáneos no pueden gastar el mismo saldo.
   */
  private async assertPriorAuthorization(
    tx: EntityManager,
    claim: ClaimToEvaluate,
    line: ClaimLineToEvaluate,
    billedInThisClaim: Map<string, string>,
  ): Promise<void> {
    if (!claim.priorAuthorizationRequestId) {
      throw reject(
        'Este servicio requiere aprobación previa de la aseguradora',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_REQUIRED,
        line,
      );
    }
    const request = await tx.findOne(
      PriorAuthorizationRequests,
      { id: claim.priorAuthorizationRequestId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    if (
      !request ||
      request.patientCoverageId !== claim.patientCoverageId ||
      (request.serviceRequestId ?? null) !== (claim.serviceRequestId ?? null) ||
      (request.inventoryReservationId ?? null) !==
        (claim.inventoryReservationId ?? null)
    ) {
      throw reject(
        'La aprobación previa no corresponde a esta cobertura y pedido',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
        line,
      );
    }
    const item = await tx.findOne(PriorAuthorizationItems, {
      priorAuthorizationRequestId: request.id,
      serviceConceptId: line.serviceConceptId,
    });
    if (!item) {
      throw reject(
        'La aprobación previa no incluye este servicio',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH,
        line,
      );
    }
    const determination = await this.latestDetermination(
      tx,
      request.id,
      item.id,
    );
    if (!determination) {
      throw reject(
        'La aprobación previa todavía no tiene respuesta de la aseguradora',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_PENDING,
        line,
      );
    }
    if (
      determination.decisionConceptId !== INS.DECISION_APPROVED &&
      determination.decisionConceptId !== INS.DECISION_PARTIAL
    ) {
      throw reject(
        'La aseguradora denegó la aprobación previa de este servicio',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED,
        line,
      );
    }
    const at = claim.at.getTime();
    if (
      (determination.validFrom && determination.validFrom.getTime() > at) ||
      (determination.validTo && determination.validTo.getTime() < at)
    ) {
      throw reject(
        'La aprobación previa no está vigente',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_EXPIRED,
        line,
      );
    }
    const earlierInClaim = billedInThisClaim.get(item.id) ?? '0';
    const cumulative =
      sumarDecimales([earlierInClaim, line.billedAmount]) ?? line.billedAmount;
    billedInThisClaim.set(item.id, cumulative);
    if (determination.approvedAmount == null) return;
    const billedBefore = await this.billedUnderAuthorization(
      tx,
      request.id,
      line.serviceConceptId!,
    );
    const total = sumarDecimales([billedBefore, cumulative]) ?? cumulative;
    if (exceeds(total, determination.approvedAmount)) {
      throw reject(
        'El monto supera lo que aprobó la aseguradora',
        CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED,
        line,
        {
          approvedAmount: determination.approvedAmount,
          alreadyBilledAmount: billedBefore,
          requestedTotalAmount: total,
        },
      );
    }
  }

  /**
   * Lo ya cobrado con esta aprobación, para este servicio, en reclamos que no
   * fueron revertidos.
   */
  private async billedUnderAuthorization(
    tx: EntityManager,
    requestId: string,
    serviceConceptId: string,
  ): Promise<string> {
    const claims = await tx.find(InsuranceClaims, {
      priorAuthorizationRequestId: requestId,
      statusConceptId: { $ne: INS.CLAIM_REVERSED },
    });
    if (claims.length === 0) return '0';
    const lines = await tx.find(InsuranceClaimLines, {
      insuranceClaimId: { $in: claims.map((claim) => claim.id) },
      serviceConceptId,
    });
    return sumarDecimales(lines.map((line) => line.billedAmount)) ?? '0';
  }

  /**
   * La última decisión sobre el ítem; si la aseguradora decidió sobre el pedido
   * entero (sin ítem), vale esa.
   */
  private async latestDetermination(
    tx: EntityManager,
    requestId: string,
    itemId: string,
  ): Promise<PriorAuthorizationDeterminations | null> {
    const forItem = await tx.findOne(
      PriorAuthorizationDeterminations,
      {
        priorAuthorizationRequestId: requestId,
        priorAuthorizationItemId: itemId,
      },
      { orderBy: { determinationVersion: 'desc' } },
    );
    if (forItem) return forItem;
    return tx.findOne(
      PriorAuthorizationDeterminations,
      {
        priorAuthorizationRequestId: requestId,
        priorAuthorizationItemId: null,
      },
      { orderBy: { determinationVersion: 'desc' } },
    );
  }
}

/** `amount > limit`, comparando montos decimales sin coma flotante. */
function exceeds(amount: string, limit: string): boolean {
  const scale = (text: string) => {
    const [whole, fraction = ''] = text.trim().split('.');
    return { whole, fraction };
  };
  const a = scale(amount);
  const b = scale(limit);
  const decimals = Math.max(a.fraction.length, b.fraction.length);
  const toInt = (part: { whole: string; fraction: string }) =>
    BigInt(`${part.whole}${part.fraction.padEnd(decimals, '0')}`);
  return toInt(a) > toInt(b);
}

function reject(
  message: string,
  reason: string,
  line: ClaimLineToEvaluate,
  extra: Record<string, unknown> = {},
): PreconditionFailedException {
  return new PreconditionFailedException(message, {
    reason,
    lineSequence: line.lineSequence,
    ...extra,
  });
}
