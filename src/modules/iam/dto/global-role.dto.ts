import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/** Roles globales gestionables. */
export type GlobalRole = 'USER' | 'SECURITY_ADMIN' | 'SUPERADMIN';
/** Acción sobre el rol. */
export type RoleAction = 'GRANT' | 'REVOKE';

/** Cuerpo de `POST /iam/users/:id/global-roles` (UC-01-10). */
export class GlobalRoleDto {
  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: ['USER', 'SECURITY_ADMIN', 'SUPERADMIN'] })
  @IsIn(['USER', 'SECURITY_ADMIN', 'SUPERADMIN'])
  role!: GlobalRole;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ enum: ['GRANT', 'REVOKE'] })
  @IsIn(['GRANT', 'REVOKE'])
  action!: RoleAction;
}
