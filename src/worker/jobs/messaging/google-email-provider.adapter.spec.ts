import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { createGoogleEmailProviderAdapter } from './google-email-provider.adapter';

describe('createGoogleEmailProviderAdapter', () => {
  it('envía el subject/bodyText/bodyHtml del payload y refleja SENT con el messageId real', async () => {
    const client = { sendEmail: mockFn() };
    client.sendEmail.mockResolvedValue({ messageId: 'gmail-msg-1' });
    const adapter = createGoogleEmailProviderAdapter(client as any);

    const outcome = await adapter({
      id: 'req-1',
      channelId: 'EMAIL',
      statusConceptId: 'NOTIF_PENDING',
      recipientAddress: 'paciente@example.com',
      payloadJson: {
        subject: 'Verifica tu correo',
        bodyText: 'Tu código es 123456',
      },
    });

    expect(client.sendEmail).toHaveBeenCalledWith({
      to: 'paciente@example.com',
      subject: 'Verifica tu correo',
      bodyText: 'Tu código es 123456',
      bodyHtml: undefined,
    });
    expect(outcome).toEqual({
      outcome: 'SENT',
      providerMessageRef: 'gmail-msg-1',
    });
  });

  it('usa un asunto genérico y serializa el payload cuando no trae subject/body', async () => {
    const client = { sendEmail: mockFn() };
    client.sendEmail.mockResolvedValue({ messageId: 'gmail-msg-2' });
    const adapter = createGoogleEmailProviderAdapter(client as any);

    await adapter({
      id: 'req-2',
      channelId: 'EMAIL',
      statusConceptId: 'NOTIF_PENDING',
      recipientAddress: 'a@b.com',
      payloadJson: { foo: 'bar' },
    });

    expect(client.sendEmail).toHaveBeenCalledWith({
      to: 'a@b.com',
      subject: 'Notificación',
      bodyText: JSON.stringify({ foo: 'bar' }),
      bodyHtml: undefined,
    });
  });

  it('falla limpio (sin llamar a Gmail) cuando la solicitud no trae recipientAddress', async () => {
    const client = { sendEmail: mockFn() };
    const adapter = createGoogleEmailProviderAdapter(client as any);

    const outcome = await adapter({
      id: 'req-3',
      channelId: 'EMAIL',
      statusConceptId: 'NOTIF_PENDING',
      recipientUserId: 'user-9',
    });

    expect(client.sendEmail).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      outcome: 'FAILED',
      errorCode: 'MISSING_RECIPIENT_ADDRESS',
    });
  });

  it('refleja FAILED con el código de error cuando Gmail rechaza el envío', async () => {
    const client = { sendEmail: mockFn() };
    client.sendEmail.mockRejectedValue(new Error('invalid_grant'));
    const adapter = createGoogleEmailProviderAdapter(client as any);

    const outcome = await adapter({
      id: 'req-4',
      channelId: 'EMAIL',
      statusConceptId: 'NOTIF_PENDING',
      recipientAddress: 'a@b.com',
    });

    expect(outcome).toMatchObject({
      outcome: 'FAILED',
      errorCode: 'GMAIL_SEND_FAILED',
      errorText: 'invalid_grant',
    });
  });
});
