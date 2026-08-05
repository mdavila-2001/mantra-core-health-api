import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { JWT_ALGORITHM, loadAuthEnv } from './auth.env';
import type { JwtPayload } from './jwt-payload.interface';

/** Par de tokens emitido al abrir o rotar una sesión. */
export interface IssuedTokens {
  /**
   * Valor de access token mantenido por la instancia.
   */
  accessToken: string;
  /** Refresh token en crudo; solo se devuelve al cliente, nunca se persiste. */
  refreshToken: string;
  /** Hash SHA-256 del refresh token; es lo que se guarda en la base de datos. */
  refreshTokenHash: string;
  /** Identificador de sesión (`token_id`) embebido en el access token. */
  sessionTokenId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
}

/**
 * Fábrica y verificador de tokens de sesión. Aísla la política criptográfica
 * (firma, hashing del refresh, expiración) del resto de la capa IAM, de modo que
 * los servicios razonen sobre sesiones sin manipular secretos directamente.
 */
/**
 * Lo que el token lleva sólo para poder mostrarse. No participa de ninguna
 * decisión de autorización: si faltara, el token seguiría siendo igual de válido.
 */
export interface TokenDisplayData {
  /** Nombre para mostrar del usuario. */
  name?: string;
  /** Nombre de cada tenant, indexado por su id. */
  tenantNames?: Record<string, string>;
}

@Injectable()
export class TokenService {
  /**
   * Valor de env mantenido por la instancia.
   */
  private readonly env = loadAuthEnv();

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param jwt - Valor de jwt requerido por la operación.
   */
  constructor(private readonly jwt: JwtService) {}

  /**
   * Firma un access token para el sujeto y sesión indicados.
   *
   * @param userId - Sujeto del token.
   * @param sessionTokenId - Sesión a la que queda anclado.
   * @param roles - Roles globales, para no resolverlos por petición.
   * @param tenants - Ids de los tenants con membresía activa.
   * @param display - Datos de presentación (nombre, nombres de tenant); opcional
   *   porque los procesos worker firman su propio token y no muestran nada.
   */
  signAccessToken(
    userId: string,
    sessionTokenId: string,
    roles: string[],
    tenants: string[] = [],
    display: TokenDisplayData = {},
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      sid: sessionTokenId,
      roles,
      tenants,
      // Se omiten si no hay nada que poner: un claim vacío ocupa espacio en cada
      // cabecera de cada petición y no dice nada.
      ...(display.name ? { name: display.name } : {}),
      ...(display.tenantNames && Object.keys(display.tenantNames).length > 0
        ? { tenantNames: display.tenantNames }
        : {}),
      typ: 'access',
    };
    // `expiresIn` acepta un string tipo `15m`; el tipo de la librería exige un
    // literal `StringValue`, así que se afirma la forma de las opciones.
    const options = {
      secret: this.env.secret,
      expiresIn: this.env.accessTtl,
      algorithm: JWT_ALGORITHM,
    } as JwtSignOptions;
    return this.jwt.sign(payload, options);
  }

  /**
   * Genera un refresh token de alta entropía. Se persiste únicamente su hash:
   * una filtración de la tabla no basta para suplantar sesiones, y la
   * comparación en el refresh se hace por hash del valor presentado.
   */
  issueRefreshToken(): {
    /**
     * Valor de raw mantenido por la instancia.
     */
    raw: string; /**
     * Valor de hash mantenido por la instancia.
     */
    hash: string;
  } {
    const raw = randomBytes(48).toString('base64url');
    return { raw, hash: this.hashRefreshToken(raw) };
  }

  /** Hash determinista del refresh token para búsqueda y comparación. */
  hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Construye el conjunto completo de tokens de una nueva sesión: id de sesión,
   * access token firmado, refresh token y su hash, y la fecha de expiración del
   * refresh derivada de `JWT_REFRESH_TTL_DAYS`.
   */
  issueSessionTokens(
    userId: string,
    roles: string[],
    tenants: string[] = [],
    display: TokenDisplayData = {},
  ): IssuedTokens {
    const sessionTokenId = randomUUID();
    const { raw, hash } = this.issueRefreshToken();
    const expiresAt = new Date(
      Date.now() + this.env.refreshTtlDays * 24 * 60 * 60 * 1000,
    );
    return {
      accessToken: this.signAccessToken(
        userId,
        sessionTokenId,
        roles,
        tenants,
        display,
      ),
      refreshToken: raw,
      refreshTokenHash: hash,
      sessionTokenId,
      expiresAt,
    };
  }
}
