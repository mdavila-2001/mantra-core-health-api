import { Inject, Injectable } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../../common';
import {
  CLAIM_DECISION_PUBLISHER_PORT,
  type ClaimDecisionPublisherPort,
} from '../ports/claim-decision-publisher.port';
import {
  PATIENT_BILLING_PORT,
  type PatientBillingPort,
} from '../ports/patient-billing.port';
import {
  PATIENT_NOTICE_PORT,
  type PatientNoticeInput,
  type PatientNoticePort,
} from '../ports/patient-notice.port';
import {
  INSURANCE_PRACTICE_TENANT_LOOKUP_PORT,
  type InsurancePracticeTenantLookupPort,
} from '../ports/practice-tenant-lookup.port';
import {
  ClaimRepository,
  CoverageRepository,
} from '../../infrastructure/repositories';
import { claimBelongsToPractices } from '../../domain/claim-scope';
import { INS } from '../../domain/insurance.concepts';
import {
  enforcePatientBilling,
  PATIENT_BILLING_REASON,
} from '../../domain/patient-billing-enforcer';
import {
  CLAIM_AGGREGATE_TYPE,
  PATIENT_PROTECTION_EVENT,
} from '../../domain/patient-protection-events';
import type {
  IssuePatientInvoiceDto,
  PatientInvoiceIssuedDto,
} from '../../presentation/dto';
import { ClaimCoveragePolicy } from './claim-coverage-policy';
import {
  assertLegacyClaimRoles,
  claimAccessDenied,
} from './linked-claim-access.service';
import { PatientConsentValidator } from './patient-consent-validator';

/** Índice único que impide dos facturas para la misma línea del reclamo. */
const CLAIM_LINE_INVOICE_UNIQUE = 'uq_invoice_lines_insurance_claim_line_id';

type IssueOutcome =
  | {
      readonly kind: 'issued';
      readonly result: PatientInvoiceIssuedDto;
      readonly notice: PatientNoticeInput;
    }
  | {
      readonly kind: 'rejected';
      readonly reason: string;
      readonly message: string;
      readonly details: Readonly<Record<string, unknown>>;
      readonly claimLineId: string;
      readonly billedAmount: string | null;
    };

/**
 * Factura al paciente de un servicio reclamado a la aseguradora (carril 16,
 * REQ-16-028, 029, 030 y 034).
 *
 * Garantías, en el orden en que se aplican:
 * 1. **Un solo lock, y primero**: el reclamo se bloquea `FOR UPDATE`. Dos
 *    pedidos para el mismo reclamo se serializan acá, así que el segundo ve la
 *    factura del primero y se rechaza. No se toma ningún otro lock (ni de la
 *    aprobación previa ni de billing), por lo que no hay ciclo posible con el
 *    envío del reclamo.
 * 2. **El importe lo pone el servidor**: la parte del paciente calculada al
 *    enviar el reclamo (o, para un cobro particular, el monto completo con la
 *    aceptación previa del paciente). Lo que el cliente declare sólo se
 *    contrasta.
 * 3. **Pertenencia**: reclamo ajeno, línea de otro reclamo e inexistentes
 *    responden el mismo 403 sin detalles (no confirman qué ids existen).
 * 4. **Unicidad en la base**: `uq_invoice_lines_insurance_claim_line_id` es la
 *    red de seguridad de la comprobación previa; si algún escritor sin lock la
 *    dispara, el 409 genérico del filtro se convierte aquí en el 422 tipificado.
 *
 * Cada intento rechazado y cada factura emitida publican un evento tipificado
 * (REQ-16-034): `audit_log` no guarda motivo ni importes. Los payloads llevan
 * ids e importes, nunca texto clínico.
 */
@Injectable()
export class ClaimPatientInvoiceService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ClaimRepository,
    private readonly coverages: CoverageRepository,
    private readonly policy: ClaimCoveragePolicy,
    private readonly consent: PatientConsentValidator,
    @Inject(PATIENT_BILLING_PORT)
    private readonly billing: PatientBillingPort,
    @Inject(CLAIM_DECISION_PUBLISHER_PORT)
    private readonly publisher: ClaimDecisionPublisherPort,
    @Inject(INSURANCE_PRACTICE_TENANT_LOOKUP_PORT)
    private readonly practiceLookup: InsurancePracticeTenantLookupPort,
    @Inject(PATIENT_NOTICE_PORT)
    private readonly notices: PatientNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClaimPatientInvoiceService.name);
  }

  /**
   * @param claimId - Reclamo al que pertenece la línea.
   * @param dto - Línea a facturar y, opcionalmente, el importe que se mostró.
   * @param actor - Quien factura.
   * @returns La factura emitida y su desglose.
   * @throws ForbiddenException (mismo cuerpo) si el reclamo o la línea no son
   *   de la organización activa o no existen.
   * @throws PreconditionFailedException (422) con motivo tipificado.
   */
  async issue(
    claimId: string,
    dto: IssuePatientInvoiceDto,
    actor: AuthenticatedUser,
  ): Promise<PatientInvoiceIssuedDto> {
    assertLegacyClaimRoles(actor);
    const tenantId = requireTenantId();
    // El alcance se resuelve antes de abrir la transacción: quién factura es la
    // práctica que presentó el reclamo, y ese dato vive en `practice`.
    const practiceIds =
      await this.practiceLookup.findActivePracticeIdsForTenant(tenantId);
    if (practiceIds.length === 0) throw claimAccessDenied();

    let outcome: IssueOutcome;
    try {
      outcome = await this.em.transactional((tx) =>
        this.issueLocked(tx, claimId, dto, actor, tenantId, practiceIds),
      );
    } catch (error) {
      // La transacción ya está abortada: nada se ejecuta dentro de ella. El
      // intento rechazado se registra en una nueva, y la respuesta es el 422.
      if (!isClaimLineInvoiceViolation(error)) throw error;
      await this.publishRejected(tenantId, actor, claimId, {
        reason: PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED,
        claimLineId: dto.claimLineId,
        billedAmount: null,
        details: {},
      });
      throw alreadyIssued(dto.claimLineId);
    }

    if (outcome.kind === 'rejected') {
      await this.publishRejected(tenantId, actor, claimId, outcome);
      throw new PreconditionFailedException(outcome.message, {
        reason: outcome.reason,
        claimLineId: outcome.claimLineId,
        ...outcome.details,
      });
    }

    // Fuera de la transacción y sin poder fallar: la factura ya está guardada.
    await this.notices.notifyPatient(outcome.notice);
    return outcome.result;
  }

  /** Todo lo que corre con el reclamo bloqueado. */
  private async issueLocked(
    tx: EntityManager,
    claimId: string,
    dto: IssuePatientInvoiceDto,
    actor: AuthenticatedUser,
    tenantId: string,
    practiceIds: readonly string[],
  ): Promise<IssueOutcome> {
    const claim = await this.repo.findClaimForUpdate(tx, claimId);
    if (!claim || !claimBelongsToPractices(claim, practiceIds)) {
      throw claimAccessDenied();
    }
    const line = await this.repo.findLine(tx, dto.claimLineId);
    if (!line || line.insuranceClaimId !== claim.id) throw claimAccessDenied();
    const coverage = await this.coverages.findCoverage(
      tx,
      claim.patientCoverageId,
    );
    if (!coverage) throw claimAccessDenied();
    // El paciente sale del reclamo bloqueado, nunca del cuerpo de la petición.
    const patientProfileId = coverage.patientProfileId;

    const existingInvoice = await this.billing.findInvoiceLineByClaimLine(
      tx,
      line.id,
    );
    const alreadyInvoiced = existingInvoice !== null;
    const claimReversed = claim.statusConceptId === INS.CLAIM_REVERSED;

    // Condiciones del beneficio (porcentaje y copago) para el desglose. Además,
    // si el reclamo no guardó la parte del paciente (los reclamos vinculados
    // de farmacia y diagnóstico nunca la calcularon), se recotiza la línea al
    // momento del envío: la misma regla de REQ-16-025, sin lock.
    const quoted = await this.policy.quoteLine(
      tx,
      {
        planId: coverage.insurancePlanId,
        patientCoverageId: claim.patientCoverageId,
        priorAuthorizationRequestId: claim.priorAuthorizationRequestId ?? null,
        serviceRequestId: claim.serviceRequestId ?? null,
        inventoryReservationId: claim.inventoryReservationId ?? null,
        lines: [
          {
            lineSequence: line.lineSequence,
            serviceConceptId: line.serviceConceptId ?? null,
            billedAmount: line.billedAmount ?? '',
          },
        ],
        at: claim.submittedAt ?? new Date(),
      },
      {
        lineSequence: line.lineSequence,
        serviceConceptId: line.serviceConceptId ?? null,
        billedAmount: line.billedAmount ?? '',
      },
      new Map(),
    );
    const serverShare =
      line.patientResponsibilityAmount ??
      (quoted.reason === null ? quoted.patientAmount : null);

    // Cobro particular: sin parte calculada, hace falta la aceptación previa.
    const consent =
      serverShare === null && line.billedAmount
        ? await this.consent.check(tx, {
            patientProfileId,
            claimLineId: line.id,
            amount: line.billedAmount,
            at: new Date(),
          })
        : null;

    const decision = enforcePatientBilling({
      claimId: claim.id,
      claimReversed,
      claimLine: {
        id: line.id,
        insuranceClaimId: line.insuranceClaimId,
        billedAmount: line.billedAmount ?? null,
      },
      alreadyInvoiced,
      serverPatientShare: serverShare,
      declaredPatientAmount: dto.patientAmount ?? null,
      consent,
    });

    if (decision.kind === 'REJECT') {
      return {
        kind: 'rejected',
        reason: decision.reason,
        message: decision.message,
        details:
          existingInvoice &&
          decision.reason ===
            PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED
            ? { ...decision.details, invoiceId: existingInvoice.invoiceId }
            : decision.details,
        claimLineId: line.id,
        billedAmount: line.billedAmount ?? null,
      };
    }

    const issued = await this.billing.issuePatientInvoice(tx, {
      practiceId: claim.billingProviderEntityId,
      patientProfileId,
      currencyConceptId: claim.currencyConceptId ?? null,
      insuranceClaimLineId: line.id,
      description:
        dto.description ??
        (decision.chargeKind === 'INSURED_SHARE'
          ? 'Parte del paciente de un servicio con seguro'
          : 'Servicio particular sin cobertura del seguro'),
      amount: decision.amount,
      actorUserId: actor.id,
    });
    await this.publisher.publish(tx, {
      tenantId,
      eventType: PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_ISSUED,
      aggregateType: CLAIM_AGGREGATE_TYPE,
      aggregateId: claim.id,
      payloadJson: {
        claimId: claim.id,
        claimLineId: line.id,
        invoiceId: issued.invoiceId,
        invoiceLineId: issued.invoiceLineId,
        invoiceNumber: issued.invoiceNumber,
        patientProfileId,
        practiceId: claim.billingProviderEntityId,
        chargeKind: decision.chargeKind,
        billedAmount: decision.billedAmount,
        coveragePercent: quoted.coveragePercent,
        copayAmount: quoted.copayAmount,
        patientAmount: decision.amount,
        insurerAmount: decision.insurerAmount,
        currencyConceptId: claim.currencyConceptId ?? null,
        consent: decision.consent
          ? {
              acceptedAt: decision.consent.acceptedAt.toISOString(),
              acceptedByUserId: decision.consent.acceptedByUserId,
            }
          : null,
        actorUserId: actor.id,
      },
    });
    // Un único flush: línea de factura (con su vínculo único) y evento juntos.
    await tx.flush();

    this.logger.info(
      {
        operation: 'insurance.patient_invoice.issued',
        claimId: claim.id,
        claimLineId: line.id,
        invoiceId: issued.invoiceId,
        chargeKind: decision.chargeKind,
        actorId: actor.id,
      },
      'Patient invoice issued',
    );

    const result: PatientInvoiceIssuedDto = {
      invoiceId: issued.invoiceId,
      invoiceLineId: issued.invoiceLineId,
      invoiceNumber: issued.invoiceNumber,
      claimId: claim.id,
      claimLineId: line.id,
      chargeKind: decision.chargeKind,
      billedAmount: decision.billedAmount,
      coveragePercent: quoted.coveragePercent,
      copayAmount: quoted.copayAmount,
      patientAmount: decision.amount,
      insurerAmount: decision.insurerAmount,
      currencyConceptId: claim.currencyConceptId ?? null,
    };
    return {
      kind: 'issued',
      result,
      notice: {
        patientProfileId,
        subject: 'Se emitió un cobro a su nombre',
        bodyText:
          `Se le emitió una factura por ${decision.amount} por un servicio ` +
          `reclamado a su seguro (importe total ${decision.billedAmount}). ` +
          'Si no está de acuerdo, puede objetar el cobro.',
        destination: { type: 'INSURANCE_CLAIM', id: claim.id },
        debounceKey: `insurance:INSURANCE_CLAIM:${claim.id}:${line.id}:invoice`,
        tenantId,
        payloadJson: {
          claimId: claim.id,
          claimLineId: line.id,
          invoiceId: issued.invoiceId,
          chargeKind: decision.chargeKind,
          billedAmount: decision.billedAmount,
          coveragePercent: quoted.coveragePercent,
          copayAmount: quoted.copayAmount,
          patientAmount: decision.amount,
          insurerAmount: decision.insurerAmount,
        },
        actorUserId: actor.id,
      },
    };
  }

  /** Registra el intento rechazado en su propia transacción (REQ-16-034). */
  private async publishRejected(
    tenantId: string,
    actor: AuthenticatedUser,
    claimId: string,
    rejection: {
      readonly reason: string;
      readonly claimLineId: string;
      readonly billedAmount: string | null;
      readonly details: Readonly<Record<string, unknown>>;
    },
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      await this.publisher.publish(tx, {
        tenantId,
        eventType: PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_REJECTED,
        aggregateType: CLAIM_AGGREGATE_TYPE,
        aggregateId: claimId,
        payloadJson: {
          claimId,
          claimLineId: rejection.claimLineId,
          reason: rejection.reason,
          declaredPatientAmount:
            rejection.details.declaredPatientAmount ?? null,
          expectedPatientAmount:
            rejection.details.expectedPatientAmount ?? null,
          billedAmount: rejection.billedAmount,
          actorUserId: actor.id,
        },
      });
      await tx.flush();
    });
    this.logger.info(
      {
        operation: 'insurance.patient_invoice.rejected',
        claimId,
        claimLineId: rejection.claimLineId,
        reason: rejection.reason,
        actorId: actor.id,
      },
      'Patient invoice rejected',
    );
  }
}

function alreadyIssued(claimLineId: string): PreconditionFailedException {
  return new PreconditionFailedException(
    'Esta línea del reclamo ya fue facturada al paciente',
    {
      reason: PATIENT_BILLING_REASON.PATIENT_INVOICE_ALREADY_ISSUED,
      claimLineId,
    },
  );
}

/**
 * Si el error es la violación del índice único de la línea del reclamo.
 *
 * Se mira el **nombre de la restricción** y no sólo el tipo de excepción: la
 * misma excepción cubre también el número de factura repetido, que no es un
 * doble cobro y debe seguir saliendo como el 409 genérico.
 */
function isClaimLineInvoiceViolation(error: unknown): boolean {
  if (!(error instanceof UniqueConstraintViolationException)) return false;
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth += 1) {
    const candidate = current as { constraint?: unknown; cause?: unknown };
    if (typeof candidate.constraint === 'string') {
      return candidate.constraint === CLAIM_LINE_INVOICE_UNIQUE;
    }
    current = candidate.cause;
  }
  return error.message.includes(CLAIM_LINE_INVOICE_UNIQUE);
}
