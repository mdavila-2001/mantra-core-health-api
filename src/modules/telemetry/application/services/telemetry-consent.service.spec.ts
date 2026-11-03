import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TelemetryConsentService } from './telemetry-consent.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { TELE } from '../../telemetry.concepts';
import { TelemetryErrorReason } from '../../telemetry.error-reasons';
import { createGlobalValidationPipe } from '../../../../common';
import {
  CreateDisclosureAcceptanceDto,
  CreateTrackingConsentDto,
} from '../../presentation/dto';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const disclosuresRepo = { findById: mockFn() };
  const acceptancesRepo = { findExisting: mockFn(), create: mockFn() };
  const consentsRepo = {
    findById: mockFn(),
    findLatest: mockFn(),
    create: mockFn(),
  };
  const purposesRepo = { findById: mockFn() };
  const subjectsRepo = {
    findByKey: mockFn(),
    create: mockFn(),
    findActiveByConsent: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TelemetryConsentService(
    em as any,
    disclosuresRepo as any,
    acceptancesRepo,
    consentsRepo,
    purposesRepo as any,
    subjectsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    disclosuresRepo,
    acceptancesRepo,
    consentsRepo,
    purposesRepo,
    subjectsRepo,
  };
}

describe('TelemetryConsentService', () => {
  describe('acceptDisclosure (UC-28-04)', () => {
    it('records a new acceptance', async () => {
      const d = build();
      d.disclosuresRepo.findById.mockResolvedValue({ id: 'v1' });
      d.acceptancesRepo.findExisting.mockResolvedValue(null);
      d.acceptancesRepo.create.mockReturnValue({
        id: 'a1',
        trackingDisclosureVersionId: 'v1',
        userId: 'user-1',
      });
      const res = await d.service.acceptDisclosure(
        { trackingDisclosureVersionId: 'v1' },
        actor,
      );
      expect(res.id).toBe('a1');
    });

    it('is idempotent when an acceptance already exists', async () => {
      const d = build();
      d.disclosuresRepo.findById.mockResolvedValue({ id: 'v1' });
      d.acceptancesRepo.findExisting.mockResolvedValue({
        id: 'a0',
        trackingDisclosureVersionId: 'v1',
        userId: 'user-1',
        createdAt: new Date(),
      });
      const res = await d.service.acceptDisclosure(
        { trackingDisclosureVersionId: 'v1' },
        actor,
      );
      expect(res.id).toBe('a0');
      expect(d.acceptancesRepo.create).not.toHaveBeenCalled();
    });

    it('registra la aceptación a nombre del actor aunque el cuerpo traiga el userId de otra persona', async () => {
      const d = build();
      d.disclosuresRepo.findById.mockResolvedValue({ id: 'v1' });
      d.acceptancesRepo.findExisting.mockResolvedValue(null);
      d.acceptancesRepo.create.mockReturnValue({
        id: 'a1',
        trackingDisclosureVersionId: 'v1',
        userId: 'user-1',
      });

      await d.service.acceptDisclosure(
        { trackingDisclosureVersionId: 'v1', userId: 'victima-2' } as any,
        actor,
      );

      expect(d.acceptancesRepo.findExisting).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        'v1',
        undefined,
      );
      expect(d.acceptancesRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userId: 'user-1' }),
      );
    });

    it('404 when the disclosure version is missing', async () => {
      const d = build();
      d.disclosuresRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.acceptDisclosure(
          { trackingDisclosureVersionId: 'v9' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('grantConsent (UC-28-05)', () => {
    it('grants consent for a purpose that requires it', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        requiresConsent: true,
      });
      d.consentsRepo.create.mockReturnValue({
        id: 'c1',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
        decisionConceptId: TELE.DECISION_GRANTED,
      });
      const res = await d.service.grantConsent(
        { purposeDefinitionId: 'p1' },
        actor,
      );
      expect(res.decisionConceptId).toBe(TELE.DECISION_GRANTED);
    });

    it('otorga el consentimiento al actor aunque el cuerpo traiga el userId de otra persona', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        requiresConsent: true,
      });
      d.consentsRepo.create.mockReturnValue({
        id: 'c1',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
        decisionConceptId: TELE.DECISION_GRANTED,
      });

      await d.service.grantConsent(
        { purposeDefinitionId: 'p1', userId: 'victima-2' } as any,
        actor,
      );

      expect(d.consentsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.consentsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ userId: 'user-1', actorUserId: 'user-1' }),
      );
    });

    it('422 when the purpose does not require consent', async () => {
      const d = build();
      d.purposesRepo.findById.mockResolvedValue({
        id: 'p1',
        requiresConsent: false,
      });
      await expect(
        d.service.grantConsent({ purposeDefinitionId: 'p1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('provisionSubject (UC-28-06)', () => {
    it('reuses an existing subject by key (idempotent)', async () => {
      const d = build();
      d.subjectsRepo.findByKey.mockResolvedValue({
        id: 's0',
        pseudonymousSubjectKey: 'k',
        createdAt: new Date(),
      });
      const res = await d.service.provisionSubject({
        pseudonymousSubjectKey: 'k',
      });
      expect(res.reused).toBe(true);
      expect(d.subjectsRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new subject when the key is free', async () => {
      const d = build();
      d.subjectsRepo.findByKey.mockResolvedValue(null);
      d.subjectsRepo.create.mockReturnValue({
        id: 's1',
        pseudonymousSubjectKey: 'k',
        createdAt: new Date(),
      });
      const res = await d.service.provisionSubject({
        pseudonymousSubjectKey: 'k',
      });
      expect(res.reused).toBe(false);
      expect(res.id).toBe('s1');
    });
  });

  describe('withdrawConsent (UC-28-12)', () => {
    it('withdraws and deactivates subjects in cascade', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
      });
      d.consentsRepo.findLatest.mockResolvedValue({
        id: 'c1',
        decisionConceptId: TELE.DECISION_GRANTED,
      });
      d.consentsRepo.create.mockReturnValue({
        id: 'c2',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });
      const subject = { deactivatedAt: undefined as Date | undefined };
      d.subjectsRepo.findActiveByConsent.mockResolvedValue([subject]);

      const res = await d.service.withdrawConsent('c1', actor);
      expect(res.decisionConceptId).toBe(TELE.DECISION_WITHDRAWN);
      expect(subject.deactivatedAt).toBeInstanceOf(Date);
    });

    it('404 when the consent does not exist', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.withdrawConsent('c9', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('el consentimiento de otra persona responde igual que uno inexistente y no escribe nada', async () => {
      const ajeno = build();
      ajeno.consentsRepo.findById.mockResolvedValue({
        id: 'c-b',
        userId: 'user-2',
        purposeDefinitionId: 'p1',
      });
      const inexistente = build();
      inexistente.consentsRepo.findById.mockResolvedValue(null);

      const failure = async (d: ReturnType<typeof build>) => {
        try {
          await d.service.withdrawConsent('c-b', actor);
        } catch (error) {
          return error as ResourceNotFoundException;
        }
        throw new Error('debía rechazar');
      };
      const a = await failure(ajeno);
      const b = await failure(inexistente);

      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(a.getStatus()).toBe(404);
      expect(a.reason).toBe(TelemetryErrorReason.CONSENT_NOT_OWNED);
      expect(a.details).toBeUndefined();
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(ajeno.consentsRepo.findLatest).not.toHaveBeenCalled();
      expect(ajeno.consentsRepo.create).not.toHaveBeenCalled();
      expect(ajeno.subjectsRepo.findActiveByConsent).not.toHaveBeenCalled();
    });

    it('el titular repite el retiro: 422 con TELEMETRY_CONSENT_NOT_ACTIVE', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
      });
      d.consentsRepo.findLatest.mockResolvedValue({
        id: 'c2',
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });

      const error = await d.service
        .withdrawConsent('c1', actor)
        .catch((e: PreconditionFailedException) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect((error as PreconditionFailedException).reason).toBe(
        TelemetryErrorReason.CONSENT_NOT_ACTIVE,
      );
      expect(d.consentsRepo.create).not.toHaveBeenCalled();
    });

    it('422 when there is no active granted consent', async () => {
      const d = build();
      d.consentsRepo.findById.mockResolvedValue({
        id: 'c1',
        userId: 'user-1',
        purposeDefinitionId: 'p1',
      });
      d.consentsRepo.findLatest.mockResolvedValue({
        id: 'c1',
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });
      await expect(
        d.service.withdrawConsent('c1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('getMyStatus', () => {
    it('sin decisiones previas es NONE', async () => {
      const d = build();
      d.consentsRepo.findLatest.mockResolvedValue(null);

      await expect(d.service.getMyStatus('p1', actor)).resolves.toEqual({
        status: 'NONE',
        purposeDefinitionId: 'p1',
      });
    });

    it('con la última decisión GRANTED devuelve el id a retirar', async () => {
      const d = build();
      d.consentsRepo.findLatest.mockResolvedValue({
        id: 'c1',
        decisionConceptId: TELE.DECISION_GRANTED,
      });

      await expect(d.service.getMyStatus('p1', actor)).resolves.toEqual({
        status: 'GRANTED',
        consentId: 'c1',
        purposeDefinitionId: 'p1',
      });
    });

    it('con la última decisión WITHDRAWN no devuelve un id', async () => {
      const d = build();
      d.consentsRepo.findLatest.mockResolvedValue({
        id: 'c2',
        decisionConceptId: TELE.DECISION_WITHDRAWN,
      });

      const res = await d.service.getMyStatus('p1', actor);

      expect(res).toEqual({ status: 'WITHDRAWN', purposeDefinitionId: 'p1' });
      expect(res).not.toHaveProperty('consentId');
    });

    it('consulta siempre por el actor autenticado, nunca por otro usuario', async () => {
      const d = build();
      d.consentsRepo.findLatest.mockResolvedValue(null);

      await d.service.getMyStatus('p1', actor);

      expect(d.consentsRepo.findLatest).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        'p1',
      );
    });
  });

  describe('cuerpo de autoservicio (TEL-01)', () => {
    const pipe = createGlobalValidationPipe();
    const validate = (metatype: new () => object, body: object) =>
      pipe.transform(body, { type: 'body', metatype });

    it('el pipe global rechaza userId en el consentimiento', async () => {
      await expect(
        validate(CreateTrackingConsentDto, {
          purposeDefinitionId: '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e11',
          userId: '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e12',
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('el pipe global rechaza userId en la aceptación de disclosure', async () => {
      await expect(
        validate(CreateDisclosureAcceptanceDto, {
          trackingDisclosureVersionId: '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e11',
          userId: '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e12',
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('sin userId el cuerpo válido pasa', async () => {
      await expect(
        validate(CreateTrackingConsentDto, {
          purposeDefinitionId: '3b6f7a52-2a2e-4a53-9f3b-0d5a1d3c9e11',
        }),
      ).resolves.toBeInstanceOf(CreateTrackingConsentDto);
    });
  });
});
