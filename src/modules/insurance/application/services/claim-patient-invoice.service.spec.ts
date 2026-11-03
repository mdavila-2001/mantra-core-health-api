import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import { PreconditionFailedException, runWithTenant } from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import { PATIENT_PROTECTION_EVENT } from '../../domain/patient-protection-events';
import { ClaimPatientInvoiceService } from './claim-patient-invoice.service';
import { PatientConsentValidator } from './patient-consent-validator';

/**
 * Factura al paciente de un servicio reclamado (carril 16, REQ-16-028, 029,
 * 030 y 034): lock del reclamo primero, importe del servidor, un solo cobro y
 * un evento tipificado por cada intento. Colaboradores como dobles: la
 * concurrencia real contra PostgreSQL la prueba el spec de integración.
 */

const fn = () => jest.fn<(...args: any[]) => any>();
const TENANT = 'tenant-1';
const PRACTICE = 'practice-1';
const CLAIM = 'claim-1';
const LINE = 'line-1';
const PATIENT = 'patient-1';
const NO_ACCESS = 'No hay acceso a esa solicitud de seguro';

const baseClaim = () => ({
  id: CLAIM,
  statusConceptId: INS.CLAIM_SUBMITTED,
  patientCoverageId: 'coverage-1',
  billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
  billingProviderEntityId: PRACTICE,
  priorAuthorizationRequestId: null,
  serviceRequestId: null,
  inventoryReservationId: null,
  currencyConceptId: 'BOB',
  submittedAt: new Date('2026-10-20T10:00:00Z'),
});

const baseLine = () => ({
  id: LINE,
  insuranceClaimId: CLAIM,
  lineSequence: 1,
  serviceConceptId: 'service-consult',
  billedAmount: '500.00',
  patientResponsibilityAmount: '140.00',
});

const coveredQuote = {
  lineSequence: 1,
  benefitId: 'benefit-1',
  coveragePercent: '80',
  copayAmount: '50.00',
  deductibleAmount: null,
  requiresPriorAuthorization: false,
  priorAuthorizationStatus: 'NOT_REQUIRED',
  patientAmount: '140.00',
  insurerAmount: '360.00',
  reason: null,
  message: null,
};

const notCoveredQuote = {
  lineSequence: 1,
  benefitId: null,
  coveragePercent: null,
  copayAmount: null,
  deductibleAmount: null,
  requiresPriorAuthorization: false,
  priorAuthorizationStatus: null,
  patientAmount: null,
  insurerAmount: null,
  reason: 'SERVICE_NOT_COVERED',
  message: 'El plan del paciente no cubre este servicio',
};

function build(
  overrides: {
    claim?: Record<string, unknown> | null;
    line?: Record<string, unknown> | null;
    practiceIds?: string[];
    quote?: Record<string, unknown>;
    acceptance?: {
      acceptedAmount: string;
      acceptedAt: Date;
      acceptedByUserId: string;
    } | null;
  } = {},
) {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const em = {
    transactional: fn().mockImplementation((work: (t: unknown) => unknown) =>
      work(tx),
    ),
  };
  const repo = {
    findClaimForUpdate: fn().mockResolvedValue(
      overrides.claim === undefined ? baseClaim() : overrides.claim,
    ),
    findLine: fn().mockResolvedValue(
      overrides.line === undefined ? baseLine() : overrides.line,
    ),
  };
  const coverages = {
    findCoverage: fn().mockResolvedValue({
      patientProfileId: PATIENT,
      insurancePlanId: 'plan-1',
    }),
  };
  const policy = {
    quoteLine: fn().mockResolvedValue(overrides.quote ?? coveredQuote),
  };
  const acceptances = {
    findLatestAcceptance: fn().mockResolvedValue(overrides.acceptance ?? null),
  };
  const billing = {
    findInvoiceLineByClaimLine: fn().mockResolvedValue(null),
    issuePatientInvoice: fn().mockResolvedValue({
      invoiceId: 'invoice-1',
      invoiceLineId: 'invoice-line-1',
      invoiceNumber: 'INV-1',
    }),
  };
  const publisher = { publish: fn().mockResolvedValue(undefined) };
  const practiceLookup = {
    findActivePracticeIdsForTenant: fn().mockResolvedValue(
      overrides.practiceIds ?? [PRACTICE],
    ),
  };
  const notices = { notifyPatient: fn().mockResolvedValue(undefined) };
  const logger = { setContext: fn(), info: fn(), error: fn() };
  const service = new ClaimPatientInvoiceService(
    em as never,
    repo as never,
    coverages as never,
    policy as never,
    new PatientConsentValidator(acceptances as never),
    billing as never,
    publisher as never,
    practiceLookup as never,
    notices as never,
    logger as never,
  );
  return {
    service,
    em,
    tx,
    repo,
    coverages,
    policy,
    acceptances,
    billing,
    publisher,
    practiceLookup,
    notices,
    logger,
  };
}

const biller = { id: 'user-billing', roles: ['BILLING'] } as never;

const issue = (
  service: ClaimPatientInvoiceService,
  dto: Record<string, unknown> = {},
  actor: never = biller,
) =>
  runWithTenant(TENANT, () =>
    service.issue(CLAIM, { claimLineId: LINE, ...dto } as never, actor),
  );

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un error y la operación terminó bien');
}

const reasonOf = (error: unknown) =>
  (error as PreconditionFailedException).details?.reason;

const publishedEvents = (publisher: {
  publish: { mock: { calls: any[][] } };
}) =>
  publisher.publish.mock.calls.map((call) => call[1] as Record<string, any>);

const uniqueViolation = (constraint: string) =>
  new UniqueConstraintViolationException(
    Object.assign(new Error(`duplicate key value violates "${constraint}"`), {
      code: '23505',
      constraint,
    }) as never,
  );

describe('ClaimPatientInvoiceService', () => {
  describe('con seguro: la parte del paciente la pone el servidor', () => {
    it('500 Bs, copago 50, 80 % → factura 140 vinculada a la línea', async () => {
      const { service, billing } = build();
      const result = await issue(service);
      expect(billing.issuePatientInvoice).toHaveBeenCalledTimes(1);
      expect(billing.issuePatientInvoice.mock.calls[0][1]).toMatchObject({
        practiceId: PRACTICE,
        patientProfileId: PATIENT,
        currencyConceptId: 'BOB',
        insuranceClaimLineId: LINE,
        amount: '140.00',
        actorUserId: 'user-billing',
      });
      expect(result).toEqual({
        invoiceId: 'invoice-1',
        invoiceLineId: 'invoice-line-1',
        invoiceNumber: 'INV-1',
        claimId: CLAIM,
        claimLineId: LINE,
        chargeKind: 'INSURED_SHARE',
        billedAmount: '500.00',
        coveragePercent: '80',
        copayAmount: '50.00',
        patientAmount: '140.00',
        insurerAmount: '360.00',
        currencyConceptId: 'BOB',
      });
    });

    it('el paciente sale del reclamo bloqueado, no del cuerpo de la petición', async () => {
      const { service, billing } = build();
      await issue(service, { patientProfileId: 'otro-paciente' });
      expect(
        billing.issuePatientInvoice.mock.calls[0][1].patientProfileId,
      ).toBe(PATIENT);
    });

    it('la confirmación del importe mostrado, si coincide, pasa', async () => {
      const { service } = build();
      const result = await issue(service, { patientAmount: '140' });
      expect(result.patientAmount).toBe('140.00');
    });

    it('un reclamo directo no consulta aceptaciones: sólo pide las condiciones del beneficio', async () => {
      const { service, acceptances, policy } = build();
      await issue(service);
      expect(acceptances.findLatestAcceptance).not.toHaveBeenCalled();
      expect(policy.quoteLine).toHaveBeenCalledTimes(1);
    });
  });

  describe('orden de bloqueo y alcance', () => {
    it('el reclamo se bloquea antes de leer facturas o emitir', async () => {
      const { service, repo, billing } = build();
      await issue(service);
      const lock = repo.findClaimForUpdate.mock.invocationCallOrder[0];
      const lookup =
        billing.findInvoiceLineByClaimLine.mock.invocationCallOrder[0];
      const create = billing.issuePatientInvoice.mock.invocationCallOrder[0];
      expect(lock).toBeLessThan(lookup);
      expect(lookup).toBeLessThan(create);
    });

    it.each([['PATIENT'], ['PRACTITIONER'], ['CLINICIAN']])(
      '%s no puede facturar: 403 antes de leer nada',
      async (role) => {
        const { service, practiceLookup, repo } = build();
        await expect(
          issue(service, {}, { id: 'u', roles: [role] } as never),
        ).rejects.toThrow('Rol insuficiente para la operación');
        expect(
          practiceLookup.findActivePracticeIdsForTenant,
        ).not.toHaveBeenCalled();
        expect(repo.findClaimForUpdate).not.toHaveBeenCalled();
      },
    );

    it('sin organización activa no factura', async () => {
      const { service } = build();
      await expect(
        service.issue(CLAIM, { claimLineId: LINE } as never, biller),
      ).rejects.toThrow();
    });

    it('organización sin prácticas activas → 403 sin detalles', async () => {
      const { service, repo } = build({ practiceIds: [] });
      const error = await failure(issue(service));
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as Error).message).toBe(NO_ACCESS);
      expect(repo.findClaimForUpdate).not.toHaveBeenCalled();
    });

    it('reclamo de otra práctica, reclamo inexistente y línea ajena responden el mismo 403', async () => {
      const foreign = build({ practiceIds: ['otra-practica'] });
      const missing = build({ claim: null });
      const otherLine = build({
        line: { ...baseLine(), insuranceClaimId: 'otro-reclamo' },
      });
      const noLine = build({ line: null });
      const responses = await Promise.all(
        [foreign, missing, otherLine, noLine].map((ctx) =>
          failure(issue(ctx.service)),
        ),
      );
      for (const error of responses) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as Error).message).toBe(NO_ACCESS);
        expect((error as ForbiddenException).getResponse()).toEqual(
          (responses[0] as ForbiddenException).getResponse(),
        );
      }
      for (const ctx of [foreign, missing, otherLine, noLine]) {
        expect(ctx.billing.issuePatientInvoice).not.toHaveBeenCalled();
        expect(ctx.publisher.publish).not.toHaveBeenCalled();
        expect(ctx.notices.notifyPatient).not.toHaveBeenCalled();
      }
    });

    it('un reclamo de un tipo de facturador distinto de práctica no es de la organización', async () => {
      const { service } = build({
        claim: { ...baseClaim(), billingProviderTypeConceptId: 'otro-tipo' },
      });
      const error = await failure(issue(service));
      expect((error as Error).message).toBe(NO_ACCESS);
    });
  });

  describe('rechazos tipificados', () => {
    it('el cliente declara el monto completo de un servicio reclamado → 422 y evento con importes', async () => {
      const { service, billing, em, publisher } = build();
      const error = await failure(issue(service, { patientAmount: '500.00' }));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).details).toMatchObject({
        reason: 'PATIENT_INVOICE_AMOUNT_MISMATCH',
        claimLineId: LINE,
        declaredPatientAmount: '500.00',
        expectedPatientAmount: '140.00',
      });
      expect(billing.issuePatientInvoice).not.toHaveBeenCalled();
      // El rechazo se registra en su propia transacción: la del intento ya terminó.
      expect(em.transactional).toHaveBeenCalledTimes(2);
      const [event] = publishedEvents(publisher);
      expect(event).toMatchObject({
        tenantId: TENANT,
        eventType: PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_REJECTED,
        aggregateType: 'insurance.insurance_claims',
        aggregateId: CLAIM,
      });
      expect(event.payloadJson).toEqual({
        claimId: CLAIM,
        claimLineId: LINE,
        reason: 'PATIENT_INVOICE_AMOUNT_MISMATCH',
        declaredPatientAmount: '500.00',
        expectedPatientAmount: '140.00',
        billedAmount: '500.00',
        actorUserId: 'user-billing',
      });
    });

    it('línea ya facturada → 422 con la factura existente y sin emitir otra', async () => {
      const { service, billing, publisher } = build();
      billing.findInvoiceLineByClaimLine.mockResolvedValue({
        invoiceId: 'invoice-previa',
        invoiceLineId: 'line-previa',
      });
      const error = await failure(issue(service));
      expect(reasonOf(error)).toBe('PATIENT_INVOICE_ALREADY_ISSUED');
      expect((error as PreconditionFailedException).details).toMatchObject({
        invoiceId: 'invoice-previa',
      });
      expect(billing.issuePatientInvoice).not.toHaveBeenCalled();
      expect(publishedEvents(publisher)[0].eventType).toBe(
        PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_REJECTED,
      );
    });

    it('reclamo revertido → 422', async () => {
      const { service, billing } = build({
        claim: { ...baseClaim(), statusConceptId: INS.CLAIM_REVERSED },
      });
      const error = await failure(issue(service));
      expect(reasonOf(error)).toBe('CLAIM_REVERSED_NO_PATIENT_CHARGE');
      expect(billing.issuePatientInvoice).not.toHaveBeenCalled();
    });

    it('un rechazo no avisa al paciente', async () => {
      const { service, notices } = build();
      await failure(issue(service, { patientAmount: '1.00' }));
      expect(notices.notifyPatient).not.toHaveBeenCalled();
    });
  });

  describe('carrera: el índice único como red de seguridad', () => {
    it('violación del índice de la línea del reclamo → 422, no el 409 genérico', async () => {
      const { service, billing, publisher } = build();
      billing.issuePatientInvoice.mockRejectedValue(
        uniqueViolation('uq_invoice_lines_insurance_claim_line_id'),
      );
      const error = await failure(issue(service));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).details).toMatchObject({
        reason: 'PATIENT_INVOICE_ALREADY_ISSUED',
        claimLineId: LINE,
      });
      const [event] = publishedEvents(publisher);
      expect(event.eventType).toBe(
        PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_REJECTED,
      );
      expect(event.payloadJson.reason).toBe('PATIENT_INVOICE_ALREADY_ISSUED');
    });

    it('la violación sale también si el nombre viaja en la causa', async () => {
      const { service, billing } = build();
      const wrapped = new UniqueConstraintViolationException(
        Object.assign(new Error('duplicate'), {
          cause: { constraint: 'uq_invoice_lines_insurance_claim_line_id' },
        }) as never,
      );
      billing.issuePatientInvoice.mockRejectedValue(wrapped);
      const error = await failure(issue(service));
      expect(reasonOf(error)).toBe('PATIENT_INVOICE_ALREADY_ISSUED');
    });

    it('otra violación única (número de factura) se relanza intacta: sigue siendo 409', async () => {
      const { service, billing, publisher } = build();
      const other = uniqueViolation('uq_invoices_invoice_number');
      billing.issuePatientInvoice.mockRejectedValue(other);
      await expect(issue(service)).rejects.toBe(other);
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('un error cualquiera de la base no se disfraza de doble cobro', async () => {
      const { service, billing } = build();
      billing.issuePatientInvoice.mockRejectedValue(
        new Error('connection reset'),
      );
      await expect(issue(service)).rejects.toThrow('connection reset');
    });
  });

  describe('reclamos vinculados (sin parte persistida)', () => {
    const linkedLine = () => ({
      ...baseLine(),
      patientResponsibilityAmount: undefined,
    });

    it('se recotiza la línea al momento del envío y se usa la parte calculada', async () => {
      const { service, billing, policy } = build({ line: linkedLine() });
      const result = await issue(service);
      expect(policy.quoteLine).toHaveBeenCalledTimes(1);
      expect(policy.quoteLine.mock.calls[0][1].at).toEqual(
        baseClaim().submittedAt,
      );
      expect(billing.issuePatientInvoice.mock.calls[0][1].amount).toBe(
        '140.00',
      );
      expect(result.chargeKind).toBe('INSURED_SHARE');
    });

    it('servicio no cubierto sin aceptación del paciente → 422 de consentimiento', async () => {
      const { service, billing, acceptances } = build({
        line: linkedLine(),
        quote: notCoveredQuote,
      });
      const error = await failure(issue(service));
      expect((error as PreconditionFailedException).details).toMatchObject({
        reason: 'PATIENT_CONSENT_REQUIRED',
        consent: 'MISSING',
        expectedPatientAmount: '500.00',
      });
      expect(acceptances.findLatestAcceptance).toHaveBeenCalledWith(
        expect.anything(),
        { patientProfileId: PATIENT, claimLineId: LINE },
      );
      expect(billing.issuePatientInvoice).not.toHaveBeenCalled();
    });

    it('servicio no cubierto con aceptación previa por el mismo importe → cobro particular por el total', async () => {
      const acceptedAt = new Date('2026-10-20T09:00:00Z');
      const { service, billing, publisher } = build({
        line: linkedLine(),
        quote: notCoveredQuote,
        acceptance: {
          acceptedAmount: '500.00',
          acceptedAt,
          acceptedByUserId: 'user-patient',
        },
      });
      const result = await issue(service);
      expect(result).toMatchObject({
        chargeKind: 'PRIVATE_FULL',
        patientAmount: '500.00',
        insurerAmount: '0.00',
      });
      expect(billing.issuePatientInvoice.mock.calls[0][1].amount).toBe(
        '500.00',
      );
      const [event] = publishedEvents(publisher);
      expect(event.payloadJson.consent).toEqual({
        acceptedAt: acceptedAt.toISOString(),
        acceptedByUserId: 'user-patient',
      });
    });

    it('aceptación por otro importe → 422 informando el importe aceptado', async () => {
      const { service } = build({
        line: linkedLine(),
        quote: notCoveredQuote,
        acceptance: {
          acceptedAmount: '300.00',
          acceptedAt: new Date('2026-10-20T09:00:00Z'),
          acceptedByUserId: 'user-patient',
        },
      });
      const error = await failure(issue(service));
      expect((error as PreconditionFailedException).details).toMatchObject({
        reason: 'PATIENT_CONSENT_REQUIRED',
        consent: 'AMOUNT_DIFFERS',
        acceptedAmount: '300.00',
      });
    });
  });

  describe('trazabilidad (REQ-16-034)', () => {
    it('publica la factura emitida con importes e ids y nada más', async () => {
      const { service, publisher, tx } = build();
      await issue(service);
      const events = publishedEvents(publisher);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        tenantId: TENANT,
        eventType: PATIENT_PROTECTION_EVENT.PATIENT_INVOICE_ISSUED,
        aggregateType: 'insurance.insurance_claims',
        aggregateId: CLAIM,
      });
      expect(Object.keys(events[0].payloadJson).sort()).toEqual(
        [
          'actorUserId',
          'billedAmount',
          'chargeKind',
          'claimId',
          'claimLineId',
          'consent',
          'copayAmount',
          'coveragePercent',
          'currencyConceptId',
          'insurerAmount',
          'invoiceId',
          'invoiceLineId',
          'invoiceNumber',
          'patientAmount',
          'patientProfileId',
          'practiceId',
        ].sort(),
      );
      expect(events[0].payloadJson).toMatchObject({
        patientAmount: '140.00',
        insurerAmount: '360.00',
        billedAmount: '500.00',
        consent: null,
      });
      // El evento y la factura se confirman con el mismo flush.
      expect(tx.flush).toHaveBeenCalled();
    });

    it('avisa al paciente sólo después de confirmar la transacción', async () => {
      const { service, em, notices } = build();
      const order: string[] = [];
      em.transactional.mockImplementation(async (work: any) => {
        const value = await work({ flush: async () => undefined });
        order.push('commit');
        return value;
      });
      notices.notifyPatient.mockImplementation(async () => {
        order.push('notice');
      });
      await issue(service);
      expect(order).toEqual(['commit', 'notice']);
      expect(notices.notifyPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          patientProfileId: PATIENT,
          destination: { type: 'INSURANCE_CLAIM', id: CLAIM },
          tenantId: TENANT,
          actorUserId: 'user-billing',
        }),
      );
    });

    it('el aviso lleva el desglose y habla de usted', async () => {
      const { service, notices } = build();
      await issue(service);
      const notice = notices.notifyPatient.mock.calls[0][0];
      expect(notice.bodyText).toContain('140.00');
      expect(notice.bodyText).toContain('500.00');
      expect(notice.bodyText).toMatch(/Se le emitió/);
      expect(notice.payloadJson).toMatchObject({
        patientAmount: '140.00',
        insurerAmount: '360.00',
      });
    });

    it('los logs llevan identificadores, no importes ni datos de la persona', async () => {
      const { service, logger } = build();
      await issue(service);
      const logged = JSON.stringify(logger.info.mock.calls);
      expect(logged).toContain(CLAIM);
      expect(logged).not.toContain('140.00');
      expect(logged).not.toContain('500.00');
    });
  });
});
