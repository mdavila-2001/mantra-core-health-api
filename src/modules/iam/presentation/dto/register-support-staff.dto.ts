import { ApiProperty, PickType } from '@nestjs/swagger';
import { RegisterPatientDto } from './register-patient.dto';

/**
 * Cuerpo de `POST /iam/auth/register-support-staff`: el alta de una secretaria
 * (personal de apoyo hospitalario).
 *
 * Es el alta del paciente recortada a lo que identifica a una persona y le da
 * una cuenta: los mismos campos, con las mismas validaciones, heredados de
 * {@link RegisterPatientDto} con `PickType` para que las dos altas no puedan
 * divergir en cómo se escribe un documento, un nombre o un teléfono. No lleva
 * domicilio, seguros, tutor ni facturación: nada de eso hace falta para trabajar
 * en un hospital, y pedirlo sería juntar datos sin uso.
 *
 * El alta no da acceso a ningún hospital. La secretaria pide (o acepta) sus
 * vínculos después, por `POST /support-engagement-requests` o
 * `POST /me/support-engagements/:id/confirm`.
 */
export class RegisterSupportStaffDto extends PickType(RegisterPatientDto, [
  'nationalId',
  'issuerAdministrativeAreaConceptId',
  'password',
  'name',
  'middleName',
  'lastName',
  'motherLastName',
  'displayName',
  'email',
  'birthDate',
  'phone',
  'gender',
  'timeZone',
] as const) {}

/** Respuesta del alta de una secretaria. */
export class RegisterSupportStaffResponseDto {
  /** Cuenta creada. */
  @ApiProperty({ format: 'uuid' })
  userId!: string;

  /** Persona creada; también es el id de su perfil de secretaria. */
  @ApiProperty({ format: 'uuid' })
  personId!: string;

  /** Perfil de secretaria (`profiles.secretary_profiles.profile_id`). */
  @ApiProperty({ format: 'uuid' })
  supportProfileId!: string;

  /** Rol global con el que nace la cuenta. */
  @ApiProperty({ example: 'SUPPORT_STAFF' })
  role!: 'SUPPORT_STAFF';

  /** Si se encoló el correo de verificación. La cuenta es usable igual. */
  @ApiProperty()
  emailVerificationSent!: boolean;
}
