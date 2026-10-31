import { DELEG } from './delegated_access.concepts';
import { IAMC } from '../iam/iam.concepts';
import { DIR } from '../directory/directory.concepts';
import { COMM } from '../community/community.concepts';
import { PRAC } from '../practice/practice.concepts';

/**
 * Los CHECK de la base usan estos ids como literales (ver
 * `SQL/29_delegated_access/05_constraints.sql`): si una clave cambia, el id
 * cambia y la base rechaza los permisos. Los valores vienen de CONCEPTOS.md del
 * modelo.
 */
describe('conceptos del personal de apoyo con ids fijados por el modelo', () => {
  it.each([
    [
      'SUPPORT_TARGET_PRACTITIONER',
      DELEG.SUPPORT_TARGET_PRACTITIONER,
      '785d1671-5754-58d3-b1a3-e3cd467b82b7',
    ],
    [
      'SUPPORT_TARGET_ALL',
      DELEG.SUPPORT_TARGET_ALL,
      'b1330928-a076-5348-bffd-154144fadc85',
    ],
    [
      'SUPPORT_EXPANSION_FIXED',
      DELEG.SUPPORT_EXPANSION_FIXED,
      '4f47115f-54ad-564f-bcd4-f06a0a0c13cd',
    ],
    [
      'SUPPORT_GRANT_ACTIVE',
      DELEG.SUPPORT_GRANT_ACTIVE,
      'ccfbc54f-4744-53db-ab1f-abe1af31f784',
    ],
    [
      'ENGAGEMENT_STATUS_PENDING',
      DELEG.ENGAGEMENT_STATUS_PENDING,
      '0aedb9a7-2bca-51ae-a086-c234e61782f6',
    ],
    [
      'ROLE_TEMPLATE_ACTIVE',
      DELEG.ROLE_TEMPLATE_ACTIVE,
      '6b070aec-a5af-52bc-8462-55be0d26298a',
    ],
    [
      'AFFILIATION_INVITE_ACTIVE',
      DIR.AFFILIATION_INVITE_ACTIVE,
      'ba78fe78-e802-5a35-b51e-0d38ceea7aac',
    ],
    [
      'SESSION_POLICY_SCOPE_ROLE',
      IAMC.SESSION_POLICY_SCOPE_ROLE,
      'b9137390-37e5-5de6-95cf-fc53860563fe',
    ],
    [
      'CONVERSATION_ASSIGNMENT_NEW',
      COMM.CONVERSATION_ASSIGNMENT_NEW,
      '0c2c8c70-2e98-55d1-82c4-764218621f8d',
    ],
    [
      'SPACE_TYPE_BUILDING',
      PRAC.SPACE_TYPE_BUILDING,
      '0273c9c6-a093-5a20-9096-19558961fbd8',
    ],
  ])('%s', (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
