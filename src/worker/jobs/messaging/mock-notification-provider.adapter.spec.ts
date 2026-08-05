import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { createMockNotificationProviderAdapter } from './mock-notification-provider.adapter';

describe('createMockNotificationProviderAdapter', () => {
  it('llama al emulador con el channelId tal cual y refleja SENT', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      id: 'mock-id',
      outcome: 'SENT',
      providerMessageRef: 'mock-email-mock-id',
    });
    const adapter = createMockNotificationProviderAdapter(client as any);

    const outcome = await adapter({
      id: 'req-1',
      channelId: 'chan-1',
      statusConceptId: 'NOTIF_PENDING',
      payloadJson: { text: 'hola' },
      recipientAddress: 'a@b.com',
    });

    expect(client.post).toHaveBeenCalledWith('/notifications/send', {
      channel: 'chan-1',
      to: 'a@b.com',
      body: JSON.stringify({ text: 'hola' }),
      metadata: { notificationRequestId: 'req-1' },
    });
    expect(outcome).toEqual({
      outcome: 'SENT',
      providerMessageRef: 'mock-email-mock-id',
      errorCode: undefined,
      errorText: undefined,
    });
  });

  it('usa recipientUserId si no hay recipientAddress', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      id: 'x',
      outcome: 'FAILED',
      errorCode: 'E',
    });
    const adapter = createMockNotificationProviderAdapter(client as any);

    await adapter({
      id: 'req-2',
      channelId: 'chan-1',
      statusConceptId: 'NOTIF_PENDING',
      recipientUserId: 'user-9',
    });

    expect(client.post).toHaveBeenCalledWith(
      '/notifications/send',
      expect.objectContaining({ to: 'user-9' }),
    );
  });

  it('refleja un FAILED del emulador', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      id: 'x',
      outcome: 'FAILED',
      errorCode: 'SIMULATED_PROVIDER_ERROR',
      errorText: 'boom',
    });
    const adapter = createMockNotificationProviderAdapter(client as any);

    const outcome = await adapter({
      id: 'req-3',
      channelId: 'chan-1',
      statusConceptId: 'NOTIF_PENDING',
      recipientAddress: 'a@b.com',
    });

    expect(outcome.outcome).toBe('FAILED');
    expect(outcome.errorCode).toBe('SIMULATED_PROVIDER_ERROR');
  });
});
