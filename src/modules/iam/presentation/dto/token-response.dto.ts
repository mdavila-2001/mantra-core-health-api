import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Aviso de que la sesión se abrió desde un dispositivo que la persona no había usado. */
export class NewDeviceNoticeDto {
  /** Dispositivo, para confirmarlo con `POST /iam/me/devices/:id/confirm`. */
  @ApiProperty({ format: 'uuid' })
  deviceId!: string;

  /** Cómo se lo nombra a la persona: «Chrome en Windows». */
  @ApiProperty({ example: 'Chrome en Windows' })
  label!: string;

  /** Origen del inicio de sesión, tal como lo vio el servidor. */
  @ApiPropertyOptional()
  ip?: string;

  /** Cuándo se abrió la sesión. */
  @ApiProperty({ type: String, format: 'date-time' })
  occurredAt!: Date;
}

/** Una organización que no deja actuar ahora a la persona que sí entró. */
export class DeniedTenantDto {
  /** Organización. */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Por qué: `OUTSIDE_ALLOWED_HOURS`, `OUTSIDE_ALLOWED_NETWORK`, `IDLE_TIMEOUT`,
   * `MFA_REQUIRED` (presentar el código al iniciar sesión) o
   * `MFA_ENROLLMENT_REQUIRED` (dar de alta el segundo factor). Las peticiones con
   * `X-Tenant-Id` de esa organización reciben 403 con el mismo motivo.
   */
  @ApiProperty({
    enum: [
      'OUTSIDE_ALLOWED_HOURS',
      'OUTSIDE_ALLOWED_NETWORK',
      'IDLE_TIMEOUT',
      'MFA_REQUIRED',
      'MFA_ENROLLMENT_REQUIRED',
    ],
  })
  reason!: string;
}

/** Par de tokens emitido al iniciar sesión o rotar (UC-01-04 / UC-01-06). */
export class TokenResponseDto {
  /**
   * Valor de access token mantenido por la instancia.
   */
  @ApiProperty({ description: 'JWT de acceso' })
  accessToken!: string;

  /**
   * Valor de refresh token mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Refresh token en crudo; solo se entrega una vez',
  })
  refreshToken!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Expiración de la sesión',
  })
  expiresAt!: Date;

  /**
   * Solo en el login, y solo si el dispositivo es nuevo y alguna política
   * aplicable tiene `newDeviceAlert`. Es un aviso de presentación.
   */
  @ApiPropertyOptional({ type: NewDeviceNoticeDto })
  newDevice?: NewDeviceNoticeDto;

  /**
   * Solo en el login, y solo si una política exige el segundo paso y la cuenta
   * no tiene un factor confirmado: la persona debe darlo de alta con
   * `POST /iam/me/mfa/totp` y confirmarlo.
   */
  @ApiPropertyOptional()
  mfaEnrollmentRequired?: boolean;

  /**
   * Organizaciones a las que la persona pertenece pero en las que NO puede
   * actuar ahora (franja horaria, red, segundo factor). No están en `tenants` del
   * token: la política de una organización rige solo en ella y no le cierra la
   * sesión en las demás.
   */
  @ApiPropertyOptional({ type: [DeniedTenantDto] })
  deniedTenants?: DeniedTenantDto[];

  /**
   * Solo en el login y solo si la cookie de dispositivo está encendida
   * (`AUTH_DEVICE_COOKIE_ENABLED`): valor firmado que el controlador entrega
   * como cookie HttpOnly y QUITA del cuerpo. El cliente no lo ve.
   *
   * @internal
   */
  deviceCookie?: string;
}
