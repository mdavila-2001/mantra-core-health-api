import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_ALGORITHM, loadAuthEnv } from './auth.env';
import type { JwtPayload } from './jwt-payload.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';

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
    tenantIds: payload.tenants ?? [],
    practitionerProfileId: payload.hpid,
    patientProfileId: payload.pid,
  };
}

/**
 * Estrategia Passport que valida el access token (firma + expiración) y
 * reconstruye el `AuthenticatedUser`. No consulta la base de datos: la sesión y
 * los roles viajan firmados dentro del token, y la revocación fina (logout,
 * reuse-detection) se resuelve en los servicios que sí tocan `iam.sessions`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Inicializa la instancia y sus dependencias.
   */
  constructor() {
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
  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException(
        'Tipo de token no válido para autenticación',
      );
    }
    return toAuthenticatedUser(payload);
  }
}
