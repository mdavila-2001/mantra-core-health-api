import type { ConceptSeed } from './concept-seed';
import { DIRECTORY_CONCEPT_SEEDS } from '../../modules/directory/directory.concepts';
import { PROFILES_CONCEPT_SEEDS } from '../../modules/profiles/profiles.concepts';
import { AUTHZ_CONCEPT_SEEDS } from '../../modules/authz/authz.concepts';
import { CONSENT_CONCEPT_SEEDS } from '../../modules/consent/consent.concepts';
import { FORMS_CONCEPT_SEEDS } from '../../modules/forms/forms.concepts';
import { CLINICAL_CONCEPT_SEEDS } from '../../modules/clinical/clinical.concepts';
import { AUDIT_CONCEPT_SEEDS } from '../../modules/audit/audit.concepts';
import { SYSTEM_OPS_CONCEPT_SEEDS } from '../../modules/system_ops/system_ops.concepts';
import { GEO_CONCEPT_SEEDS } from '../../modules/geo/geo.concepts';
import { PRACTICE_CONCEPT_SEEDS } from '../../modules/practice/practice.concepts';
import { CHART_CONCEPT_SEEDS } from '../../modules/chart/chart.concepts';
import { INTEGRATIONS_CONCEPT_SEEDS } from '../../modules/integrations/integrations.concepts';
import { ACCOUNTING_CONCEPT_SEEDS } from '../../modules/accounting/accounting.concepts';
import { BILLING_CONCEPT_SEEDS } from '../../modules/billing/billing.concepts';
import { CLINICAL_EXT_CONCEPT_SEEDS } from '../../modules/clinical_ext/clinical_ext.concepts';
import { COMMUNITY_CONCEPT_SEEDS } from '../../modules/community/community.concepts';
import { ORGANIZATION_EXTENSIONS_CONCEPT_SEEDS } from '../../modules/organization_extensions/organization_extensions.concepts';
import { DIAGNOSTIC_UNITS_CONCEPT_SEEDS } from '../../modules/diagnostic_units/diagnostic_units.concepts';
import { PHARMACY_CONCEPT_SEEDS } from '../../modules/pharmacy/pharmacy.concepts';
import { DIAGNOSTICS_CONCEPT_SEEDS } from '../../modules/diagnostics/diagnostics.concepts';

/**
 * Agregador central de los conceptos declarados por cada módulo de dominio.
 *
 * El orquestador añade aquí una línea por módulo a medida que se integra (importa
 * su `<modulo>.concepts.ts` y esparce sus `seeds`). Mantenerlo separado del
 * `TerminologySeedService` permite que los módulos declaren sus conceptos sin
 * tocar la lógica del seed, y que el propio seed no conozca a los módulos.
 */

// --- registro de módulos (el orquestador cablea con tools/wire-module.mjs) ---

export const MODULE_CONCEPT_SEEDS: ConceptSeed[] = [
  ...DIRECTORY_CONCEPT_SEEDS,
  ...PROFILES_CONCEPT_SEEDS,
  ...AUTHZ_CONCEPT_SEEDS,
  ...CONSENT_CONCEPT_SEEDS,
  ...FORMS_CONCEPT_SEEDS,
  ...CLINICAL_CONCEPT_SEEDS,
  ...AUDIT_CONCEPT_SEEDS,
  ...SYSTEM_OPS_CONCEPT_SEEDS,
  ...GEO_CONCEPT_SEEDS,
  ...PRACTICE_CONCEPT_SEEDS,
  ...CHART_CONCEPT_SEEDS,
  ...INTEGRATIONS_CONCEPT_SEEDS,
  ...ACCOUNTING_CONCEPT_SEEDS,
  ...BILLING_CONCEPT_SEEDS,
  ...CLINICAL_EXT_CONCEPT_SEEDS,
  ...COMMUNITY_CONCEPT_SEEDS,
  ...ORGANIZATION_EXTENSIONS_CONCEPT_SEEDS,
  ...DIAGNOSTIC_UNITS_CONCEPT_SEEDS,
  ...PHARMACY_CONCEPT_SEEDS,
  ...DIAGNOSTICS_CONCEPT_SEEDS,
];
