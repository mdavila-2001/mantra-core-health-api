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
import { SCHEDULING_SMOKE } from './modules/scheduling.smoke';
import { CHART_SMOKE } from './modules/chart.smoke';
import { INTEGRATIONS_SMOKE } from './modules/integrations.smoke';
import { ACCOUNTING_SMOKE } from './modules/accounting.smoke';
import { BILLING_SMOKE } from './modules/billing.smoke';
import { CLINICAL_EXT_SMOKE } from './modules/clinical_ext.smoke';
import { COMMUNITY_SMOKE } from './modules/community.smoke';
import { ORGANIZATION_EXTENSIONS_SMOKE } from './modules/organization_extensions.smoke';
import { DIAGNOSTIC_UNITS_SMOKE } from './modules/diagnostic_units.smoke';
import { PHARMACY_SMOKE } from './modules/pharmacy.smoke';
import { DIAGNOSTICS_SMOKE } from './modules/diagnostics.smoke';
import { IDENTITY_ASSURANCE_SMOKE } from './modules/identity_assurance.smoke';
import { DELEGATED_ACCESS_SMOKE } from './modules/delegated_access.smoke';
import { READ_MODELS_SMOKE } from './modules/read_models.smoke';
import { INTEGRATION_CONTRACTS_SMOKE } from './modules/integration_contracts.smoke';
// Agrupado por actor, no por módulo: el recorrido completo de un paciente con su propio token.
import { PACIENTE_SMOKE } from './modules/paciente.smoke';
import { MEDICO_SMOKE } from './modules/medico.smoke';
import { ORGANIZACION_SMOKE } from './modules/organizacion.smoke';
import { ADMINISTRADOR_SMOKE } from './modules/administrador.smoke';
import { PHARMACY_INVENTORY_SMOKE } from './modules/pharmacy_inventory.smoke';
import { INSURANCE_SMOKE } from './modules/insurance.smoke';
import { TELEMETRY_SMOKE } from './modules/telemetry.smoke';

/**
 * Registro de casos de smoke por módulo. El orquestador añade aquí una línea por
 * módulo a medida que se integra (importa su `modules/<modulo>.smoke.ts` y esparce
 * su arreglo). El runner recorre `ALL_SMOKE` tras la batería base de IAM/Common/
 * Terminology. Mantenerlo separado evita conflictos cuando varios módulos se
 * implementan en paralelo: cada uno aporta su propio archivo.
 */

// --- registro de módulos (el orquestador cablea con tools/wire-module.mjs) ---

/**
 * Marca los casos de admin de un módulo con `tenantScoped`: el admin del smoke es `SUPERADMIN`, su
 * tenant sale del encabezado `X-Tenant-Id`, y las rutas con datos de tenant responden 422
 * `TENANT_REQUIRED` sin él. Los casos sin autenticación o con el token de otro actor quedan igual.
 */
const enTenantSemilla = (casos: SmokeCase[]): SmokeCase[] =>
  casos.map((c) =>
    c.auth === false || c.token ? c : { ...c, tenantScoped: true },
  );

export const ALL_SMOKE: SmokeCase[] = [
  ...DIRECTORY_SMOKE,
  ...PROFILES_SMOKE,
  ...AUTHZ_SMOKE,
  // Clinical antes que Consent: el caso de consentimiento informado de tratamiento
  // consume un encounter real (`ctx.vars.clinEncounterId`) que produce clinical.
  ...CLINICAL_SMOKE,
  ...enTenantSemilla(CONSENT_SMOKE),
  ...FORMS_SMOKE,
  ...AUDIT_SMOKE,
  ...SYSTEM_OPS_SMOKE,
  ...enTenantSemilla(GEO_SMOKE),
  ...enTenantSemilla(PRACTICE_SMOKE),
  // Scheduling después de Profiles: consume el paciente y el profesional reales
  // que aquél publica en `ctx.vars`.
  ...enTenantSemilla(SCHEDULING_SMOKE),
  ...CHART_SMOKE,
  ...enTenantSemilla(INTEGRATIONS_SMOKE),
  ...enTenantSemilla(ACCOUNTING_SMOKE),
  ...enTenantSemilla(BILLING_SMOKE),
  ...enTenantSemilla(CLINICAL_EXT_SMOKE),
  ...COMMUNITY_SMOKE,
  ...enTenantSemilla(ORGANIZATION_EXTENSIONS_SMOKE),
  ...enTenantSemilla(DIAGNOSTIC_UNITS_SMOKE),
  ...enTenantSemilla(PHARMACY_SMOKE),
  ...enTenantSemilla(DIAGNOSTICS_SMOKE),
  ...enTenantSemilla(IDENTITY_ASSURANCE_SMOKE),
  ...enTenantSemilla(DELEGATED_ACCESS_SMOKE),
  ...READ_MODELS_SMOKE,
  ...enTenantSemilla(INTEGRATION_CONTRACTS_SMOKE),
  ...enTenantSemilla(PHARMACY_INVENTORY_SMOKE),
  ...enTenantSemilla(INSURANCE_SMOKE),
  ...TELEMETRY_SMOKE,
  // Va al final: cierra sesión del paciente y su recorrido no debe alterar el estado que
  // esperan los casos por módulo.
  ...PACIENTE_SMOKE,
  ...MEDICO_SMOKE,
  ...ORGANIZACION_SMOKE,
  ...ADMINISTRADOR_SMOKE,
];
