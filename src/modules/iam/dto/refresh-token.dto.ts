import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, ValidateIf } from 'class-validator';
import { loadRefreshCookieEnv } from '../../../common';

/**
 * Cuerpo de `POST /iam/auth/token/refresh` (UC-01-06).
 *
 * Con `AUTH_REFRESH_COOKIE_ENABLED=false` —el default— el campo es obligatorio
 * y el contrato es el de siempre. Con la cookie encendida el token viaja en
 * `Cookie` y el cuerpo va vacío, así que exigir el campo rechazaría con 400
 * todas las peticiones legítimas.
 */
export class RefreshTokenDto {
  /**
   * Valor de refresh token mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Refresh token en crudo emitido previamente. Obligatorio salvo que la API entregue el token como cookie httpOnly (AUTH_REFRESH_COOKIE_ENABLED), en cuyo caso se ignora y se lee de la cookie',
  })
  // El predicado de `@ValidateIf` se evalúa en CADA validación, no al decorar:
  // por eso se lee el entorno aquí dentro en vez de capturarlo en una constante
  // de módulo. Da igual el orden en que se cargue este archivo respecto a la
  // configuración, que es justo lo que hacía frágil la versión anterior.
  @ValidateIf(() => !loadRefreshCookieEnv().enabled)
  @IsString()
  @MinLength(1)
  refreshToken?: string;
}
