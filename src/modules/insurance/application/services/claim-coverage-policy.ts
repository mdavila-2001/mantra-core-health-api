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

/** Estado de la aprobación previa tal como lo muestra la cotización. */
export type PriorAuthorizationQuoteStatus =
  | 'NOT_REQUIRED'
  | 'APPROVED'
  | 'MISSING'
  | 'PENDING'
  | 'DENIED'
  | 'EXPIRED'
  | 'MISMATCH'
  | 'AMOUNT_EXCEEDED';

/**
 * Línea cotizada (carril 16, REQ-16-026): lo mismo que `EvaluatedClaimLine`,
 * pero un rechazo no se lanza, se informa en `reason` y `message`.
 *
 * Los importes son `null` cuando no se pueden calcular (servicio sin beneficio
 * vigente, beneficio sin condiciones o monto inválido). Si sólo falla la
 * aprobación previa, el reparto sí se informa.
 */
export interface QuotedCoverageLine {
  readonly lineSequence: number;
  readonly benefitId: string | null;
  readonly coveragePercent: string | null;
  readonly copayAmount: string | null;
  /** Informativo: el propietario dejó el deducible fuera del cálculo. */
  readonly deductibleAmount: string | null;
  readonly requiresPriorAuthorization: boolean;
  readonly priorAuthorizationStatus: PriorAuthorizationQuoteStatus | null;
  readonly patientAmount: string | null;
  readonly insurerAmount: string | null;
  readonly reason: string | null;
  readonly message: string | null;
}

const PRIOR_AUTH_STATUS_BY_REASON: Readonly<
  Record<string, PriorAuthorizationQuoteStatus>
> = {
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_REQUIRED]: 'MISSING',
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_MISMATCH]: 'MISMATCH',
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_PENDING]: 'PENDING',
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_DENIED]: 'DENIED',
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_EXPIRED]: 'EXPIRED',
  [CLAIM_COVERAGE_REASON.PRIOR_AUTH_AMOUNT_EXCEEDED]: 'AMOUNT_EXCEEDED',
};

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
        await this.assertPriorAuthorization(
          tx,
          claim,
          line,
          billedInThisClaim,
          true,
        );
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

  /**
   * Cotiza una línea sin efectos: no bloquea la aprobación previa y no lanza.
   *
   * Corre las mismas reglas que `evaluate` (beneficio vigente, reparto y
   * aprobación previa) y el mismo orden de precedencia entre rechazos; cada
   * rechazo tipificado se devuelve en `reason`/`message`. La parte del paciente
   * que declare el cliente no se contrasta: la cotización sólo informa.
   *
   * @param em - Contexto de lectura; no hace falta una transacción.
   * @param claim - Cobro que se quiere cotizar.
   * @param line - Línea a cotizar.
   * @param billedInThisClaim - Acumulado por aprobación de las líneas anteriores.
   * @returns La línea con su reparto y, si corresponde, el motivo del rechazo.
   */
  async quoteLine(
    em: EntityManager,
    claim: ClaimToEvaluate,
    line: ClaimLineToEvaluate,
    billedInThisClaim: Map<string, string>,
  ): Promise<QuotedCoverageLine> {
    let benefit: InsurancePlanBenefits;
    try {
      benefit = await this.benefitFor(em, claim, line);
    } catch (error) {
      const rejection = asRejection(error);
      return {
        lineSequence: line.lineSequence,
        benefitId: null,
        coveragePercent: null,
        copayAmount: null,
        deductibleAmount: null,
        requiresPriorAuthorization: false,
        priorAuthorizationStatus: null,
        patientAmount: null,
        insurerAmount: null,
        reason: rejection.reason,
        message: rejection.message,
      };
    }

    const requiresPriorAuthorization = Boolean(
      benefit.requiresPriorAuthorization,
    );
    let split: { patientAmount: string; insurerAmount: string } | null = null;
    let splitRejection: QuoteRejection | null = null;
    try {
      split = this.split(line, benefit);
    } catch (error) {
      splitRejection = asRejection(error);
    }

    let priorAuthorizationStatus: PriorAuthorizationQuoteStatus =
      'NOT_REQUIRED';
    let priorAuthorizationRejection: QuoteRejection | null = null;
    if (requiresPriorAuthorization) {
      try {
        await this.assertPriorAuthorization(
          em,
          claim,
          line,
          billedInThisClaim,
          false,
        );
        priorAuthorizationStatus = 'APPROVED';
      } catch (error) {
        priorAuthorizationRejection = asRejection(error);
        priorAuthorizationStatus =
          PRIOR_AUTH_STATUS_BY_REASON[priorAuthorizationRejection.reason] ??
          'MISMATCH';
      }
    }

    // Misma precedencia que `evaluate`: la aprobación previa se rechaza antes
    // que el reparto.
    const rejection = priorAuthorizationRejection ?? splitRejection;
    return {
      lineSequence: line.lineSequence,
      benefitId: benefit.id,
      coveragePercent: benefit.coveragePercent ?? null,
      copayAmount: benefit.copayAmount ?? null,
      deductibleAmount: benefit.deductibleAmount ?? null,
      requiresPriorAuthorization,
      priorAuthorizationStatus,
      patientAmount: split?.patientAmount ?? null,
      insurerAmount: split?.insurerAmount ?? null,
      reason: rejection?.reason ?? null,
      message: rejection?.message ?? null,
    };
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
   * Con `lock = false` (cotización) sólo se lee: no hay transacción que bloquee.
   */
  private async assertPriorAuthorization(
    tx: EntityManager,
    claim: ClaimToEvaluate,
    line: ClaimLineToEvaluate,
    billedInThisClaim: Map<string, string>,
    lock: boolean,
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
      lock ? { lockMode: LockMode.PESSIMISTIC_WRITE } : undefined,
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
    // El tope vale para lo que la aseguradora decidió: el ítem, o el pedido
    // entero si la decisión no nombra un ítem. Una decisión de pedido es un solo
    // saldo para todos sus servicios.
    const requestLevel = determination.priorAuthorizationItemId == null;
    const scopeKey = requestLevel ? `request:${request.id}` : `item:${item.id}`;
    const earlierInClaim = billedInThisClaim.get(scopeKey) ?? '0';
    const cumulative =
      sumarDecimales([earlierInClaim, line.billedAmount]) ?? line.billedAmount;
    billedInThisClaim.set(scopeKey, cumulative);
    if (determination.approvedAmount == null) return;
    const billedBefore = await this.billedUnderAuthorization(
      tx,
      request.id,
      requestLevel ? null : line.serviceConceptId!,
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
   * Lo ya cobrado con esta aprobación en reclamos que no fueron revertidos: para
   * un servicio si la decisión es por ítem, o para todo el pedido si
   * `serviceConceptId` es `null`.
   */
  private async billedUnderAuthorization(
    tx: EntityManager,
    requestId: string,
    serviceConceptId: string | null,
  ): Promise<string> {
    const claims = await tx.find(InsuranceClaims, {
      priorAuthorizationRequestId: requestId,
      statusConceptId: { $ne: INS.CLAIM_REVERSED },
    });
    if (claims.length === 0) return '0';
    const lines = await tx.find(InsuranceClaimLines, {
      insuranceClaimId: { $in: claims.map((claim) => claim.id) },
      ...(serviceConceptId ? { serviceConceptId } : {}),
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

/** Rechazo tipificado capturado por la cotización. */
interface QuoteRejection {
  readonly reason: string;
  readonly message: string;
}

/**
 * Convierte el 422 tipificado de la política en datos. Todo lo que no sea un
 * rechazo de negocio con motivo (un fallo de la base, por ejemplo) se relanza.
 */
function asRejection(error: unknown): QuoteRejection {
  if (error instanceof PreconditionFailedException) {
    const reason = error.details?.reason;
    if (typeof reason === 'string') {
      return { reason, message: error.message };
    }
  }
  throw error;
}
