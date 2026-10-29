import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Sessions } from '../../iam/entities';

/**
 * Acceso de sólo lectura a `iam.sessions` para la ingesta de telemetría.
 *
 * Las tablas de telemetría referencian la sesión por su `id` (UUID), mientras
 * que el token del actor la identifica por `token_id` (el claim `sid`). Esta
 * traducción es lo que permite derivar la sesión de la identidad autenticada
 * en lugar de aceptarla del cuerpo, y comprobar de quién es una sesión.
 */
@Injectable()
export class ActorSessionsRepository {
  /**
   * Resuelve el `id` de la sesión que respalda el token del actor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Usuario autenticado.
   * @param tokenId - Claim `sid` del token (`iam.sessions.token_id`).
   * @returns El `id` de la sesión, o `null` si el usuario no tiene esa sesión.
   */
  async findIdByToken(
    em: EntityManager,
    userId: string,
    tokenId: string,
  ): Promise<string | null> {
    const session = await em.findOne(Sessions, { userId, tokenId });
    return session?.id ?? null;
  }

  /**
   * Indica si una sesión pertenece a un usuario.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sessionId - `iam.sessions.id`.
   * @param userId - Usuario esperado.
   * @returns `true` sólo si la sesión existe y es del usuario.
   */
  async belongsToUser(
    em: EntityManager,
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    const session = await em.findOne(Sessions, { id: sessionId, userId });
    return session !== null;
  }
}
