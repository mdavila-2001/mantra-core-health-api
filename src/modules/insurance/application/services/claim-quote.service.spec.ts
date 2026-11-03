import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../../common';
import { InsurancePlanBenefits, PatientCoverages } from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import { ClaimCareRelationshipGate } from './claim-care-relationship-gate';
import { ClaimCoveragePolicy } from './claim-coverage-policy';
import { ClaimQuoteService } from './claim-quote.service';

/**
 * Cotización previa del cobro (carril 16, REQ-16-026): mismo gate que el envío
 * directo, mismas reglas que el cobro real y ningún efecto.
 */

const fn = () => jest.fn<(...args: any[]) => any>();
const PLAN = 'plan-1';
const TENANT = '11111111-1111-4111-8111-111111111111';
const PATIENT = 'patient-1';
const CONSULT = 'service-consult';
const SURGERY = 'service-surgery';

const consultBenefit = {
  id: 'benefit-consult',
  insurancePlanId: PLAN,
  serviceConceptId: CONSULT,
  statusConceptId: INS.BENEFIT_ACTIVE,
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: null,
  coveragePercent: '80',
  copayAmount: '50.00',
  deductibleAmount: '25.00',
  requiresPriorAuthorization: false,
};
const surgeryBenefit = {
  ...consultBenefit,
  id: 'benefit-surgery',
  serviceConceptId: SURGERY,
  coveragePercent: '90',
  copayAmount: null,
  requiresPriorAuthorization: true,
};

function build(
  options: {
    benefits?: Record<string, unknown>[];
    coverage?: unknown;
    hasCareRelationship?: boolean;
  } = {},
) {
  const benefits = options.benefits ?? [consultBenefit];
  const forked = {
    find: fn().mockImplementation(async (entity: unknown, filter: any) =>
      entity === InsurancePlanBenefits
        ? benefits.filter(
            (benefit) => benefit.serviceConceptId === filter.serviceConceptId,
          )
        : [],
    ),
    // La política relee la cobertura del cobro (PatientCoverages): es del plan.
    findOne: fn().mockImplementation(async (entity: unknown) =>
      entity === PatientCoverages
        ? { id: 'coverage-1', insurancePlanId: PLAN }
        : null,
    ),
    flush: fn(),
  };
  const em = { fork: fn().mockReturnValue(forked), transactional: fn() };
  const coverage = {
    findCoverage: fn().mockResolvedValue(
      options.coverage === undefined
        ? { id: 'coverage-1', insurancePlanId: PLAN, patientProfileId: PATIENT }
        : options.coverage,
    ),
  };
  // La puerta es la real; sólo el puerto hacia `authz` es un doble.
  const careRelationships = {
    hasCareRelationshipForPayment: fn().mockResolvedValue(
      options.hasCareRelationship ?? true,
    ),
  };
  const catalog = {
    findPlanForCarrier: fn().mockResolvedValue({
      id: PLAN,
      currencyConceptId: 'BOB',
    }),
  };
  const raw = new ClaimQuoteService(
    em as never,
    coverage as never,
    catalog as never,
    new ClaimCoveragePolicy(),
    new ClaimCareRelationshipGate(careRelationships as never),
  );
  // La cotización se pide dentro de la organización activa, como lo deja el interceptor.
  const service = {
    quote: (dto: never, actor: never) =>
      runWithTenant(TENANT, () => raw.quote(dto, actor)),
  };
  return { service, raw, em, forked, coverage, catalog, careRelationships };
}

const billing = { id: 'u-billing', roles: ['BILLING'] } as never;

const line = (
  lineSequence: number,
  serviceConceptId: string | undefined,
  billedAmount: string,
  extra: Record<string, unknown> = {},
) => ({ lineSequence, serviceConceptId, billedAmount, ...extra });

const quoteDto = (lines: unknown[], extra: Record<string, unknown> = {}) =>
  ({
    insuranceCarrierId: 'carrier-1',
    patientCoverageId: 'coverage-1',
    lines,
    ...extra,
  }) as never;

describe('ClaimQuoteService', () => {
  describe('quién puede cotizar', () => {
    it.each([['PATIENT'], ['PRACTITIONER'], ['CLINICIAN'], ['USER']])(
      'rechaza a %s antes de leer nada',
      async (role) => {
        const { service, coverage, em } = build();
        await expect(
          service.quote(quoteDto([line(1, CONSULT, '500.00')]), {
            id: 'u-1',
            roles: [role],
          } as never),
        ).rejects.toThrow('Rol insuficiente para la operación');
        expect(coverage.findCoverage).not.toHaveBeenCalled();
        expect(em.fork).not.toHaveBeenCalled();
      },
    );

    it.each([['BILLING'], ['FINANCE'], ['SUPERADMIN']])(
      'deja pasar a %s',
      async (role) => {
        const { service } = build();
        const result = await service.quote(
          quoteDto([line(1, CONSULT, '500.00')]),
          { id: 'u-1', roles: [role] } as never,
        );
        expect(result.canSubmit).toBe(true);
      },
    );

    it('un actor sin roles tampoco', async () => {
      const { service } = build();
      await expect(
        service.quote(quoteDto([line(1, CONSULT, '500.00')]), {
          id: 'u-1',
        } as never),
      ).rejects.toThrow('Rol insuficiente');
    });
  });

  describe('paridad de errores con el envío del reclamo', () => {
    it('cobertura inexistente → 404', async () => {
      const { service } = build({ coverage: null });
      await expect(
        service.quote(quoteDto([line(1, CONSULT, '500.00')]), billing),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('paciente sin relación asistencial vigente con la organización → el mismo 404 que una cobertura inexistente', async () => {
      const unrelated = build({ hasCareRelationship: false });
      const missing = build({ coverage: null });
      const dto = quoteDto([line(1, CONSULT, '500.00')]);
      const a: any = await unrelated.service
        .quote(dto, billing)
        .catch((e: unknown) => e);
      const b: any = await missing.service
        .quote(dto, billing)
        .catch((e: unknown) => e);
      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(a.getStatus()).toBe(b.getStatus());
      expect(a.getResponse()).toEqual(b.getResponse());
      // Corre antes de hablar de la aseguradora y del plan.
      expect(unrelated.catalog.findPlanForCarrier).not.toHaveBeenCalled();
    });

    it('la relación se pregunta por el paciente de la cobertura y la organización del contexto', async () => {
      const { service, careRelationships, forked } = build();
      await service.quote(quoteDto([line(1, CONSULT, '500.00')]), billing);
      expect(
        careRelationships.hasCareRelationshipForPayment,
      ).toHaveBeenCalledWith(forked, {
        patientProfileId: PATIENT,
        tenantId: TENANT,
        at: expect.any(Date),
      });
    });

    it('sin organización activa → 412 y no se consulta la relación', async () => {
      const { raw, careRelationships } = build();
      await expect(
        raw.quote(quoteDto([line(1, CONSULT, '500.00')]), billing),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        careRelationships.hasCareRelationshipForPayment,
      ).not.toHaveBeenCalled();
    });

    it('plan que no es de la aseguradora indicada → 422', async () => {
      const { service, catalog } = build();
      catalog.findPlanForCarrier.mockResolvedValue(null);
      await expect(
        service.quote(quoteDto([line(1, CONSULT, '500.00')]), billing),
      ).rejects.toThrow(
        'La cobertura no corresponde a la aseguradora indicada',
      );
    });

    it('secuencias de línea repetidas → 422 antes de leer la cobertura', async () => {
      const { service, coverage } = build();
      await expect(
        service.quote(
          quoteDto([line(1, CONSULT, '500.00'), line(1, CONSULT, '100.00')]),
          billing,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(coverage.findCoverage).not.toHaveBeenCalled();
    });
  });

  describe('sin efectos', () => {
    it('no abre transacción ni escribe: sólo un contexto de lectura', async () => {
      const { service, em, forked } = build();
      await service.quote(quoteDto([line(1, CONSULT, '500.00')]), billing);
      expect(em.fork).toHaveBeenCalledTimes(1);
      expect(em.transactional).not.toHaveBeenCalled();
      expect(forked.flush).not.toHaveBeenCalled();
      // `findOne` sin opciones de lock: ni siquiera con aprobación previa.
      for (const call of forked.findOne.mock.calls) {
        expect(call[2]).toBeUndefined();
      }
    });
  });

  describe('resultado', () => {
    it('500 Bs, copago 50, 80 % → paciente 140 y aseguradora 360', async () => {
      const { service } = build();
      const result = await service.quote(
        quoteDto([line(1, CONSULT, '500.00')]),
        billing,
      );
      expect(result).toEqual({
        canSubmit: true,
        currencyConceptId: 'BOB',
        totalBilledAmount: '500.00',
        totalPatientAmount: '140.00',
        totalInsurerAmount: '360.00',
        lines: [
          {
            lineSequence: 1,
            serviceConceptId: CONSULT,
            billedAmount: '500.00',
            covered: true,
            coveragePercent: '80',
            copayAmount: '50.00',
            deductibleAmount: '25.00',
            requiresPriorAuthorization: false,
            priorAuthorizationStatus: 'NOT_REQUIRED',
            patientAmount: '140.00',
            insurerAmount: '360.00',
            reason: null,
            message: null,
          },
        ],
      });
    });

    it('ignora la parte del paciente que manda el cliente', async () => {
      const { service } = build();
      const result = await service.quote(
        quoteDto([
          line(1, CONSULT, '500.00', { patientResponsibilityAmount: '1.00' }),
        ]),
        billing,
      );
      expect(result.lines[0].patientAmount).toBe('140.00');
      expect(result.canSubmit).toBe(true);
    });

    it('servicio sin beneficio: no se puede enviar y los totales del reparto son null', async () => {
      const { service } = build({ benefits: [] });
      const result = await service.quote(
        quoteDto([line(1, CONSULT, '500.00')]),
        billing,
      );
      expect(result).toMatchObject({
        canSubmit: false,
        totalBilledAmount: '500.00',
        totalPatientAmount: null,
        totalInsurerAmount: null,
      });
      expect(result.lines[0]).toMatchObject({
        covered: false,
        patientAmount: null,
        reason: 'SERVICE_NOT_COVERED',
      });
    });

    it('aprobación previa exigida y ausente: informa el reparto pero no se puede enviar', async () => {
      const { service } = build({ benefits: [surgeryBenefit] });
      const result = await service.quote(
        quoteDto([line(1, SURGERY, '1000.00')]),
        billing,
      );
      expect(result.canSubmit).toBe(false);
      expect(result.lines[0]).toMatchObject({
        covered: true,
        requiresPriorAuthorization: true,
        priorAuthorizationStatus: 'MISSING',
        reason: 'PRIOR_AUTHORIZATION_REQUIRED',
        patientAmount: '100.00',
        insurerAmount: '900.00',
      });
      expect(result.totalPatientAmount).toBe('100.00');
    });

    it('con una línea cubierta y otra no, el total facturado suma pero el reparto es null', async () => {
      const { service } = build();
      const result = await service.quote(
        quoteDto([
          line(1, CONSULT, '500.00'),
          line(2, 'service-other', '30.50'),
        ]),
        billing,
      );
      expect(result.totalBilledAmount).toBe('530.50');
      expect(result.totalPatientAmount).toBeNull();
      expect(result.canSubmit).toBe(false);
    });

    it('suma el reparto de varias líneas sin coma flotante', async () => {
      const { service } = build();
      const result = await service.quote(
        quoteDto([line(1, CONSULT, '500.00'), line(2, CONSULT, '33.33')]),
        billing,
      );
      // 33.33 → copago 50 ≥ monto: paga todo el paciente.
      expect(result.totalPatientAmount).toBe('173.33');
      expect(result.totalInsurerAmount).toBe('360.00');
      expect(result.totalBilledAmount).toBe('533.33');
    });

    it('un monto mal escrito no es un 500: total null y motivo tipificado', async () => {
      const { service } = build();
      const result = await service.quote(
        quoteDto([line(1, CONSULT, '.5')]),
        billing,
      );
      expect(result.totalBilledAmount).toBeNull();
      expect(result.canSubmit).toBe(false);
      expect(result.lines[0].reason).toBe('INVALID_CLAIM_AMOUNT');
    });
  });
});
