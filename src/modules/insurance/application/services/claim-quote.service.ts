import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  type AuthenticatedUser,
  PreconditionFailedException,
  requireTenantId,
  sumarDecimales,
} from '../../../../common';
import {
  CatalogRepository,
  CoverageRepository,
} from '../../infrastructure/repositories';
import type {
  ClaimQuoteDto,
  ClaimQuoteLineResultDto,
  ClaimQuoteResultDto,
} from '../../presentation/dto';
import {
  ClaimCoveragePolicy,
  type QuotedCoverageLine,
} from './claim-coverage-policy';
import {
  ClaimCareRelationshipGate,
  coverageNotFound,
} from './claim-care-relationship-gate';
import { assertLegacyClaimRoles } from './linked-claim-access.service';

/**
 * Cotización previa de un cobro a la aseguradora (carril 16, REQ-16-026).
 *
 * Responde, por línea, qué cubre el plan, cuánto paga cada parte, si hace falta
 * aprobación previa y en qué estado está. **No tiene efectos**: no abre una
 * transacción, no bloquea ninguna fila y no guarda nada. Las reglas son las
 * del cobro real porque delega en `ClaimCoveragePolicy.quoteLine`, que corre
 * los mismos pasos que `evaluate` sin lanzar ni bloquear.
 *
 * La puerta de acceso es la misma del envío directo del reclamo
 * (`assertLegacyClaimRoles`): quien puede cobrar puede cotizar, y nadie más.
 */
@Injectable()
export class ClaimQuoteService {
  constructor(
    private readonly em: EntityManager,
    private readonly coverage: CoverageRepository,
    private readonly catalog: CatalogRepository,
    private readonly policy: ClaimCoveragePolicy,
    private readonly careGate: ClaimCareRelationshipGate,
  ) {}

  /**
   * @param dto - Cobro a cotizar.
   * @param actor - Quien consulta.
   * @returns La cotización por línea y los totales.
   * @throws ForbiddenException si el rol no puede cobrar a la aseguradora.
   * @throws ResourceNotFoundException si la cobertura no existe o su paciente no
   *   tiene relación asistencial vigente con la organización activa (mismo 404).
   * @throws PreconditionFailedException 412 `TENANT_REQUIRED` sin organización activa.
   * @throws PreconditionFailedException si la cobertura no es de la aseguradora
   *   indicada o las secuencias de línea se repiten.
   */
  async quote(
    dto: ClaimQuoteDto,
    actor: AuthenticatedUser,
  ): Promise<ClaimQuoteResultDto> {
    assertLegacyClaimRoles(actor);
    if (
      new Set(dto.lines.map((line) => line.lineSequence)).size !==
      dto.lines.length
    ) {
      throw new PreconditionFailedException(
        'Las secuencias de líneas deben ser únicas',
      );
    }

    // Lectura pura: un contexto propio, sin transacción.
    const em = this.em.fork();
    const coverage = await this.coverage.findCoverage(
      em,
      dto.patientCoverageId,
    );
    if (!coverage) throw coverageNotFound();
    // Misma puerta que el cobro real: sin relación asistencial vigente con la
    // organización activa, la cotización responde como si la cobertura no
    // existiera (no hay un `reason` por línea que delate coberturas ajenas).
    await this.careGate.assertCareRelationship(
      em,
      coverage,
      requireTenantId(),
      new Date(),
    );
    const plan = await this.catalog.findPlanForCarrier(
      em,
      coverage.insurancePlanId,
      dto.insuranceCarrierId,
    );
    if (!plan) {
      throw new PreconditionFailedException(
        'La cobertura no corresponde a la aseguradora indicada',
      );
    }

    const toQuote = {
      planId: plan.id,
      patientCoverageId: dto.patientCoverageId,
      priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
      lines: dto.lines,
      at: new Date(),
    };
    // Las líneas se cotizan en orden y comparten el acumulado de la aprobación:
    // dos líneas no pueden repartirse un tope que cada una sola no supera.
    const billedInThisQuote = new Map<string, string>();
    const quoted: QuotedCoverageLine[] = [];
    for (const line of dto.lines) {
      quoted.push(
        await this.policy.quoteLine(em, toQuote, line, billedInThisQuote),
      );
    }

    const lines = dto.lines.map((line, index) =>
      toLineResult(line, quoted[index]),
    );
    return {
      canSubmit: lines.every((line) => line.reason === null),
      currencyConceptId: plan.currencyConceptId ?? null,
      totalBilledAmount: sumOrNull(dto.lines.map((line) => line.billedAmount)),
      totalPatientAmount: sumOrNull(lines.map((line) => line.patientAmount)),
      totalInsurerAmount: sumOrNull(lines.map((line) => line.insurerAmount)),
      lines,
    };
  }
}

function toLineResult(
  line: ClaimQuoteDto['lines'][number],
  quoted: QuotedCoverageLine,
): ClaimQuoteLineResultDto {
  return {
    lineSequence: quoted.lineSequence,
    serviceConceptId: line.serviceConceptId ?? null,
    billedAmount: line.billedAmount,
    covered: quoted.benefitId !== null && quoted.patientAmount !== null,
    coveragePercent: quoted.coveragePercent,
    copayAmount: quoted.copayAmount,
    deductibleAmount: quoted.deductibleAmount,
    requiresPriorAuthorization: quoted.requiresPriorAuthorization,
    priorAuthorizationStatus: quoted.priorAuthorizationStatus,
    patientAmount: quoted.patientAmount,
    insurerAmount: quoted.insurerAmount,
    reason: quoted.reason,
    message: quoted.message,
  };
}

/**
 * Suma decimal exacta, o `null` si falta un importe o alguno no es decimal.
 *
 * `null` es una respuesta válida de la cotización («todavía no se puede
 * calcular»); un `RangeError` por un monto mal escrito no debe volverse un 500.
 */
function sumOrNull(amounts: ReadonlyArray<string | null>): string | null {
  if (amounts.some((amount) => amount === null)) return null;
  try {
    return sumarDecimales(amounts);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
}
