import type { ConceptSeed } from './concept-seed';
import { DIRECTORY_CONCEPT_SEEDS } from '../../modules/directory/directory.concepts';
import { PROFILES_CONCEPT_SEEDS } from '../../modules/profiles/profiles.concepts';
import { AUTHZ_CONCEPT_SEEDS } from '../../modules/authz/authz.concepts';
import { CONSENT_CONCEPT_SEEDS } from '../../modules/consent/consent.concepts';
import { FORMS_CONCEPT_SEEDS } from '../../modules/forms/forms.concepts';
import { CLINICAL_CONCEPT_SEEDS } from '../../modules/clinical/clinical.concepts';
import { AUDIT_CONCEPT_SEEDS } from '../../modules/audit/audit.concepts';
import { SYSTEM_OPS_CONCEPT_SEEDS } from '../../modules/system_ops/system_ops.concepts';

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
];
