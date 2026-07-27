import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsWebhooksService } from './integrations-webhooks.service';
import { INTEG } from '../integrations.concepts';
import { ResourceNotFoundException } from '../../../common';

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const connectionsRepo = { findById: mockFn() };
  const inboundRepo = {
    findByConnectionAndSignature: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsWebhooksService(
    em as any,
    connectionsRepo as any,
    inboundRepo as any,
    logger as any,
  );
  return { service, tx, connectionsRepo, inboundRepo };
}

describe('IntegrationsWebhooksService', () => {
  describe('receiveInbound (UC-12-09)', () => {
    it('throws when the connection does not exist', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: {},
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('de-duplicates a redelivery by signature', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue({
        id: 'i0',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });
      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: {},
        signature: 'sig',
      });
      expect(res.duplicate).toBe(true);
      expect(res.id).toBe('i0');
      expect(d.inboundRepo.create).not.toHaveBeenCalled();
    });

    it('stores a new inbound message as RECEIVED', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      d.inboundRepo.create.mockReturnValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });
      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: { a: 1 },
        signature: 'sig',
      });
      expect(res.duplicate).toBe(false);
      expect(res.status).toBe(INTEG.INBOUND_RECEIVED);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });
});
