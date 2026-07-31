import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DispatchIdentityChecksJob } from './dispatch-identity-checks.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 */
function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new DispatchIdentityChecksJob(api as any, logger as any);
  return { job, api, logger };
}

const newCheck = {
  id: 'check-1',
  identityVerificationCaseId: 'case-1',
  checkTypeConceptId: 'concept-identity-card',
  checkTypeCode: 'IDENTITY_CARD',
  identityAuthorityEndpointId: 'endpoint-1',
  awaitingVerdict: false,
};

const awaitingCheck = { ...newCheck, id: 'check-2', awaitingVerdict: true };

describe('DispatchIdentityChecksJob', () => {
  it('no llama a nada si no hay checks que atender', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ checks: [] });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith(
      '/internal/identity/checks/dispatchable',
    );
    expect(d.api.post).not.toHaveBeenCalled();
  });

  describe('despacho de un check nuevo', () => {
    it('con el adapter por defecto registra un intento FALLIDO (falla, no finge)', async () => {
      const d = build();
      d.api.get.mockResolvedValue({ checks: [newCheck] });
      d.api.post.mockResolvedValue({ id: 'attempt-1' });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        '/internal/identity/checks/check-1/attempts',
        expect.objectContaining({
          outcome: 'FAILED',
          technicalErrorCode: 'PROVIDER_NOT_CONFIGURED',
          retryEligible: true,
        }),
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('una solicitud aceptada queda PENDIENTE, no como éxito', async () => {
      const d = build();
      d.job.providerAdapter = {
        dispatch: mockFn(async () => ({
          accepted: true,
          providerReceipt: 'mock-identity-1',
        })),
        fetchVerdict: mockFn(async () => ({ status: 'PENDING' })),
      };
      d.api.get.mockResolvedValue({ checks: [newCheck] });
      d.api.post.mockResolvedValue({ id: 'attempt-1' });

      await d.job.tick();

      // Encolar no es verificar: el éxito sólo lo declara el veredicto.
      expect(d.api.post).toHaveBeenCalledWith(
        '/internal/identity/checks/check-1/attempts',
        expect.objectContaining({
          outcome: 'PENDING',
          identityAuthorityEndpointId: 'endpoint-1',
          retryEligible: false,
        }),
      );
    });

    it('no consulta el veredicto de un check que acaba de encolar', async () => {
      const d = build();
      const fetchVerdict = mockFn(async () => ({ status: 'ACCEPTED' }));
      d.job.providerAdapter = {
        dispatch: mockFn(async () => ({ accepted: true })),
        fetchVerdict,
      };
      d.api.get.mockResolvedValue({ checks: [newCheck] });
      d.api.post.mockResolvedValue({ id: 'attempt-1' });

      await d.job.tick();

      expect(fetchVerdict).not.toHaveBeenCalled();
    });
  });

  describe('recogida del veredicto', () => {
    it('no registra nada mientras la autoridad sigue resolviendo', async () => {
      const d = build();
      d.api.get.mockResolvedValue({ checks: [awaitingCheck] });

      await d.job.tick();

      expect(d.api.post).not.toHaveBeenCalled();
    });

    it('registra MATCH cuando la autoridad acepta', async () => {
      const d = build();
      d.job.providerAdapter = {
        dispatch: mockFn(async () => ({ accepted: true })),
        fetchVerdict: mockFn(async () => ({ status: 'ACCEPTED' })),
      };
      d.api.get.mockResolvedValue({ checks: [awaitingCheck] });
      d.api.post.mockResolvedValue({
        id: 'result-1',
        checkStatus: 'completed',
        caseStatus: 'asserted',
      });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        '/internal/identity/checks/check-2/results',
        expect.objectContaining({ result: 'MATCH' }),
      );
    });

    it('registra NO_MATCH con el motivo cuando la autoridad rechaza', async () => {
      const d = build();
      d.job.providerAdapter = {
        dispatch: mockFn(async () => ({ accepted: true })),
        fetchVerdict: mockFn(async () => ({
          status: 'REJECTED',
          reason: 'SIMULATED_NO_MATCH',
        })),
      };
      d.api.get.mockResolvedValue({ checks: [awaitingCheck] });
      d.api.post.mockResolvedValue({
        id: 'result-1',
        checkStatus: 'failed',
        caseStatus: 'rejected',
      });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        '/internal/identity/checks/check-2/results',
        expect.objectContaining({
          result: 'NO_MATCH',
          discrepancyCodes: ['SIMULATED_NO_MATCH'],
        }),
      );
    });
  });

  it('un fallo con un check no impide atender el resto del lote', async () => {
    const d = build();
    const second = { ...newCheck, id: 'check-3' };
    d.api.get.mockResolvedValue({ checks: [newCheck, second] });
    d.api.post
      .mockRejectedValueOnce(new Error('API caída'))
      .mockResolvedValueOnce({ id: 'attempt-2' });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
    expect(d.logger.error).toHaveBeenCalledTimes(1);
  });
});
