import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SocialNotifications } from '../entities';

/**
 * Acceso a datos de `community.social_notifications` (bandeja social).
 *
 * La tabla existía desde el patch que trajo el módulo, pero sin repositorio: lo
 * que la escribe es el worker de notificaciones y lo que la lee es la campana
 * de la interfaz, y ninguna de las dos cosas tenía por dónde entrar.
 */
@Injectable()
export class NotificationsRepository {
  /**
   * Bandeja de un perfil (UC-19-16, cara de lectura).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param recipientProfileId - Perfil destinatario.
   * @param after - Clave de continuación `(createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página de notificaciones, de la más reciente a la más antigua.
   */
  listByRecipientPage(
    em: EntityManager,
    recipientProfileId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<SocialNotifications[]> {
    return em.find(
      SocialNotifications,
      {
        recipientProfileId,
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Cuántas notificaciones sin leer tiene un perfil.
   *
   * Se cuenta sobre la tabla entera y no sobre la página: el número del globo
   * de la campana no depende de cuántas notificaciones se estén mostrando.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param recipientProfileId - Perfil destinatario.
   * @returns Cantidad de notificaciones sin leer.
   */
  countUnread(em: EntityManager, recipientProfileId: string): Promise<number> {
    return em.count(SocialNotifications, {
      recipientProfileId,
      isRead: { $ne: true },
    });
  }
}
