import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { PreconditionFailedException } from '../../../../common';
import { INS } from '../../domain/insurance.concepts';
import { PATIENT_PROTECTION_EVENT } from '../../domain/patient-protection-events';
import { PatientChargeObjectionService } from './patient-charge-objection.service';

/**
 * Objeción del paciente a un cobro (carril 16, REQ-16-032 y 034): propiedad
 * por el puerto, idempotencia bajo el lock del reclamo, motivo cerrado y un
 * evento tipificado sin texto libre. Colaboradores como dobles.
 */

const fn = () => jest.fn<(...args: any[]) => any>();
const CLAIM = 'claim-1';
const PATIENT = 'patient-1';
const PRACTICE = 'practice-1';
const TENANT = 'tenant-1';
const NO_ACCESS = 'No hay acceso a esa solicitud de seguro';

const baseClaim = () => ({
  id: CLAIM,
  statusConceptId: INS.CLAIM_ADJUDICATED,
  patientCoverageId: 'coverage-1',
  billingProviderEntityId: PRACTICE,
  insuranceCarrierId: 'carrier-1',
});

function build(
  overrides: {
    claim?: Record<string, unknown> | null;
    coverage?: Record<string, unknown> | null;
    existing?: Record<string, unknown> | null;
    tenant?: string | null;
    ownershipError?: Error;
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
    findOpenDispute: fn().mockResolvedValue(overrides.existing ?? null),
    createDispute: fn().mockImplementation((_tx: unknown, data: any) => ({
      id: 'dispute-1',
      createdAt: new Date('2026-10-24T12:00:00Z'),
      ...data,
    })),
  };
  const coverages = {
    findCoverage: fn().mockResolvedValue(
      overrides.coverage === undefined
        ? { patientProfileId: PATIENT }
        : overrides.coverage,
    ),
  };
  const ownership = {
    assertOwnsPatientProfile: fn().mockImplementation(async () => {
      if (overrides.ownershipError) throw overrides.ownershipError;
    }),
  };
  const publisher = { publish: fn().mockResolvedValue(undefined) };
  const practiceLookup = {
    findTenantOfPractice: fn().mockResolvedValue(
      overrides.tenant === undefined ? TENANT : overrides.tenant,
    ),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };
  const service = new PatientChargeObjectionService(
    em as never,
    repo as never,
    coverages as never,
    ownership as never,
    publisher as never,
    practiceLookup as never,
    logger as never,
  );
  return {
    service,
    em,
    tx,
    repo,
    coverages,
    ownership,
    publisher,
    practiceLookup,
    logger,
  };
}

const patient = { id: 'user-patient', roles: ['PATIENT'] } as never;
const body = (extra: Record<string, unknown> = {}) =>
  ({ initiatedBy: 'PATIENT', ...extra }) as never;

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un error y la operación terminó bien');
}

const events = (publisher: { publish: { mock: { calls: any[][] } } }) =>
  publisher.publish.mock.calls.map((call) => call[1] as Record<string, any>);

describe('PatientChargeObjectionService', () => {
  describe('abre la objeción', () => {
    it('crea una disputa de tipo objeción, iniciada por el paciente, sin plazo', async () => {
      const { service, repo } = build();
      const result = await service.object(CLAIM, body(), patient);
      expect(repo.createDispute).toHaveBeenCalledTimes(1);
      expect(repo.createDispute.mock.calls[0][1]).toEqual({
        insuranceClaimId: CLAIM,
        disputeTypeConceptId: INS.DISPUTE_TYPE_PATIENT_OBJECTION,
        disputeReasonConceptId: INS.DISPUTE_REASON_NOT_INFORMED,
        initiatedByPartyTypeConceptId: INS.PARTY_PATIENT,
        initiatedByEntityId: PATIENT,
        submittedAt: expect.any(Date),
        statusConceptId: INS.DISPUTE_OPEN,
        actorUserId: 'user-patient',
      });
      expect(result).toEqual({
        id: 'dispute-1',
        status: INS.DISPUTE_OPEN,
        createdAt: new Date('2026-10-24T12:00:00Z'),
      });
    });

    it.each([
      ['AMOUNT_DIFFERS', INS.DISPUTE_REASON_CHARGE_AMOUNT],
      ['SERVICE_NOT_RECEIVED', INS.DISPUTE_REASON_SERVICE_NOT_RECEIVED],
      ['NOT_INFORMED', INS.DISPUTE_REASON_NOT_INFORMED],
    ])(
      'el motivo %s se guarda como su concepto',
      async (objectionReason, concept) => {
        const { service, repo } = build();
        await service.object(CLAIM, body({ objectionReason }), patient);
        expect(repo.createDispute.mock.calls[0][1].disputeReasonConceptId).toBe(
          concept,
        );
      },
    );

    it('lo que diga el cuerpo sobre la parte, el plazo o la entidad no cuenta', async () => {
      const { service, repo } = build();
      await service.object(
        CLAIM,
        body({
          initiatedBy: 'PROVIDER',
          initiatedByEntityId: 'otro',
          filingDeadline: '2026-12-31',
        }),
        patient,
      );
      expect(repo.createDispute.mock.calls[0][1]).toMatchObject({
        initiatedByPartyTypeConceptId: INS.PARTY_PATIENT,
        initiatedByEntityId: PATIENT,
      });
      expect(repo.createDispute.mock.calls[0][1]).not.toHaveProperty(
        'filingDeadline',
      );
    });

    it('bloquea el reclamo antes de buscar o crear la disputa', async () => {
      const { service, repo } = build();
      await service.object(CLAIM, body(), patient);
      const lock = repo.findClaimForUpdate.mock.invocationCallOrder[0];
      expect(lock).toBeLessThan(
        repo.findOpenDispute.mock.invocationCallOrder[0],
      );
      expect(lock).toBeLessThan(repo.createDispute.mock.invocationCallOrder[0]);
    });
  });

  describe('idempotencia', () => {
    it('objetar de nuevo devuelve la misma disputa, sin crear otra ni publicar', async () => {
      const existing = {
        id: 'dispute-previa',
        statusConceptId: INS.DISPUTE_OPEN,
        createdAt: new Date('2026-10-23T00:00:00Z'),
      };
      const { service, repo, publisher } = build({ existing });
      const result = await service.object(CLAIM, body(), patient);
      expect(result.id).toBe('dispute-previa');
      expect(repo.createDispute).not.toHaveBeenCalled();
      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('sólo busca una objeción del paciente, nunca una apelación del prestador', async () => {
      const { service, repo } = build();
      await service.object(CLAIM, body(), patient);
      expect(repo.findOpenDispute).toHaveBeenCalledWith(
        expect.anything(),
        CLAIM,
        undefined,
        INS.DISPUTE_OPEN,
        INS.DISPUTE_TYPE_PATIENT_OBJECTION,
      );
    });
  });

  describe('propiedad: sólo el titular', () => {
    it('comprueba al titular del perfil de la cobertura del reclamo, con el actor', async () => {
      const { service, ownership } = build();
      await service.object(CLAIM, body(), patient);
      expect(ownership.assertOwnsPatientProfile).toHaveBeenCalledWith(
        expect.anything(),
        PATIENT,
        patient,
      );
    });

    it('un reclamo ajeno, uno inexistente y una cobertura inexistente responden el mismo 403', async () => {
      const foreign = build({
        ownershipError: new ForbiddenException(
          'Sólo el titular del perfil o la plataforma pueden modificarlo',
        ),
      });
      const missingClaim = build({ claim: null });
      const missingCoverage = build({ coverage: null });
      const errors = await Promise.all(
        [foreign, missingClaim, missingCoverage].map((ctx) =>
          failure(ctx.service.object(CLAIM, body(), patient)),
        ),
      );
      for (const error of errors) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as Error).message).toBe(NO_ACCESS);
        expect((error as ForbiddenException).getResponse()).toEqual(
          (errors[0] as ForbiddenException).getResponse(),
        );
      }
      for (const ctx of [foreign, missingClaim, missingCoverage]) {
        expect(ctx.repo.createDispute).not.toHaveBeenCalled();
        expect(ctx.publisher.publish).not.toHaveBeenCalled();
      }
    });

    it('un fallo del puerto que no es un 403 no se disfraza de acceso denegado', async () => {
      const { service } = build({ ownershipError: new Error('db down') });
      await expect(service.object(CLAIM, body(), patient)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('reclamo revertido', () => {
    const reversed = () => ({
      ...baseClaim(),
      statusConceptId: INS.CLAIM_REVERSED,
    });

    it('422 tipificado, sin crear disputa', async () => {
      const { service, repo } = build({ claim: reversed() });
      const error = await failure(service.object(CLAIM, body(), patient));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).details).toEqual({
        reason: 'CLAIM_REVERSED_NOT_DISPUTABLE',
        claimId: CLAIM,
      });
      expect(repo.createDispute).not.toHaveBeenCalled();
    });

    it('registra el rechazo en su propia transacción, con la organización de la práctica', async () => {
      const { service, em, publisher } = build({ claim: reversed() });
      await failure(service.object(CLAIM, body(), patient));
      expect(em.transactional).toHaveBeenCalledTimes(2);
      expect(events(publisher)).toEqual([
        {
          tenantId: TENANT,
          eventType: PATIENT_PROTECTION_EVENT.PATIENT_OBJECTION_REJECTED,
          aggregateType: 'insurance.insurance_claims',
          aggregateId: CLAIM,
          payloadJson: {
            claimId: CLAIM,
            reason: 'CLAIM_REVERSED_NOT_DISPUTABLE',
            actorUserId: 'user-patient',
          },
        },
      ]);
    });

    it('sin organización de la práctica igual responde 422, sólo omite el evento', async () => {
      const { service, publisher } = build({ claim: reversed(), tenant: null });
      const error = await failure(service.object(CLAIM, body(), patient));
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(publisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('trazabilidad (REQ-16-034)', () => {
    it('publica la objeción con ids y motivo cerrado, con la organización de la práctica', async () => {
      const { service, publisher, practiceLookup } = build();
      await service.object(
        CLAIM,
        body({ objectionReason: 'AMOUNT_DIFFERS' }),
        patient,
      );
      expect(practiceLookup.findTenantOfPractice).toHaveBeenCalledWith(
        PRACTICE,
      );
      expect(events(publisher)).toEqual([
        {
          tenantId: TENANT,
          eventType: PATIENT_PROTECTION_EVENT.PATIENT_CHARGE_OBJECTED,
          aggregateType: 'insurance.insurance_claims',
          aggregateId: CLAIM,
          payloadJson: {
            claimId: CLAIM,
            disputeId: 'dispute-1',
            patientProfileId: PATIENT,
            practiceId: PRACTICE,
            insuranceCarrierId: 'carrier-1',
            objectionReason: 'AMOUNT_DIFFERS',
            actorUserId: 'user-patient',
          },
        },
      ]);
    });

    it('no lleva texto libre: un comentario que llegue en el cuerpo no viaja', async () => {
      const { service, publisher, repo } = build();
      await service.object(
        CLAIM,
        body({ comment: 'tengo diabetes y no me atendieron' }),
        patient,
      );
      expect(JSON.stringify(events(publisher))).not.toContain('diabetes');
      expect(JSON.stringify(repo.createDispute.mock.calls)).not.toContain(
        'diabetes',
      );
    });

    it('si la práctica no tiene organización, la objeción se guarda igual y se avisa en el log', async () => {
      const { service, repo, publisher, logger } = build({ tenant: null });
      const result = await service.object(CLAIM, body(), patient);
      expect(result.id).toBe('dispute-1');
      expect(repo.createDispute).toHaveBeenCalledTimes(1);
      expect(publisher.publish).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('los logs llevan identificadores, no el motivo ni el cuerpo', async () => {
      const { service, logger } = build();
      await service.object(
        CLAIM,
        body({ objectionReason: 'SERVICE_NOT_RECEIVED' }),
        patient,
      );
      const logged = JSON.stringify(logger.info.mock.calls);
      expect(logged).toContain(CLAIM);
      expect(logged).not.toContain('SERVICE_NOT_RECEIVED');
    });
  });
});
