import { describe, expect, it, jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { CommunityPharmacyOrderChatAdapter } from '../../infrastructure/adapters/community-pharmacy-order-chat.adapter';
import { CommunityOrderChatService } from '../../../community/services/community-order-chat.service';
import { fixture } from './pharmacy-orders.read-context.testing';

describe('order response forks preserve the HTTP transaction', () => {
  it('reads a newly created order before the enclosing request commits', async () => {
    const f = fixture();
    const response = await f.run(() =>
      f.service.create(
        {
          siteId: 'site',
          deliveryMode: 'RETIRO',
          lines: [{ productId: 'product', quantity: 1 }],
        },
        f.patient,
      ),
    );
    expect(response.id).toBe('order');
    expect(f.reservations.create).toHaveBeenCalledTimes(1);
    f.observe();
  });
  it('preserves the context of the idempotent response without another ERP call or reservation', async () => {
    const f = fixture();
    f.ordersRepo.findOrderByIdempotencyKey.mockResolvedValue(f.order);
    const response = await f.run(() =>
      f.service.create(
        {
          siteId: 'site',
          deliveryMode: 'RETIRO',
          idempotencyKey: 'synthetic-idempotency',
          lines: [{ productId: 'product', quantity: 1 }],
        },
        f.patient,
      ),
    );
    expect(response.id).toBe('order');
    expect(f.reservations.create).not.toHaveBeenCalled();
    expect(f.externalStock.resolve).not.toHaveBeenCalled();
    f.observe();
  });
  it('lists existing own orders without dropping the context needed to compose their pharmacy', async () => {
    const f = fixture();
    const response = await f.run(() => f.service.listMine(f.patient));
    expect(response.items.map((item) => item.id)).toEqual(['order']);
    f.observe();
  });
  it('uses a fresh fork with the same context after lazy expiry in listMine', async () => {
    const f = fixture(),
      expiry = f.lazyExpiry();
    const response = await f.run(() => f.service.listMine(f.patient));
    expect(response.count).toBe(1);
    expect(expiry).toHaveBeenCalledTimes(1);
    expect(f.reads).toHaveLength(2);
    expect(f.reads[0]).not.toBe(f.reads[1]);
    f.observe();
  });
  it('gets an own order while retaining the request transaction', async () => {
    const f = fixture();
    const response = await f.run(() => f.service.getOrder('order', f.patient));
    expect(response.id).toBe('order');
    f.observe();
  });
  it('uses a fresh fork with the same context after lazy expiry in getOrder', async () => {
    const f = fixture(),
      expiry = f.lazyExpiry();
    const response = await f.run(() => f.service.getOrder('order', f.patient));
    expect(response.id).toBe('order');
    expect(expiry).toHaveBeenCalledTimes(1);
    expect(f.reads).toHaveLength(2);
    expect(f.reads[0]).not.toBe(f.reads[1]);
    f.observe();
  });
  it('composes the staff transition response using a fresh fork in the same transaction', async () => {
    const f = fixture();
    const response = await f.run(() => f.service.openReview('order', f.staff));
    expect(response.id).toBe('order');
    expect(response.status.code).toBe('PINV_ORDER_EN_REVISION');
    f.observe();
  });
  it('does not let another patient read the order in the same tenant', async () => {
    const f = fixture();
    await expect(
      f.run(() =>
        f.service.getOrder('order', {
          ...f.patient,
          patientProfileId: 'other-patient',
        }),
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
  it('keeps an unaffiliated pharmacy staff request excluded without a global system bypass', async () => {
    const f = fixture();
    await expect(
      f.run(() => f.service.getOrder('order', f.staff), 'tenant-b'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
  it('preserves the same-tenant staff inbox pharmacy and order read context', async () => {
    const f = fixture();
    const response = await f.run(() =>
      f.service.listForPharmacyTenant({}, f.staff),
    );
    expect(response.items.map((item) => item.id)).toEqual(['order']);
    expect(f.ordersRepo.findPharmaciesByTenant).toHaveBeenCalledWith(
      expect.anything(),
      'tenant-a',
    );
    expect(f.ordersRepo.findOrdersForPharmacies).toHaveBeenCalledWith(
      expect.anything(),
      ['pharmacy'],
      expect.any(Array),
      expect.objectContaining({ limit: 100 }),
    );
    f.observe();
  });
  it('keeps a fresh staff inbox fork in the same transaction after lazy expiry', async () => {
    const f = fixture(),
      expiry = f.lazyExpiry();
    const response = await f.run(() =>
      f.service.listForPharmacyTenant({}, f.staff),
    );
    expect(response.count).toBe(1);
    expect(expiry).toHaveBeenCalledTimes(1);
    expect(f.reads).toHaveLength(2);
    expect(f.reads[0]).not.toBe(f.reads[1]);
    f.observe();
  });
  it('reaches the real missing-showcase 422 for the owner without creating a profile or conversation', async () => {
    const profiles = {
      listByIds: jest.fn(async () => []),
      listByTargetIds: jest.fn(async () => []),
      findByTarget: jest.fn(async () => null),
    };
    const messaging = {
      createSystemDirectConversation: jest.fn(async () => {
        throw new Error(
          'must never create a conversation in this read-only case',
        );
      }),
    };
    const f = fixture(
      (em) =>
        new CommunityPharmacyOrderChatAdapter(
          new CommunityOrderChatService(
            em,
            profiles as never,
            messaging as never,
            { verifiedActiveTenantIds: async () => new Set<string>() } as never,
            { setContext: () => undefined } as never,
          ),
        ),
    );
    const error: unknown = await f
      .run(() => f.service.openConversation('order', f.patient))
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect((error as PreconditionFailedException).getStatus()).toBe(422);
    expect((error as PreconditionFailedException).reason).toBe(
      'ORGANIZATION_CHAT_PROFILE_UNAVAILABLE',
    );
    expect(profiles.findByTarget).not.toHaveBeenCalled();
    expect(messaging.createSystemDirectConversation).not.toHaveBeenCalled();
    f.observe();
  });
});
