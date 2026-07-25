import type { SmokeCase } from './smoke-kit';
import { DIRECTORY_SMOKE } from './modules/directory.smoke';
import { PROFILES_SMOKE } from './modules/profiles.smoke';
import { AUTHZ_SMOKE } from './modules/authz.smoke';
import { CONSENT_SMOKE } from './modules/consent.smoke';

/**
 * Registro de casos de smoke por módulo. El orquestador añade aquí una línea por
 * módulo a medida que se integra (importa su `modules/<modulo>.smoke.ts` y esparce
 * su arreglo). El runner recorre `ALL_SMOKE` tras la batería base de IAM/Common/
 * Terminology. Mantenerlo separado evita conflictos cuando varios módulos se
 * implementan en paralelo: cada uno aporta su propio archivo.
 */

// --- registro de módulos (el orquestador cablea con tools/wire-module.mjs) ---

export const ALL_SMOKE: SmokeCase[] = [
  ...DIRECTORY_SMOKE,
  ...PROFILES_SMOKE,
  ...AUTHZ_SMOKE,
  ...CONSENT_SMOKE,
];
