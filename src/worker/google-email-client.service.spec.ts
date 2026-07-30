import { jest } from '@jest/globals';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosHeaders } from 'axios';
import { GoogleEmailClient } from './google-email-client.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ENV = {
  googleOAuthClientId: 'client-id',
  googleOAuthClientSecret: 'client-secret',
  googleOAuthRefreshToken: 'refresh-token',
  googleSenderEmail: 'no-reply@example.com',
};

function build(env: Partial<typeof ENV> = {}) {
  const http = { post: mockFn() };
  const client = new GoogleEmailClient(http as any, { ...ENV, ...env } as any);
  return { client, http };
}

/** Decodifica el `raw` base64url que se manda a Gmail de vuelta a texto RFC 2822. */
function decodeRaw(raw: string): string {
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf8');
}

describe('GoogleEmailClient', () => {
  describe('isConfigured', () => {
    it('true sólo cuando las 4 variables están presentes', () => {
      expect(build().client.isConfigured()).toBe(true);
      expect(build({ googleSenderEmail: '' }).client.isConfigured()).toBe(
        false,
      );
      expect(build({ googleOAuthClientId: '' }).client.isConfigured()).toBe(
        false,
      );
    });
  });

  describe('sendEmail', () => {
    it('pide un access_token con el refresh_token y llama Gmail con Bearer + el mensaje MIME', async () => {
      const d = build();
      d.http.post
        .mockReturnValueOnce(
          of({ data: { access_token: 'tok-1', expires_in: 3600 } } as any),
        )
        .mockReturnValueOnce(of({ data: { id: 'gmail-id-1' } } as any));

      const result = await d.client.sendEmail({
        to: 'paciente@example.com',
        subject: 'Código de verificación',
        bodyText: 'Tu código es 123456',
      });

      expect(result).toEqual({ messageId: 'gmail-id-1' });

      const [tokenUrl, tokenBody, tokenConfig] = d.http.post.mock.calls[0] as any[];
      expect(tokenUrl).toBe('https://oauth2.googleapis.com/token');
      expect(tokenBody).toContain('refresh_token=refresh-token');
      expect(tokenBody).toContain('client_id=client-id');
      expect(tokenConfig.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded',
      );

      const [gmailUrl, gmailBody, gmailConfig] = d.http.post.mock
        .calls[1] as any[];
      expect(gmailUrl).toBe(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      );
      expect(gmailConfig.headers.Authorization).toBe('Bearer tok-1');
      const decoded = decodeRaw(gmailBody.raw);
      expect(decoded).toContain('From: no-reply@example.com');
      expect(decoded).toContain('To: paciente@example.com');
      expect(decoded).toContain('Tu código es 123456');
    });

    it('cachea el access_token: una segunda llamada no vuelve a pedir token', async () => {
      const d = build();
      d.http.post
        .mockReturnValueOnce(
          of({ data: { access_token: 'tok-1', expires_in: 3600 } } as any),
        )
        .mockReturnValueOnce(of({ data: { id: 'gmail-id-1' } } as any))
        .mockReturnValueOnce(of({ data: { id: 'gmail-id-2' } } as any));

      await d.client.sendEmail({ to: 'a@b.com', subject: 's', bodyText: 'x' });
      await d.client.sendEmail({ to: 'a@b.com', subject: 's2', bodyText: 'y' });

      // 1 llamada de token + 2 de envío = 3, no 4.
      expect(d.http.post).toHaveBeenCalledTimes(3);
    });

    it('compone multipart/alternative cuando hay bodyText y bodyHtml', async () => {
      const d = build();
      d.http.post
        .mockReturnValueOnce(
          of({ data: { access_token: 'tok-1', expires_in: 3600 } } as any),
        )
        .mockReturnValueOnce(of({ data: { id: 'gmail-id-1' } } as any));

      await d.client.sendEmail({
        to: 'a@b.com',
        subject: 's',
        bodyText: 'plano',
        bodyHtml: '<b>html</b>',
      });

      const [, gmailBody] = d.http.post.mock.calls[1] as any[];
      const decoded = decodeRaw(gmailBody.raw);
      expect(decoded).toContain('multipart/alternative');
      expect(decoded).toContain('plano');
      expect(decoded).toContain('<b>html</b>');
    });

    it('convierte un error real de Gmail en HttpException con el status devuelto', async () => {
      const d = build();
      const axiosError = new AxiosError(
        'Request failed',
        '401',
        { headers: new AxiosHeaders() } as any,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config: { headers: new AxiosHeaders() } as any,
          data: { error: 'invalid_grant' },
        },
      );
      d.http.post
        .mockReturnValueOnce(
          of({ data: { access_token: 'tok-1', expires_in: 3600 } } as any),
        )
        .mockReturnValueOnce(throwError(() => axiosError));

      await expect(
        d.client.sendEmail({ to: 'a@b.com', subject: 's', bodyText: 'x' }),
      ).rejects.toMatchObject({ status: 401 });
    });
  });
});
