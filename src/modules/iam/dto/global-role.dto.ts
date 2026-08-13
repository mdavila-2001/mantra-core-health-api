import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

/**
 * Roles globales gestionables.
 *
 * Incluye `PATIENT` para poder concederlo a cuentas creadas antes de que el
 * auto-registro lo otorgara, o a las que un tercero dio de alta (C-18): sin esa
 * concesión el titular no puede usar el autoservicio del portal.
 */
export type GlobalRole =
  | 'USER'
  | 'SECURITY_ADMIN'
  | 'SUPERADMIN'
  | 'PATIENT'
  /** Quién sos: agenda, recursos, tu propio perfil profesional. */
  | 'PRACTITIONER'
  /**
   * Qué podés leer y escribir de un paciente — es PHI.
   *
   * No se concede al registrarse: la matrícula nace `PENDING` y declararla no
   * es probarla. Lo concede un administrador, que es el acto que la verifica.
   */
  | 'CLINICIAN';
/** Acción sobre el rol. */
export type RoleAction = 'GRANT' | 'REVOKE';

/** Cuerpo de `POST /iam/users/:id/global-roles` (UC-01-10). */
export class GlobalRoleDto {
  /**
   * Valor de role mantenido por la instancia.
   */
  @ApiProperty({
    enum: [
      'USER',
      'SECURITY_ADMIN',
      'SUPERADMIN',
      'PATIENT',
      'PRACTITIONER',
      'CLINICIAN',
    ],
  })
  @IsIn([
    'USER',
    'SECURITY_ADMIN',
    'SUPERADMIN',
    'PATIENT',
    'PRACTITIONER',
    'CLINICIAN',
  ])
  role!: GlobalRole;

  /**
   * Valor de action mantenido por la instancia.
   */
  @ApiProperty({ enum: ['GRANT', 'REVOKE'] })
  @IsIn(['GRANT', 'REVOKE'])
  action!: RoleAction;
}
