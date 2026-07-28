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
} from '../../../common';
import { TELE } from '../telemetry.concepts';

const actor = { id: 'user-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
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
});
