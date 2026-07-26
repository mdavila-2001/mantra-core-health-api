import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsConnectionsService } from './integrations-connections.service';
import { INTEG } from '../integrations.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const providersRepo = { findById: mockFn() };
  const connectionsRepo = { findById: mockFn(), create: mockFn() };
  const credentialsRepo = { findActiveByConnection: mockFn(), create: mockFn() };
  const outboundRepo = { holdQueuedForConnection: mockFn().mockResolvedValue(0) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsConnectionsService(
    em as any,
    providersRepo as any,
    connectionsRepo as any,
    credentialsRepo as any,
    outboundRepo as any,
    logger as any,
  );
  return { service, tx, providersRepo, connectionsRepo, credentialsRepo, outboundRepo };
}

describe('IntegrationsConnectionsService', () => {
  describe('provisionConnection (UC-12-02)', () => {
    it('throws when the provider is missing', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.provisionConnection('p1', { tenantId: 't1', secretType: 'API_KEY', secretRef: 'r' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects an inactive provider (precondition)', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({ id: 'p1', stateConceptId: INTEG.PROVIDER_INACTIVE });
      await expect(
        d.service.provisionConnection('p1', { tenantId: 't1', secretType: 'API_KEY', secretRef: 'r' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates connection (flush) then credential, and links it back', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({ id: 'p1', stateConceptId: INTEG.PROVIDER_ACTIVE });
      const conn: any = { id: 'c1', tenantId: 't1', stateConceptId: INTEG.CONN_ACTIVE, updatedAt: new Date() };
      d.connectionsRepo.create.mockReturnValue(conn);
      d.credentialsRepo.create.mockReturnValue({ id: 'cred1' });

      const res = await d.service.provisionConnection(
        'p1',
        { tenantId: 't1', secretType: 'API_KEY', secretRef: 'r' } as any,
        actor,
      );

      expect(res.credentialId).toBe('cred1');
      expect(conn.credentialId).toBe('cred1');
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });
  });

  describe('rotateCredential (UC-12-03)', () => {
    it('rejects when connection is not active (precondition)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1', stateConceptId: INTEG.CONN_PAUSED });
      await expect(
        d.service.rotateCredential('c1', { secretRef: 'new' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('retires the previous credential and links the new one', async () => {
      const d = build();
      const conn: any = { id: 'c1', stateConceptId: INTEG.CONN_ACTIVE, updatedAt: new Date() };
      d.connectionsRepo.findById.mockResolvedValue(conn);
      const prev: any = { id: 'old', stateConceptId: INTEG.CRED_ACTIVE, secretTypeConceptId: INTEG.SECRET_API_KEY, updatedAt: new Date() };
      d.credentialsRepo.findActiveByConnection.mockResolvedValue(prev);
      d.credentialsRepo.create.mockReturnValue({ id: 'new1' });

      const res = await d.service.rotateCredential('c1', { secretRef: 'new' } as any, actor);

      expect(res.credentialId).toBe('new1');
      expect(prev.stateConceptId).toBe(INTEG.CRED_RETIRED);
      expect(conn.credentialId).toBe('new1');
    });
  });

  describe('pauseConnection (UC-12-12)', () => {
    it('is a no-op when already paused (idempotent)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1', stateConceptId: INTEG.CONN_PAUSED });
      const res = await d.service.pauseConnection('c1', actor);
      expect(res.state).toBe(INTEG.CONN_PAUSED);
      expect(d.outboundRepo.holdQueuedForConnection).not.toHaveBeenCalled();
    });

    it('pauses an active connection and holds its queued messages', async () => {
      const d = build();
      const conn: any = { id: 'c1', stateConceptId: INTEG.CONN_ACTIVE, updatedAt: new Date() };
      d.connectionsRepo.findById.mockResolvedValue(conn);
      d.outboundRepo.holdQueuedForConnection.mockResolvedValue(3);

      const res = await d.service.pauseConnection('c1', actor);

      expect(conn.stateConceptId).toBe(INTEG.CONN_PAUSED);
      expect(res.heldMessages).toBe(3);
    });
  });
});
