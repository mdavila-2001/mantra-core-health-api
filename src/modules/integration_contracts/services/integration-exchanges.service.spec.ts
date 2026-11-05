import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationExchangesService } from './integration-exchanges.service';
import { ICON } from '../integration_contracts.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { IntegrationContractsErrorReason } from '../integration_contracts.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';

/**
 * Ejecuta cada método del servicio con `tenant` como tenant activo del
 * contexto, igual que lo deja el interceptor en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenant - Tenant activo.
 * @returns Proxy que fija el contexto en cada llamada.
 */
function inTenant<T extends object>(service: T, tenant: string): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenant, () => value.apply(target, args));
    },
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const findContract = mockFn();
  const contractsRepo = {
    findByIdInTenant: findContract,
    findByIdInTenantForUpdate: findContract,
  };
  const versionsRepo = { findActiveByContract: mockFn(), findById: mockFn() };
  const recordsRepo = { findByIdForUpdate: mockFn(), create: mockFn() };
  const attemptsRepo = {
    maxAttemptNumber: mockFn().mockResolvedValue(0),
    lastAttempt: mockFn(),
    create: mockFn(),
  };
  const idempotencyRepo = { findByKey: mockFn(), create: mockFn() };
  const cursorsRepo = { findByScope: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationExchangesService(
    em as any,
    contractsRepo as any,
    versionsRepo as any,
    recordsRepo as any,
    attemptsRepo,
    idempotencyRepo,
    cursorsRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    contractsRepo,
    versionsRepo,
    recordsRepo,
    attemptsRepo,
    idempotencyRepo,
    cursorsRepo,
  };
}

/**
 * Deja resuelta la cadena versión → contrato del tenant activo para el
 * registro `r1`: versión `v1` del contrato propio `c1`.
 *
 * @param d - Entorno de prueba.
 */
function ownRecordChain(d: ReturnType<typeof build>): void {
  d.versionsRepo.findById.mockResolvedValue({
    id: 'v1',
    integrationContractId: 'c1',
  });
  d.contractsRepo.findByIdInTenant.mockResolvedValue({
    id: 'c1',
    tenantId: TENANT,
  });
}

describe('IntegrationExchangesService', () => {
  describe('executeExchange (UC-31-05)', () => {
    it('rejects a missing idempotency key (422)', async () => {
      const d = build();
      await expect(
        d.service.executeExchange('c1', undefined, {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates idempotency, record and first attempt for a fresh key', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c1',
      });
      d.idempotencyRepo.findByKey.mockResolvedValue(null);
      const idem: any = {};
      d.idempotencyRepo.create.mockReturnValue(idem);
      d.recordsRepo.create.mockReturnValue({
        id: 'r1',
        outcomeConceptId: ICON.OUTCOME_PENDING,
      });

      const res = await d.service.executeExchange(
        'c1',
        'idem-1',
        { requestHash: 'h' },
        actor,
      );

      expect(res).toEqual({
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcome: ICON.OUTCOME_PENDING,
        replayed: false,
      });
      expect(idem.firstExchangeRecordId).toBe('r1');
      expect(d.attemptsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          attemptNumber: 1,
          outcomeConceptId: ICON.ATTEMPT_IN_PROGRESS,
        }),
      );
    });

    it('replays an existing key without re-executing', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c1',
      });
      d.idempotencyRepo.findByKey.mockResolvedValue({
        id: 'idem1',
        firstExchangeRecordId: 'r1',
        statusConceptId: ICON.IDEMPOTENCY_COMPLETED,
        responseReference: 'resp://1',
        requestHash: 'h',
      });

      const res = await d.service.executeExchange(
        'c1',
        'idem-1',
        { requestHash: 'h' },
        actor,
      );

      expect(res.replayed).toBe(true);
      expect(res.id).toBe('r1');
      expect(res.responseReference).toBe('resp://1');
      expect(d.recordsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects a payload mismatch under the same key (409)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c1',
      });
      d.idempotencyRepo.findByKey.mockResolvedValue({
        id: 'idem1',
        requestHash: 'OTHER',
      });
      await expect(
        d.service.executeExchange(
          'c1',
          'idem-1',
          { requestHash: 'h' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects when there is no ACTIVE version (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue(null);
      await expect(
        d.service.executeExchange('c1', 'idem-1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('recordAttempt (UC-31-06)', () => {
    it('records a SUCCESS attempt, closes the record and completes idempotency', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        idempotencyKey: 'idem-1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_PENDING,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.attemptsRepo.maxAttemptNumber.mockResolvedValue(1);
      d.attemptsRepo.create.mockReturnValue({
        id: 'a2',
        outcomeConceptId: ICON.ATTEMPT_SUCCESS,
      });
      d.versionsRepo.findById.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c1',
      });
      const idem: any = { statusConceptId: ICON.IDEMPOTENCY_PENDING };
      d.idempotencyRepo.findByKey.mockResolvedValue(idem);

      const res = await d.service.recordAttempt(
        'c1',
        'r1',
        { outcome: 'SUCCESS' } as any,
        actor,
      );

      expect(res).toMatchObject({
        attemptNumber: 2,
        outcome: ICON.ATTEMPT_SUCCESS,
        recordOutcome: ICON.OUTCOME_SUCCESS,
      });
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_SUCCESS);
      expect(idem.statusConceptId).toBe(ICON.IDEMPOTENCY_COMPLETED);
      expect(idem.responseReference).toBe('r1');
    });

    it('records a FAILED attempt leaving the record FAILED', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_PENDING,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      ownRecordChain(d);
      d.attemptsRepo.create.mockReturnValue({
        id: 'a1',
        outcomeConceptId: ICON.ATTEMPT_FAILED,
      });

      const res = await d.service.recordAttempt(
        'c1',
        'r1',
        { outcome: 'FAILED', retryDecision: 'RETRYABLE' } as any,
        actor,
      );

      expect(res.recordOutcome).toBe(ICON.OUTCOME_FAILED);
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_FAILED);
    });

    it('throws not found when the record is absent (404)', async () => {
      const d = build();
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(null);
      await expect(
        d.service.recordAttempt(
          'c1',
          'r1',
          { outcome: 'SUCCESS' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('retry (UC-31-07)', () => {
    it('retries when the last attempt was FAILED and retryable', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_FAILED,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      ownRecordChain(d);
      d.attemptsRepo.lastAttempt.mockResolvedValue({
        attemptNumber: 1,
        outcomeConceptId: ICON.ATTEMPT_FAILED,
        retryDecisionConceptId: ICON.RETRY_RETRYABLE,
      });
      d.attemptsRepo.create.mockReturnValue({
        id: 'a2',
        outcomeConceptId: ICON.ATTEMPT_SUCCESS,
      });

      const res = await d.service.retry('r1', {}, actor);

      expect(res).toMatchObject({
        attemptNumber: 2,
        outcome: ICON.ATTEMPT_SUCCESS,
      });
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_SUCCESS);
    });

    it('rejects retry when the last attempt was not FAILED (422)', async () => {
      const d = build();
      d.recordsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'r1',
        integrationContractVersionId: 'v1',
      });
      ownRecordChain(d);
      d.attemptsRepo.lastAttempt.mockResolvedValue({
        attemptNumber: 1,
        outcomeConceptId: ICON.ATTEMPT_SUCCESS,
      });
      await expect(
        d.service.retry('r1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('advanceCursor (UC-31-08)', () => {
    it('creates the cursor when it does not exist', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.cursorsRepo.findByScope.mockResolvedValue(null);
      d.cursorsRepo.create.mockReturnValue({ id: 'cur1', cursorValue: '100' });

      const res = await d.service.advanceCursor(
        'c1',
        'orders',
        { cursorValue: '100' },
        actor,
      );

      expect(res).toEqual({
        id: 'cur1',
        cursorScope: 'orders',
        cursorValue: '100',
        created: true,
      });
    });

    it('advances a cursor forward', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      const cursor: any = {
        id: 'cur1',
        cursorValue: '100',
        updatedAt: new Date(),
      };
      d.cursorsRepo.findByScope.mockResolvedValue(cursor);

      const res = await d.service.advanceCursor(
        'c1',
        'orders',
        { cursorValue: '200' },
        actor,
      );

      expect(res).toEqual({
        id: 'cur1',
        cursorScope: 'orders',
        cursorValue: '200',
        created: false,
      });
      expect(cursor.cursorValue).toBe('200');
    });

    it('rejects a regressive cursor (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.cursorsRepo.findByScope.mockResolvedValue({
        id: 'cur1',
        cursorValue: '200',
      });
      await expect(
        d.service.advanceCursor(
          'c1',
          'orders',
          { cursorValue: '100' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        d.service.advanceCursor(
          'c1',
          'orders',
          { cursorValue: '1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
  describe('aislamiento por tenant (ICON-01)', () => {
    /**
     * Respuesta serializada de una excepción de dominio.
     *
     * @param error - Excepción capturada.
     * @returns Cuerpo de la respuesta HTTP.
     */
    const body = (error: any) => error.getResponse();

    it('un contrato de otro tenant responde igual que uno inexistente al ejecutar un intercambio', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: OTHER_TENANT,
      });
      const foreign = await d.service
        .executeExchange('c1', 'idem-1', {} as any, actor)
        .catch((e: any) => e);
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      const missing = await d.service
        .executeExchange('c1', 'idem-1', {} as any, actor)
        .catch((e: any) => e);

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getStatus()).toBe(404);
      expect(body(foreign)).toEqual(body(missing));
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(foreign.details).toBeUndefined();
      expect(d.idempotencyRepo.create).not.toHaveBeenCalled();
      expect(d.recordsRepo.create).not.toHaveBeenCalled();
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c1',
      );
    });

    it('sin tenant activo no se ejecuta nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.executeExchange('c1', 'idem-1', {} as any, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      expect(d.contractsRepo.findByIdInTenant).not.toHaveBeenCalled();
    });

    it('registrar un intento sobre un intercambio de otro tenant responde 404 y no escribe', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_PENDING,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      d.versionsRepo.findById.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c-b',
      });
      // El repositorio acotado por tenant no encuentra el contrato ajeno.
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);

      const foreign = await d.service
        .recordAttempt('c-b', 'r1', { outcome: 'SUCCESS' } as any, actor)
        .catch((e: any) => e);
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(null);
      const missing = await d.service
        .recordAttempt('c-b', 'r1', { outcome: 'SUCCESS' } as any, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(body(foreign)).toEqual(body(missing));
      expect(d.attemptsRepo.create).not.toHaveBeenCalled();
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_PENDING);
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c-b',
      );
    });

    it('un intercambio propio no se opera por la ruta de otro contrato', async () => {
      const d = build();
      d.recordsRepo.findByIdForUpdate.mockResolvedValue({
        id: 'r1',
        integrationContractVersionId: 'v1',
      });
      ownRecordChain(d);
      await expect(
        d.service.recordAttempt(
          'otro-contrato',
          'r1',
          { outcome: 'SUCCESS' } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        reason:
          IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      });
      expect(d.attemptsRepo.create).not.toHaveBeenCalled();
    });

    it('reintentar un intercambio de otro tenant responde 404 uniforme sin crear intento', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_FAILED,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      d.versionsRepo.findById.mockResolvedValue({
        id: 'v1',
        integrationContractId: 'c-b',
      });
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c-b',
        tenantId: OTHER_TENANT,
      });

      const foreign = await d.service
        .retry('r1', {} as any, actor)
        .catch((e: any) => e);
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(null);
      const missing = await d.service
        .retry('r1', {} as any, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(body(foreign)).toEqual(body(missing));
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(d.attemptsRepo.lastAttempt).not.toHaveBeenCalled();
      expect(d.attemptsRepo.create).not.toHaveBeenCalled();
      expect(record.outcomeConceptId).toBe(ICON.OUTCOME_FAILED);
    });

    it('límite: dos reintentos del mismo intercambio propio producen un solo intento nuevo', async () => {
      const d = build();
      const record: any = {
        id: 'r1',
        integrationContractVersionId: 'v1',
        outcomeConceptId: ICON.OUTCOME_FAILED,
      };
      d.recordsRepo.findByIdForUpdate.mockResolvedValue(record);
      ownRecordChain(d);
      let last: any = {
        attemptNumber: 1,
        outcomeConceptId: ICON.ATTEMPT_FAILED,
        retryDecisionConceptId: ICON.RETRY_RETRYABLE,
      };
      d.attemptsRepo.lastAttempt.mockImplementation(async () => last);
      d.attemptsRepo.create.mockImplementation((_tx: any, data: any) => {
        last = {
          attemptNumber: data.attemptNumber,
          outcomeConceptId: data.outcomeConceptId,
          retryDecisionConceptId: data.retryDecisionConceptId,
        };
        return { id: 'a2', outcomeConceptId: data.outcomeConceptId };
      });

      // El bloqueo de fila serializa a los dos reintentos: el segundo ya ve el
      // éxito del primero.
      const first = await d.service.retry('r1', {}, actor);
      const second = await d.service
        .retry('r1', {}, actor)
        .catch((e: any) => e);

      expect(first.attemptNumber).toBe(2);
      expect(second).toBeInstanceOf(PreconditionFailedException);
      expect(d.attemptsRepo.create).toHaveBeenCalledTimes(1);
      expect(d.recordsRepo.findByIdForUpdate).toHaveBeenCalledWith(d.tx, 'r1');
    });

    it('avanzar el cursor de un contrato de otro tenant responde 404 y no crea cursor', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      const foreign = await d.service
        .advanceCursor('c-b', 'orders', { cursorValue: '1' } as any, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(d.cursorsRepo.findByScope).not.toHaveBeenCalled();
      expect(d.cursorsRepo.create).not.toHaveBeenCalled();
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c-b',
      );
    });
  });
});
