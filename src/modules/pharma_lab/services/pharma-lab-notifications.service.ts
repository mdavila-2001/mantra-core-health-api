import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { createdBy, touch, type AuthenticatedUser } from '../../../common';
import { PharmaLabNotices } from '../entities';

/** Aviso que un caso de uso del carril quiere entregar dentro del producto. */
export interface PharmaLabNotice {
  /** Cuenta destinataria. */
  recipientUserId: string;
  /** Código de plantilla, estable, que el frontend usa para rotular el aviso. */
  templateCode: string;
  /** Asunto legible. */
  subject: string;
  /** Cuerpo legible. */
  bodyText: string;
  /** Tipo del recurso que originó el aviso (`visit_request`, `regulatory_document`…). */
  relatedResourceType: string;
  /** Identificador de ese recurso. */
  relatedResourceId: string;
  /** Organización bajo la que se emite, si aplica. */
  tenantId?: string;
}

/**
 * Notificaciones del carril 17 (spec 5667-5702).
 *
 * Escribe el aviso **en la transacción del caso de uso**, para que el hecho y su
 * aviso sean atómicos: una visita aceptada cuyo aviso se perdió es un doctor
 * esperando a alguien que no sabe que fue aceptado.
 *
 * Sobre por qué el aviso vive en `pharma_lab.pharma_lab_notices` y no en
 * `messaging.in_app_notifications`, ver la entidad: aquel buzón exige una
 * solicitud y una entrega de mensajería no nulas, y fabricarlas desde un caso de
 * uso de dominio sería inventar filas. Los canales externos —correo, WhatsApp,
 * SMS, push— siguen siendo de `messaging`; este servicio no los duplica.
 */
@Injectable()
export class PharmaLabNotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia, para las lecturas del buzón.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Deja un aviso en el buzón de la persona destinataria.
   *
   * @param tx - Transacción activa del caso de uso.
   * @param notice - Contenido del aviso.
   * @param actorUserId - Quien originó el hecho notificado.
   */
  notify(
    tx: EntityManager,
    notice: PharmaLabNotice,
    actorUserId?: string,
  ): void {
    tx.create(
      PharmaLabNotices,
      {
        recipientUserId: notice.recipientUserId,
        tenantId: notice.tenantId,
        templateCode: notice.templateCode,
        subject: notice.subject,
        bodyText: notice.bodyText,
        relatedResourceType: notice.relatedResourceType,
        relatedResourceId: notice.relatedResourceId,
        isRead: false,
        ...createdBy(actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Deja el mismo aviso a varias personas.
   *
   * @param tx - Transacción activa del caso de uso.
   * @param recipientUserIds - Cuentas destinatarias.
   * @param notice - Contenido del aviso, sin destinatario.
   * @param actorUserId - Quien originó el hecho notificado.
   */
  notifyAll(
    tx: EntityManager,
    recipientUserIds: readonly string[],
    notice: Omit<PharmaLabNotice, 'recipientUserId'>,
    actorUserId?: string,
  ): void {
    for (const recipientUserId of new Set(recipientUserIds)) {
      this.notify(tx, { ...notice, recipientUserId }, actorUserId);
    }
  }

  /**
   * Buzón de la persona autenticada, del más reciente al más antiguo.
   *
   * @param actor - Usuario autenticado.
   * @returns Sus avisos del carril.
   */
  listOwn(actor: AuthenticatedUser): Promise<PharmaLabNotices[]> {
    return this.em.find(
      PharmaLabNotices,
      { recipientUserId: actor.id },
      { orderBy: { createdAt: 'desc' }, limit: 100 },
    );
  }

  /**
   * Marca un aviso propio como leído.
   *
   * @param noticeId - Aviso.
   * @param actor - Usuario autenticado.
   * @returns `true` si el aviso era suyo y quedó marcado.
   */
  async markRead(noticeId: string, actor: AuthenticatedUser): Promise<boolean> {
    return this.em.transactional(async (tx) => {
      const notice = await tx.findOne(PharmaLabNotices, {
        id: noticeId,
        recipientUserId: actor.id,
      });
      if (!notice) return false;
      notice.isRead = true;
      notice.readAt = new Date();
      touch(notice, actor.id);
      await tx.flush();
      return true;
    });
  }
}
