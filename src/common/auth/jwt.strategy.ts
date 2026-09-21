import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_ALGORITHM, loadAuthEnv } from './auth.env';
import type { JwtPayload } from './jwt-payload.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { SessionValidator } from './session-validator';

/**
 * Reconstruye el `AuthenticatedUser` a partir de un payload ya verificado.
 * Extraído de `JwtStrategy.validate` para que `WsJwtGuard` reconstruya el mismo
 * sujeto a partir de un token de socket.io sin duplicar el mapeo de claims.
 */
export function toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
  return {
    id: payload.sub,
    sessionId: payload.sid,
    roles: payload.roles ?? [],
    scopedRoles: payload.scopedRoles,
    tenantIds: payload.tenants ?? [],
    practitionerProfileId: payload.hpid,
    patientProfileId: payload.pid,
  };
}

/**
 * Estrategia Passport que valida el access token (firma + expiración + tipo),
 * exige que su sesión siga activa en `iam.sessions` y reconstruye el
 * `AuthenticatedUser`. La consulta de sesión es lo que hace efectivo el logout,
 * el bloqueo y el retiro de roles antes de que el token expire (MCH-004).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Inicializa la instancia y sus dependencias.
   */
  constructor(private readonly sessions: SessionValidator) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: loadAuthEnv().secret,
      // Se fija el algoritmo de verificación: passport-jwt aceptaría cualquiera
      // compatible con la clave; pinnearlo cierra la confusión de algoritmo.
      algorithms: [JWT_ALGORITHM],
    });
  }

  /**
   * Passport invoca `validate` solo si la firma es válida. Se comprueba además
   * que el token sea de tipo `access`: un refresh token nunca debe autenticar
   * una petición ordinaria aunque esté firmado con el mismo secreto.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException(
        'Tipo de token no válido para autenticación',
      );
    }
    await this.sessions.assertActive(payload);
    return toAuthenticatedUser(payload);
  }
}
