import { Injectable } from '@nestjs/common';
import { ROLE_CONCEPT_BY_CODE } from '../../../iam/domain/role-mapping';
import type { PlatformRoleCodesPort } from '../../application/ports/platform-role-codes.port';
import {
  DERIVED_RUNTIME_ROLES,
  SYSTEM_ROLE,
} from '../../domain/platform-roles';

/**
 * Roles que existen sin sembrarse en `authz.roles`: los globales de `iam`, la cuenta de servicio y
 * los que el login deriva de una membresía.
 */
export const PLATFORM_ROLE_CODES: readonly string[] = [
  ...Object.keys(ROLE_CONCEPT_BY_CODE),
  SYSTEM_ROLE,
  ...DERIVED_RUNTIME_ROLES,
];

/** Lee de `iam` (sólo su mapa puro de roles) los códigos globales de la plataforma. */
@Injectable()
export class IamPlatformRoleCodesAdapter implements PlatformRoleCodesPort {
  platformRoleCodes(): readonly string[] {
    return PLATFORM_ROLE_CODES;
  }
}
