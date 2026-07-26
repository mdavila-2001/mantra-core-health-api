import type { SmokeCase } from './smoke-kit';
import { DIRECTORY_SMOKE } from './modules/directory.smoke';
import { PROFILES_SMOKE } from './modules/profiles.smoke';
import { AUTHZ_SMOKE } from './modules/authz.smoke';
import { CONSENT_SMOKE } from './modules/consent.smoke';
import { FORMS_SMOKE } from './modules/forms.smoke';
import { CLINICAL_SMOKE } from './modules/clinical.smoke';
import { AUDIT_SMOKE } from './modules/audit.smoke';
import { SYSTEM_OPS_SMOKE } from './modules/system_ops.smoke';
import { GEO_SMOKE } from './modules/geo.smoke';
import { PRACTICE_SMOKE } from './modules/practice.smoke';
import { CHART_SMOKE } from './modules/chart.smoke';
import { INTEGRATIONS_SMOKE } from './modules/integrations.smoke';

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
  // Clinical antes que Consent: el caso de consentimiento informado de tratamiento
  // consume un encounter real (`ctx.vars.clinEncounterId`) que produce clinical.
  ...CLINICAL_SMOKE,
  ...CONSENT_SMOKE,
  ...FORMS_SMOKE,
  ...AUDIT_SMOKE,
  ...SYSTEM_OPS_SMOKE,
  ...GEO_SMOKE,
  ...PRACTICE_SMOKE,
  ...CHART_SMOKE,
  ...INTEGRATIONS_SMOKE,
];
