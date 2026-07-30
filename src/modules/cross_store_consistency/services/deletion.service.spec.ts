import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DeletionService } from './deletion.service';

const actor = { id: 'user-1', roles: ['DPO'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const SUBJECT_ID = '22222222-2222-2222-2222-222222222222';
const REQUEST_ID = '33333333-3333-3333-3333-333333333333';
const TARGET_ID = '44444444-4444-4444-4444-444444444444';
const DATASET_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const deletionRepo = {
    findLiveRequestBySubject: mockFn(async () => null),
    createRequest: mockFn((_tx: any, data: any) => ({
      id: REQUEST_ID,
      ...data,
    })),
    findRequestForUpdate: mockFn(async () => null),
    findTarget: mockFn(async () => null),
    createTarget: mockFn((_tx: any, data: any) => ({ id: TARGET_ID, ...data })),
    findTargetForUpdate: mockFn(async () => null),
    findTargetsByRequest: mockFn(async () => []),
    countExecutions: mockFn(async () => 0),
    findExecutionByKey: mockFn(async () => null),
    createExecution: mockFn((_tx: any, data: any) => ({
      id: 'exec-1',
      ...data,
    })),
    createVerification: mockFn((_tx: any, data: any) => ({
      id: 'ver-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DeletionService(
    em as any,
    deletionRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, deletionRepo, outbox, logger };
}

const REQUEST_DTO = {
  tenantId: TENANT_ID,
  subjectType: 'patient',
  subjectId: SUBJECT_ID,
  reasonCode: 'RTBF',
  legalBasisCode: 'GDPR_17',
} as any;

describe('DeletionService', () => {
  describe('requestDeletion (UC-62-08)', () => {
    it('crea la solicitud con su plazo', async () => {
      const d = build();

      const result = await d.service.requestDeletion(REQUEST_DTO, actor);

      expect(result.state).toBe('PENDING');
      expect(new Date(result.dueAt).getTime()).toBeGreaterThan(Date.now());
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('usa el plazo pedido', async () => {
      const d = build();

      const result = await d.service.requestDeletion(
        { ...REQUEST_DTO, slaDays: 7 },
        actor,
      );

      const expected = Date.now() + 7 * 86_400_000;
      expect(
        Math.abs(new Date(result.dueAt).getTime() - expected),
      ).toBeLessThan(5000);
    });

    it('devuelve la solicitud viva en vez de abrir otra', async () => {
      const d = build();
      d.deletionRepo.findLiveRequestBySubject.mockResolvedValue({
        id: 'request-previo',
        state: 'EXPANDED',
        dueAt: new Date(),
      });

      const result = await d.service.requestDeletion(REQUEST_DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.deletionRepo.createRequest).not.toHaveBeenCalled();
    });
  });

  describe('expandDeletion (UC-62-09)', () => {
    const DTO = {
      targets: [
        {
          datasetId: DATASET_ID,
          backendCode: 'opensearch',
          targetLocator: 'idx/doc-1',
          deletionMode: 'HARD',
        },
      ],
    } as any;

    /**
     * Ejecuta la operación with request.
     *
     * @param d - Valor de d requerido por la operación.
     * @param state - Valor de state requerido por la operación.
     * @returns Resultado de with request.
     */
    function withRequest(d: ReturnType<typeof build>, state = 'PENDING') {
      const request = { id: REQUEST_ID, tenantId: TENANT_ID, state };
      d.deletionRepo.findRequestForUpdate.mockResolvedValue(request);
      return request;
    }

    it('crea los objetivos y marca la solicitud expandida', async () => {
      const d = build();
      const request = withRequest(d);

      const result = await d.service.expandDeletion(REQUEST_ID, DTO, actor);

      expect(result.targetsCreated).toBe(1);
      expect(request.state).toBe('EXPANDED');
      expect(d.deletionRepo.createTarget.mock.calls[0][1].state).toBe(
        'PENDING',
      );
    });

    it('un objetivo con retención legal nace BLOCKED pero se registra', async () => {
      const d = build();
      withRequest(d);

      const result = await d.service.expandDeletion(
        REQUEST_ID,
        { targets: [{ ...DTO.targets[0], blockedByLegalHold: true }] },
        actor,
      );

      expect(result.targetsCreated).toBe(1);
      expect(result.blockedByLegalHold).toBe(1);
      expect(d.deletionRepo.createTarget.mock.calls[0][1].state).toBe(
        'BLOCKED',
      );
    });

    it('salta un objetivo ya declarado', async () => {
      const d = build();
      withRequest(d);
      d.deletionRepo.findTarget.mockResolvedValue({ id: 'target-previo' });

      const result = await d.service.expandDeletion(REQUEST_ID, DTO, actor);

      expect(result.targetsCreated).toBe(0);
      expect(result.targetsSkipped).toBe(1);
    });

    it('rechaza expandir una solicitud ya cerrada', async () => {
      const d = build();
      withRequest(d, 'COMPLETED');

      await expect(
        d.service.expandDeletion(REQUEST_ID, DTO, actor),
      ).rejects.toThrow(/no admite expansión/);
    });
  });

  describe('executeDeletion (UC-62-10)', () => {
    /**
     * Ejecuta la operación with target.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with target.
     */
    function withTarget(d: ReturnType<typeof build>, overrides: any = {}) {
      const target = {
        id: TARGET_ID,
        state: 'PENDING',
        blockedByLegalHold: false,
        ...overrides,
      };
      d.deletionRepo.findTargetForUpdate.mockResolvedValue(target);
      return target;
    }

    it('ejecuta y deja el objetivo ejecutado', async () => {
      const d = build();
      const target = withTarget(d);

      const result = await d.service.executeDeletion(
        TARGET_ID,
        { providerReceipt: 'r-1' },
        actor,
      );

      expect(result.status).toBe('SUCCEEDED');
      expect(target.state).toBe('EXECUTED');
      expect(result.attemptNumber).toBe(1);
    });

    it('un fallo no cambia el estado del objetivo', async () => {
      const d = build();
      const target = withTarget(d);

      const result = await d.service.executeDeletion(
        TARGET_ID,
        { succeeded: false, errorCode: 'PROVIDER_DOWN' },
        actor,
      );

      expect(result.status).toBe('FAILED');
      expect(target.state).toBe('PENDING');
    });

    it('no toca un objetivo con retención legal', async () => {
      const d = build();
      withTarget(d, { blockedByLegalHold: true });

      await expect(
        d.service.executeDeletion(TARGET_ID, {} as any, actor),
      ).rejects.toThrow(/retención legal/);
    });

    it('numera los intentos a partir de los que lleva', async () => {
      const d = build();
      withTarget(d);
      d.deletionRepo.countExecutions.mockResolvedValue(2);

      const result = await d.service.executeDeletion(TARGET_ID, {}, actor);

      expect(result.attemptNumber).toBe(3);
    });

    it('devuelve la ejecución previa con la misma clave', async () => {
      const d = build();
      withTarget(d);
      d.deletionRepo.findExecutionByKey.mockResolvedValue({
        id: 'exec-previa',
        attemptNumber: 1,
        status: 'SUCCEEDED',
      });

      const result = await d.service.executeDeletion(TARGET_ID, {}, actor);

      expect(result.duplicate).toBe(true);
      expect(d.deletionRepo.createExecution).not.toHaveBeenCalled();
    });
  });

  describe('verifyDeletion (UC-62-11)', () => {
    /**
     * Ejecuta la operación with target.
     *
     * @param d - Valor de d requerido por la operación.
     * @param state - Valor de state requerido por la operación.
     * @returns Resultado de with target.
     */
    function withTarget(d: ReturnType<typeof build>, state = 'EXECUTED') {
      const target = { id: TARGET_ID, state, blockedByLegalHold: false };
      d.deletionRepo.findTargetForUpdate.mockResolvedValue(target);
      return target;
    }

    it('la ausencia confirmada deja el objetivo verificado', async () => {
      const d = build();
      const target = withTarget(d);

      const result = await d.service.verifyDeletion(
        TARGET_ID,
        { verificationMethod: 'QUERY_ABSENCE', verifiedAbsent: true },
        actor,
      );

      expect(target.state).toBe('VERIFIED');
      expect(result.requiresReexecution).toBe(false);
    });

    it('las referencias residuales devuelven el objetivo a pendiente', async () => {
      const d = build();
      const target = withTarget(d);

      const result = await d.service.verifyDeletion(
        TARGET_ID,
        {
          verificationMethod: 'QUERY_ABSENCE',
          verifiedAbsent: true,
          residualReferenceCount: 3,
        },
        actor,
      );

      expect(target.state).toBe('PENDING');
      expect(result.requiresReexecution).toBe(true);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('no verificar ausencia también devuelve a pendiente', async () => {
      const d = build();
      const target = withTarget(d);

      await d.service.verifyDeletion(
        TARGET_ID,
        { verificationMethod: 'CHECKSUM', verifiedAbsent: false },
        actor,
      );

      expect(target.state).toBe('PENDING');
    });

    it('rechaza verificar un objetivo que no se ejecutó', async () => {
      const d = build();
      withTarget(d, 'PENDING');

      await expect(
        d.service.verifyDeletion(
          TARGET_ID,
          { verificationMethod: 'QUERY_ABSENCE', verifiedAbsent: true } as any,
          actor,
        ),
      ).rejects.toThrow(/tiene que estar ejecutado/);
    });
  });

  describe('closeDeletionRequest (UC-62-11)', () => {
    /**
     * Ejecuta la operación with request.
     *
     * @param d - Valor de d requerido por la operación.
     * @param targets - Valor de targets requerido por la operación.
     * @param state - Valor de state requerido por la operación.
     * @returns Resultado de with request.
     */
    function withRequest(
      d: ReturnType<typeof build>,
      targets: any[],
      state = 'EXPANDED',
    ) {
      const request = {
        id: REQUEST_ID,
        tenantId: TENANT_ID,
        subjectType: 'patient',
        subjectId: SUBJECT_ID,
        state,
      };
      d.deletionRepo.findRequestForUpdate.mockResolvedValue(request);
      d.deletionRepo.findTargetsByRequest.mockResolvedValue(targets);
      return request;
    }

    it('cierra como COMPLETED con todo verificado', async () => {
      const d = build();
      const request = withRequest(d, [
        { state: 'VERIFIED', blockedByLegalHold: false },
        { state: 'VERIFIED', blockedByLegalHold: false },
      ]);

      const result = await d.service.closeDeletionRequest(
        REQUEST_ID,
        {},
        actor,
      );

      expect(request.state).toBe('COMPLETED');
      expect(result.verifiedTargets).toBe(2);
    });

    it('cierra como BLOCKED si todo lo que queda está retenido por ley', async () => {
      const d = build();
      const request = withRequest(d, [
        { state: 'BLOCKED', blockedByLegalHold: true },
      ]);

      const result = await d.service.closeDeletionRequest(
        REQUEST_ID,
        {},
        actor,
      );

      expect(request.state).toBe('BLOCKED');
      expect(result.blockedTargets).toBe(1);
      expect(result.verifiedTargets).toBe(0);
    });

    it('no cierra con objetivos sin verificar', async () => {
      const d = build();
      withRequest(d, [
        { state: 'VERIFIED', blockedByLegalHold: false },
        { state: 'EXECUTED', blockedByLegalHold: false },
      ]);

      await expect(
        d.service.closeDeletionRequest(REQUEST_ID, {} as any, actor),
      ).rejects.toThrow(/sin verificar/);
    });

    it('rechaza cerrar una solicitud sin objetivos', async () => {
      const d = build();
      withRequest(d, []);

      await expect(
        d.service.closeDeletionRequest(REQUEST_ID, {} as any, actor),
      ).rejects.toThrow(/no tiene objetivos/);
    });

    it('rechaza cerrar dos veces', async () => {
      const d = build();
      withRequest(d, [{ state: 'VERIFIED' }], 'COMPLETED');

      await expect(
        d.service.closeDeletionRequest(REQUEST_ID, {} as any, actor),
      ).rejects.toThrow(/ya está cerrada/);
    });

    it('publica el cierre con su desenlace', async () => {
      const d = build();
      withRequest(d, [{ state: 'VERIFIED', blockedByLegalHold: false }]);

      await d.service.closeDeletionRequest(REQUEST_ID, { note: 'ok' }, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'DeletionRequestClosed',
          payloadJson: expect.objectContaining({ state: 'COMPLETED' }),
        }),
      );
    });
  });
});
