import { Inject, Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../modules/redis_runtime/redis.provider';
import { CONCEPTS, SEED } from '../constants/concepts';
import type { JwtPayload } from './jwt-payload.interface';
import { unauthorizedWithReason } from '../errors/reasoned-http-exceptions';
import { SystemErrorReason } from '../errors/system-error-reasons';

/**
 * Comprueba contra `iam.sessions` que el access token siga respaldado por una
 * sesión viva (MCH-004).
 *
 * La firma y la expiración sólo dicen que el token lo emitimos nosotros y que no
 * pasaron quince minutos. No dicen si la persona cerró sesión, si se bloqueó la
 * cuenta o si se le retiró un rol: todo eso revoca la sesión en la base, y sin
 * esta consulta el token seguía sirviendo hasta expirar. Un token robado
 * sobrevivía justamente al gesto que busca cortarlo.
 *
 * La blacklist Redis se comprueba antes de la consulta por petición sobre el
 * índice único `uq_sessions_token_id`. Ante un fallo de Redis o de la base la
 * respuesta es rechazar, no suponer.
 */
@Injectable()
export class SessionValidator {
  private readonly revocationKeyPrefix = 'iam:auth:revoked-session:';
  /**
   * @param em - Contexto de persistencia; sólo se usa para una lectura.
   */
  constructor(
    private readonly em: EntityManager,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {}

  /** Guarda la sesión revocada en Redis hasta que expire el access token. */
  async revokeSession(sessionId: string, expiresAt?: number): Promise<void> {
    if (!this.redis)
      throw new Error('Redis no está disponible para revocar sesiones');
    const ttlSeconds = Math.ceil((expiresAt ?? 0) - Date.now() / 1000);
    if (ttlSeconds <= 0) return;
    await this.redis.set(
      `${this.revocationKeyPrefix}${sessionId}`,
      '1',
      'EX',
      ttlSeconds,
    );
  }

  /**
   * Lanza si la sesión del token no está activa.
   *
   * @param payload - Claims ya verificados (firma, expiración y tipo).
   * @throws UnauthorizedException (`SESSION_REQUIRED`/`SESSION_INACTIVE`) si
   *   la sesión fue revocada, venció, es de otro usuario o la cuenta no está activa.
   */
  async assertActive(payload: JwtPayload): Promise<void> {
    // La identidad de servicio de los workers firma tokens de corta vida sin
    // sesión en `iam.sessions` (`SystemApiClientService`). Separarla en una
    // credencial propia con scopes mínimos es F02-T03; mientras tanto se la
    // reconoce por su usuario fijo, que nadie puede usar para iniciar sesión.
    if (payload.sub === SEED.systemWorkerUserId) return;

    if (!payload.sid) {
      throw unauthorizedWithReason(
        'Token sin sesión',
        SystemErrorReason.SESSION_REQUIRED,
      );
    }

    if (!this.redis)
      throw new Error('Redis no está disponible para validar sesiones');
    if (await this.redis.get(`${this.revocationKeyPrefix}${payload.sid}`)) {
      throw unauthorizedWithReason(
        'La sesión ya no está activa',
        SystemErrorReason.SESSION_INACTIVE,
      );
    }

    const rows = await this.em.getConnection().execute<unknown[]>(
      `select 1 as ok
         from iam.sessions s
         join iam.users u on u.id = s.user_id
        where s.token_id = ?
          and s.user_id = ?
          and s.state_concept_id = ?
          and s.expires_at > now()
          and u.status_concept_id = ?`,
      [payload.sid, payload.sub, CONCEPTS.STATE_ACTIVE, CONCEPTS.USER_ACTIVE],
    );
    if (rows.length === 0) {
      throw unauthorizedWithReason(
        'La sesión ya no está activa',
        SystemErrorReason.SESSION_INACTIVE,
      );
    }
  }
}
