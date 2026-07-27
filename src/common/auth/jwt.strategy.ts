import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadAuthEnv } from './auth.env';
import type { JwtPayload } from './jwt-payload.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';

/**
 * Estrategia Passport que valida el access token (firma + expiración) y
 * reconstruye el `AuthenticatedUser`. No consulta la base de datos: la sesión y
 * los roles viajan firmados dentro del token, y la revocación fina (logout,
 * reuse-detection) se resuelve en los servicios que sí tocan `iam.sessions`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: loadAuthEnv().secret,
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
    return {
      id: payload.sub,
      sessionId: payload.sid,
      roles: payload.roles ?? [],
    };
  }
}
