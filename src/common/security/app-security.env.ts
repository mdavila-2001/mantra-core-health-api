import * as Joi from 'joi';

const INSECURE_MFA_SECRET = 'dev-only-mfa-key-change-me';
const INSECURE_WEBHOOK_SECRET = 'dev-only-insecure-webhook-key-change-me';
const INSECURE_DOWNLOAD_SECRET = 'alovida-dev-download-secret';

/**
 * Secretos transversales usados por la API. En producción se validan durante el
 * bootstrap para que una instancia incompleta nunca llegue a readiness y falle
 * recién en el primer MFA, webhook o enlace de descarga.
 *
 * Fuera de producción los tres admiten cadena vacía y caen al valor de
 * desarrollo. No es cosmético: `docker-compose.yml` los pasa como
 * `${VARIABLE}`, que Compose materializa como **cadena vacía** cuando la
 * variable no está en el `.env`. `Joi.default()` sólo actúa sobre valores
 * ausentes, no vacíos, así que sin `empty('')` el contenedor moría en el
 * arranque con "is not allowed to be empty" en un entorno de desarrollo que no
 * necesita ninguno de estos secretos. En producción el `then` sigue exigiendo
 * una clave real de 32+ caracteres y distinta de la de desarrollo.
 */
export const appSecurityEnvSchema = Joi.object({
  MFA_ENCRYPTION_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).invalid(INSECURE_MFA_SECRET).required(),
    otherwise: Joi.string().empty('').default(INSECURE_MFA_SECRET),
  }),
  WEBHOOK_SIGNING_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).invalid(INSECURE_WEBHOOK_SECRET).required(),
    otherwise: Joi.string().empty('').default(INSECURE_WEBHOOK_SECRET),
  }),
  DOWNLOAD_URL_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).invalid(INSECURE_DOWNLOAD_SECRET).required(),
    otherwise: Joi.string().empty('').default(INSECURE_DOWNLOAD_SECRET),
  }),
}).unknown(true);
