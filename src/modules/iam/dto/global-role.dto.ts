import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

/**
 * Roles globales gestionables.
 *
 * Incluye `PATIENT` para poder concederlo a cuentas creadas antes de que el
 * auto-registro lo otorgara, o a las que un tercero dio de alta (C-18): sin esa
 * concesión el titular no puede usar el autoservicio del portal.
 */
export enum GlobalRole {
  USER = 'USER',
  SECURITY_ADMIN = 'SECURITY_ADMIN',
  SUPERADMIN = 'SUPERADMIN',
  PATIENT = 'PATIENT',
  /** Quién sos: agenda, recursos, tu propio perfil profesional. */
  PRACTITIONER = 'PRACTITIONER',
  /**
   * Qué podés leer y escribir de un paciente — es PHI.
   *
   * No se concede al registrarse: la matrícula nace `PENDING` y declararla no
   * es probarla. Lo concede un administrador, que es el acto que la verifica.
   */
  CLINICIAN = 'CLINICIAN',
}
/** Acción sobre el rol. */
export enum RoleAction {
  GRANT = 'GRANT',
  REVOKE = 'REVOKE',
}

/** Cuerpo de `POST /iam/users/:id/global-roles` (UC-01-10). */
export class GlobalRoleDto {
  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({ enum: GlobalRole })
  @IsEnum(GlobalRole)
  role!: GlobalRole;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ enum: RoleAction })
  @IsEnum(RoleAction)
  action!: RoleAction;
}
