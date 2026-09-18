import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { JWT_ALGORITHM } from './auth.env';
import { toAuthenticatedUser } from './jwt.strategy';
import type { JwtPayload } from './jwt-payload.interface';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { SessionValidator } from './session-validator';

/** `client.data` de un socket ya autenticado por `authenticateSocket`. */
export interface AuthenticatedSocketData {
  user: AuthenticatedUser;
}

/**
 * Autentica un socket de la mensajería en tiempo real con el mismo access
 * token que ya usa la API HTTP.
 *
 * No es un `CanActivate` de Nest: `handleConnection` de un gateway corre antes
 * de que exista un `ExecutionContext` de guards, así que la verificación se
 * hace acá y el gateway la llama directo al conectar. Mismo secreto y
 * algoritmo que `JwtStrategy` (`loadAuthEnv`/`JWT_ALGORITHM`), mismo mapeo a
 * `AuthenticatedUser` (`toAuthenticatedUser`) — nada se duplica, sólo cambia de
 * dónde sale el token: acá viaja en `handshake.auth.token`, no en la cabecera
 * `Authorization`.
 *
 * @throws UnauthorizedException si falta el token, es inválido, expiró, o no
 *   es un access token (`typ !== 'access'`).
 */
@Injectable()
export class WsJwtGuard {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param jwt - Firmador/verificador ya configurado con el secreto de la
   *   plataforma (`AuthTokenModule`, global).
   */
  constructor(
    private readonly jwt: JwtService,
    private readonly sessions: SessionValidator,
  ) {}

  /**
   * Verifica el token del handshake y devuelve el sujeto autenticado.
   *
   * @param client - Socket recién conectado.
   */
  async authenticate(client: Socket): Promise<AuthenticatedUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        algorithms: [JWT_ALGORITHM],
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (payload.typ !== 'access') {
      throw new UnauthorizedException(
        'Tipo de token no válido para autenticación',
      );
    }

    // Mismo criterio que HTTP: un token de una sesión cerrada no abre un socket.
    await this.sessions.assertActive(payload);
    return toAuthenticatedUser(payload);
  }

  /**
   * Sólo `handshake.auth.token`, nunca query string: un token en la URL queda
   * en logs de acceso, proxies intermedios e historial del navegador. Todo
   * cliente socket.io >= 3 soporta `auth`, así que no hace falta el fallback.
   */
  private extractToken(client: Socket): string | undefined {
    // `handshake.auth` es `{[key: string]: any}` en los tipos de socket.io;
    // se tipa explícito como `unknown` para no propagar ese `any`.
    const fromAuth: unknown = client.handshake.auth?.['token'];
    return typeof fromAuth === 'string' && fromAuth.length > 0
      ? fromAuth
      : undefined;
  }
}
