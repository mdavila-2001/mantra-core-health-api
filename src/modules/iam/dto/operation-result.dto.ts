import { ApiProperty } from '@nestjs/swagger';

/** Resultado de `POST /iam/auth/logout-all` (UC-01-08). */
export class LogoutAllResultDto {
  /**
   * Valor de revoked sessions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de sesiones revocadas' })
  revokedSessions!: number;
}

/** Resultado de `POST /iam/auth/sessions/purge` (UC-01-11). */
export class PurgeResultDto {
  /**
   * Valor de expired sessions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de sesiones expiradas' })
  expiredSessions!: number;

  /**
   * Valor de expired tokens mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de refresh tokens expirados' })
  expiredTokens!: number;
}

/** Resultado genérico de una operación de estado (lock, revoke, anonymize, role). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}
