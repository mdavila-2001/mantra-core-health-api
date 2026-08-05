import { HttpException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { WORKER_ENV, type WorkerEnv } from './worker.tokens';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
/** Margen de seguridad antes de que expire el access token real de Google. */
const TOKEN_REFRESH_SKEW_MS = 60_000;

export interface SendEmailInput {
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
}

export interface SendEmailResult {
  messageId: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Cliente real de Gmail vía OAuth2 "3 patas" (cuenta Gmail normal, sin
 * Workspace: no hay delegación de dominio). Usa HTTP crudo contra las APIs
 * públicas de Google — mismo espíritu que `MockProviderClient` y
 * `SystemApiClient`: un cliente HTTP autenticado más, sin SDK pesado
 * (`googleapis` añadiría una dependencia grande para dos llamadas REST).
 *
 * El `refresh_token` se obtiene UNA vez con consentimiento interactivo del
 * usuario dueño de la cuenta (`tools/google-oauth/get-refresh-token.mjs`) y
 * se guarda en `GOOGLE_OAUTH_REFRESH_TOKEN`; este cliente lo cambia por un
 * `access_token` de corta vida en cada envío (cacheado en memoria del
 * proceso hasta que expira).
 */
@Injectable()
export class GoogleEmailClient {
  private cachedToken?: { accessToken: string; expiresAt: number };

  constructor(
    private readonly http: HttpService,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
  ) {}

  /** `false` si falta cualquiera de las 4 variables — el adapter cae al stub por defecto. */
  isConfigured(): boolean {
    return (
      this.env.googleOAuthClientId.length > 0 &&
      this.env.googleOAuthClientSecret.length > 0 &&
      this.env.googleOAuthRefreshToken.length > 0 &&
      this.env.googleSenderEmail.length > 0
    );
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const accessToken = await this.getAccessToken();
    const raw = encodeMimeMessage({
      from: this.env.googleSenderEmail,
      to: input.to,
      subject: input.subject,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
    });

    try {
      const response = await firstValueFrom(
        this.http.post<{ id: string }>(
          SEND_URL,
          { raw },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      );
      return { messageId: response.data.id };
    } catch (error) {
      throw GoogleEmailClient.toWorkerError('gmail.messages.send', error);
    }
  }

  /** Cambia el `refresh_token` por un `access_token` vigente; cachea hasta que expire. */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      return this.cachedToken.accessToken;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(
          TOKEN_URL,
          new URLSearchParams({
            client_id: this.env.googleOAuthClientId,
            client_secret: this.env.googleOAuthClientSecret,
            refresh_token: this.env.googleOAuthRefreshToken,
            grant_type: 'refresh_token',
          }).toString(),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        ),
      );
      this.cachedToken = {
        accessToken: response.data.access_token,
        expiresAt:
          now + response.data.expires_in * 1000 - TOKEN_REFRESH_SKEW_MS,
      };
      return this.cachedToken.accessToken;
    } catch (error) {
      throw GoogleEmailClient.toWorkerError('oauth2.token.refresh', error);
    }
  }

  private static toWorkerError(path: string, error: unknown): HttpException {
    if (error instanceof AxiosError) {
      const axiosError: AxiosError<unknown> = error;
      const status = axiosError.response?.status ?? 0;
      const body = axiosError.response?.data;
      return new HttpException(
        { path, status, body },
        status >= 400 ? status : 500,
      );
    }
    return new HttpException(
      { path, message: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
}

/** Palabra codificada RFC 2047: soporta tildes/ñ en el asunto sin romper el header. */
function encodeHeaderWord(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

/** Compone un mensaje RFC 2822 (texto plano, HTML, o ambos como multipart/alternative). */
function encodeMimeMessage(input: {
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
}): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderWord(input.subject)}`,
    'MIME-Version: 1.0',
  ];

  let message: string;
  if (input.bodyHtml && input.bodyText) {
    const boundary = `mantra-${Date.now()}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    message =
      headers.join('\r\n') +
      '\r\n\r\n' +
      `--${boundary}\r\n` +
      'Content-Type: text/plain; charset="UTF-8"\r\n\r\n' +
      `${input.bodyText}\r\n\r\n` +
      `--${boundary}\r\n` +
      'Content-Type: text/html; charset="UTF-8"\r\n\r\n' +
      `${input.bodyHtml}\r\n\r\n` +
      `--${boundary}--`;
  } else {
    const isHtml = Boolean(input.bodyHtml);
    headers.push(
      `Content-Type: text/${isHtml ? 'html' : 'plain'}; charset="UTF-8"`,
    );
    message =
      headers.join('\r\n') +
      '\r\n\r\n' +
      (input.bodyHtml ?? input.bodyText ?? '');
  }

  return Buffer.from(message, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
