import { ROLE_CONCEPT_BY_CODE } from '../iam/domain/role-mapping';
import { clinicalRoleId, type ClinicalRoleSeed } from './authz.seed';

export const IAM_PDP_ROLE_BINDINGS = {
  SECURITY_ADMIN: ROLE_CONCEPT_BY_CODE.SECURITY_ADMIN,
  PRACTITIONER: ROLE_CONCEPT_BY_CODE.PRACTITIONER,
} as const;

/** Descriptor de política; el rol sólo se concede en IAM y no es asignable desde authz. */
export const IAM_POLICY_ROLE_SEED: readonly ClinicalRoleSeed[] = [
  {
    id: clinicalRoleId('SECURITY_ADMIN'),
    code: 'SECURITY_ADMIN',
    name: 'Administrador global de seguridad (concesión IAM)',
    baseRole: 'ADMIN',
    scope: 'GLOBAL',
    isAssignable: false,
  },
];
