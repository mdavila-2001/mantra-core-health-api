import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `iam`, declarados aparte de las claves centrales
 * `iam:...` de `src/common/constants/concepts.ts`, que no se tocan. Las claves
 * (`iam:SESSION_POLICY_SCOPE_*`) las fija el modelo: los ids se derivan de la
 * clave y los CHECK de la base los usan como literales.
 */
export const { seeds: IAM_CONCEPT_SEEDS, ids: IAMC } = defineModuleConcepts(
  'iam',
  {
    SESSION_POLICY_SCOPE_ALL_ACCOUNTS: {
      code: 'SESSION_POLICY_SCOPE_ALL_ACCOUNTS',
      display: 'Session policy scope: all accounts',
    },
    SESSION_POLICY_SCOPE_ORG_STAFF: {
      code: 'SESSION_POLICY_SCOPE_ORG_STAFF',
      display: 'Session policy scope: organization staff',
    },
    SESSION_POLICY_SCOPE_ROLE: {
      code: 'SESSION_POLICY_SCOPE_ROLE',
      display: 'Session policy scope: one role',
    },
  },
);
