import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Contratos de lectura de `/iam/users`.
 *
 * Ninguna de estas formas expone material secreto: el hash de la contraseña, la
 * clave pública de WebAuthn, el secreto del factor TOTP, el token de push y el
 * identificador del token de sesión se quedan en la entidad y no llegan al
 * contrato. Es la razón de que las respuestas se compongan campo a campo en vez
 * de devolver la entidad: un campo nuevo en el modelo no se publica solo.
 */

/** Una fila del listado de usuarios: lo justo para pintar la tabla y decidir a cuál entrar. */
export class UserListItemDto {
  /**
   * Identificador del usuario.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Nombre visible.
   */
  @ApiProperty()
  displayName!: string;

  /**
   * Estado de la cuenta.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Estado del segundo factor.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  mfaStatusConceptId?: string;

  /**
   * Si el correo consta verificado.
   */
  @ApiProperty()
  emailVerified!: boolean;

  /**
   * Si el teléfono consta verificado.
   */
  @ApiProperty()
  phoneVerified!: boolean;

  /**
   * Último ingreso registrado.
   */
  @ApiPropertyOptional({ nullable: true })
  lastLoginAt!: Date | null;

  /**
   * Alta de la cuenta.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Página del listado de usuarios. */
export class SearchUsersResponseDto {
  /**
   * Usuarios de esta página, ordenados por nombre visible.
   */
  @ApiProperty({ type: [UserListItemDto] })
  items!: UserListItemDto[];

  /**
   * Cantidad devuelta en esta página.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado a la consulta.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Cursor opaco de continuación, o `null` si ésta es la última página.
   */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}

/** Ficha de un usuario, sin nada que sirva para suplantarlo. */
export class UserDetailResponseDto extends UserListItemDto {
  /**
   * Zona horaria declarada.
   */
  @ApiPropertyOptional()
  timeZone?: string;

  /**
   * Idioma preferido.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  preferredLanguageConceptId?: string;

  /**
   * País de residencia declarado.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  residenceCountryConceptId?: string;

  /**
   * Región de residencia del dato.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  dataResidencyRegionConceptId?: string;

  /**
   * Base legal del tratamiento.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  legalBasisConceptId?: string;

  /**
   * Cuándo se aceptó la política de privacidad.
   */
  @ApiPropertyOptional({ nullable: true })
  privacyAcceptedAt!: Date | null;

  /**
   * Versión de la política aceptada.
   */
  @ApiPropertyOptional()
  privacyPolicyVersion?: string;

  /**
   * Si la cuenta exige cambiar la credencial en el próximo ingreso.
   */
  @ApiProperty()
  mustChangePassword!: boolean;

  /**
   * Cuándo se anonimizó la cuenta, si se anonimizó.
   */
  @ApiPropertyOptional({ nullable: true })
  anonymizedAt!: Date | null;

  /**
   * Última modificación del registro.
   */
  @ApiProperty()
  updatedAt!: Date;
}

/**
 * Una credencial del usuario. Nunca lleva `secret_hash` ni `public_key`: no hay
 * pantalla que los necesite y publicarlos convertiría la vista en un objetivo.
 */
export class CredentialListItemDto {
  /**
   * Identificador de la credencial.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Método de autenticación.
   */
  @ApiProperty({ format: 'uuid' })
  methodConceptId!: string;

  /**
   * Sujeto con el que se autentica (correo o documento).
   */
  @ApiPropertyOptional()
  externalSubject?: string;

  /**
   * Proveedor de identidad, en las credenciales federadas.
   */
  @ApiPropertyOptional()
  identityProvider?: string;

  /**
   * Estado de la credencial.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Último uso registrado.
   */
  @ApiPropertyOptional({ nullable: true })
  lastUsedAt!: Date | null;

  /**
   * Caducidad, si la tiene.
   */
  @ApiPropertyOptional({ nullable: true })
  expiresAt!: Date | null;

  /**
   * Alta de la credencial.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Un dispositivo del usuario. Nunca lleva el token de push cifrado. */
export class DeviceListItemDto {
  /**
   * Identificador del dispositivo.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Huella con la que el dispositivo se identifica.
   */
  @ApiPropertyOptional()
  deviceFingerprint?: string;

  /**
   * Plataforma del dispositivo.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  platformConceptId?: string;

  /**
   * Si tiene token de notificaciones registrado. Se publica la existencia, no el token.
   */
  @ApiProperty()
  hasPushToken!: boolean;

  /**
   * Última vez que se vio el dispositivo.
   */
  @ApiPropertyOptional({ nullable: true })
  lastSeenAt!: Date | null;

  /**
   * Alta del dispositivo.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Un factor de MFA. Nunca lleva el secreto cifrado. */
export class MfaFactorListItemDto {
  /**
   * Identificador del factor.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Mecanismo del segundo factor.
   */
  @ApiProperty({ format: 'uuid' })
  factorTypeConceptId!: string;

  /**
   * Estado del factor.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Cuándo se verificó, si se verificó.
   */
  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: Date | null;

  /**
   * Alta del factor.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Una sesión del usuario. Nunca lleva el identificador del token. */
export class SessionListItemDto {
  /**
   * Identificador de la sesión; es lo que se usa para revocarla.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Dispositivo desde el que se abrió, si se registró.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  deviceId!: string | null;

  /**
   * Ubicación aproximada registrada al abrirla.
   */
  @ApiPropertyOptional()
  geoLocation?: string;

  /**
   * Estado de la sesión.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Caducidad de la sesión.
   */
  @ApiPropertyOptional({ nullable: true })
  expiresAt!: Date | null;

  /**
   * Apertura de la sesión.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Un rol global asignado al usuario. */
export class GlobalRoleListItemDto {
  /**
   * Identificador de la asignación.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Rol global asignado.
   */
  @ApiProperty({ format: 'uuid' })
  roleConceptId!: string;

  /**
   * Estado de la asignación.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Cuándo se asignó.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Credenciales del usuario. */
export class ListCredentialsResponseDto {
  /**
   * Credenciales, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [CredentialListItemDto] })
  items!: CredentialListItemDto[];

  /**
   * Cuántas credenciales trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}

/** Dispositivos del usuario. */
export class ListDevicesResponseDto {
  /**
   * Dispositivos, del más reciente al más antiguo.
   */
  @ApiProperty({ type: [DeviceListItemDto] })
  items!: DeviceListItemDto[];

  /**
   * Cuántos dispositivos trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}

/** Factores de MFA del usuario. */
export class ListMfaFactorsResponseDto {
  /**
   * Factores, del más reciente al más antiguo.
   */
  @ApiProperty({ type: [MfaFactorListItemDto] })
  items!: MfaFactorListItemDto[];

  /**
   * Cuántos factores trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}

/** Sesiones del usuario. */
export class ListSessionsResponseDto {
  /**
   * Sesiones, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [SessionListItemDto] })
  items!: SessionListItemDto[];

  /**
   * Cuántas sesiones trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}

/** Roles globales del usuario. */
export class ListGlobalRolesResponseDto {
  /**
   * Asignaciones, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [GlobalRoleListItemDto] })
  items!: GlobalRoleListItemDto[];

  /**
   * Cuántas asignaciones trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}
