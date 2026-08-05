import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { loadWorkerEnv } from '../../src/worker/worker.env';
import { WORKER_ENV } from '../../src/worker/worker.tokens';
import { GoogleEmailClient } from '../../src/worker/google-email-client.service';

const env = loadWorkerEnv();
const configured =
  env.googleOAuthClientId.length > 0 &&
  env.googleOAuthClientSecret.length > 0 &&
  env.googleOAuthRefreshToken.length > 0 &&
  env.googleSenderEmail.length > 0;

/**
 * Opt-in (como `rls.int-spec.ts`): sólo corre si `GOOGLE_OAUTH_CLIENT_ID`,
 * `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` y
 * `GOOGLE_SENDER_EMAIL` están configuradas en el entorno — nadie más tiene
 * estas credenciales, así que el resto de `yarn test:integration` no debe
 * fallar por su ausencia. Envía un correo REAL (a la propia cuenta
 * remitente, que es la única dirección que garantizamos válida) vía la
 * Gmail API real — no un mock — para demostrar que el intercambio del
 * `refresh_token` por un `access_token` y el envío en sí funcionan de
 * punta a punta contra Google, no sólo contra HTTP mockeado.
 */
(configured ? describe : describe.skip)(
  'Google Gmail — envío real (integración, opt-in)',
  () => {
    let client: GoogleEmailClient;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [HttpModule.register({ timeout: 30_000 })],
        providers: [{ provide: WORKER_ENV, useValue: env }, GoogleEmailClient],
      }).compile();
      client = moduleRef.get(GoogleEmailClient);
    });

    it('cambia el refresh_token por un access_token real y Gmail acepta el envío', async () => {
      const result = await client.sendEmail({
        to: env.googleSenderEmail,
        subject: 'Prueba de integración — mantra-core-health',
        bodyText: `Envío de prueba real vía Gmail API, ${new Date().toISOString()}.`,
      });

      expect(result.messageId).toEqual(expect.any(String));
      expect(result.messageId.length).toBeGreaterThan(0);
    });
  },
);
