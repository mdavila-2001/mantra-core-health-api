import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, SEED } from '../constants/concepts';
import type { JwtPayload } from './jwt-payload.interface';

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
 * Es una consulta por petición sobre el índice único `uq_sessions_token_id`. No
 * hay caché a propósito: una caché de positivos reabre la ventana que esto
 * cierra, y ante un fallo de la base la respuesta es rechazar, no suponer.
 */
@Injectable()
export class SessionValidator {
  /**
   * @param em - Contexto de persistencia; sólo se usa para una lectura.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Lanza si la sesión del token no está activa.
   *
   * @param payload - Claims ya verificados (firma, expiración y tipo).
   * @throws UnauthorizedException si la sesión fue revocada, venció, es de otro
   *   usuario o la cuenta no está activa.
   */
  async assertActive(payload: JwtPayload): Promise<void> {
    // La identidad de servicio de los workers firma tokens de corta vida sin
    // sesión en `iam.sessions` (`SystemApiClientService`). Separarla en una
    // credencial propia con scopes mínimos es F02-T03; mientras tanto se la
    // reconoce por su usuario fijo, que nadie puede usar para iniciar sesión.
    if (payload.sub === SEED.systemWorkerUserId) return;

    if (!payload.sid) {
      throw new UnauthorizedException('Token sin sesión');
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
      throw new UnauthorizedException('La sesión ya no está activa');
    }
  }
}
