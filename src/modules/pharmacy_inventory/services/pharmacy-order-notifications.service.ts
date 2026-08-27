import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../../messaging/services';
import type { EmitInAppResult } from '../../messaging/notifications.contract';
import { PersonAccountLinksRepository } from '../../profiles/repositories';

/**
 * FAR-E2 · la campana del pedido de farmacia, lado paciente.
 *
 * Mismo diseño que `ClinicalNotificationsService` (carril P1), que es el
 * patrón de la casa para «un módulo avisa a una persona»: se emite **después
 * del commit**, nunca dentro de la transacción, y emitir jamás rompe el caso
 * de uso — un fallo de la campana se registra y se sigue. El hecho de dominio
 * ya quedó publicado en el outbox dentro de la transacción; esto es solo el
 * aviso navegable de la bandeja personal.
 *
 * El `debounceKey` lleva el estado: cada transición del pedido avisa una vez,
 * y un reintento de la misma transición no produce dos campanazos.
 */
@Injectable()
export class PharmacyOrderNotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia, para resolver la cuenta del paciente.
   * @param notifications - Emisor in-app (contrato de P1).
   * @param accountLinks - Vínculo entre una persona y su cuenta.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notifications: NotificationsService,
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyOrderNotificationsService.name);
  }

  /** «La farmacia está revisando tu pedido». */
  async orderUnderReview(
    orderId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido está en revisión',
      bodyText: 'La farmacia está revisando tu pedido.',
      orderId,
      statusCode: 'PINV_ORDER_EN_REVISION',
      actorUserId,
    });
  }

  /** «La farmacia confirmó tu pedido». */
  async orderConfirmed(
    orderId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido fue confirmado',
      bodyText: 'La farmacia confirmó tu pedido y lo está preparando.',
      orderId,
      statusCode: 'PINV_ORDER_CONFIRMADO',
      actorUserId,
    });
  }

  /** «Tu pedido está listo»: la reserva corre de nuevo por 48 horas. */
  async orderReady(
    orderId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido está listo para retirar',
      bodyText:
        'Podés pasar a retirarlo por la sede. La reserva se renovó por 48 horas.',
      orderId,
      statusCode: 'PINV_ORDER_LISTO_PARA_RETIRO',
      actorUserId,
    });
  }

  /**
   * «Tu pedido fue rechazado», con el motivo en el cuerpo.
   *
   * El motivo viaja SOLO acá y en el evento de dominio: el modelo todavía no
   * lo persiste en el pedido (bloqueador FAR-E1/E2), así que este aviso es la
   * única copia que la persona conserva.
   */
  async orderRejected(
    orderId: string,
    patientProfileId: string,
    reason: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido fue rechazado',
      bodyText: `La farmacia rechazó tu pedido: ${reason}`,
      orderId,
      statusCode: 'PINV_ORDER_RECHAZADO',
      actorUserId,
    });
  }

  /**
   * Resuelve la cuenta del paciente y emite. Un perfil sin cuenta activa no es
   * un error: no hay bandeja a la que avisar todavía.
   */
  private async emitToPatient(
    patientProfileId: string,
    aviso: {
      /** Título corto del aviso. */
      subject: string;
      /** Cuerpo de una línea. */
      bodyText: string;
      /** Pedido al que navega. */
      orderId: string;
      /** Estado que provoca el aviso (clave del rebote). */
      statusCode: string;
      /** Quién provocó el hecho. */
      actorUserId: string;
    },
  ): Promise<EmitInAppResult> {
    try {
      const em = this.em.fork();
      // `patient_profiles.profile_id` ES el id de la persona — la misma regla
      // que usa `ClinicalNotificationsService.emitToPatient`.
      const link = await this.accountLinks.findActiveByPerson(
        em,
        patientProfileId,
      );
      if (!link) {
        this.logger.info(
          {
            operation: 'pharmacy_inventory.order.notification',
            orderId: aviso.orderId,
            statusCode: aviso.statusCode,
          },
          'El paciente no tiene cuenta activa: no hay bandeja donde avisar',
        );
        return { suppressed: false };
      }

      return await this.notifications.emitInApp({
        recipientUserId: link.userId,
        category: 'CLINICAL',
        subject: aviso.subject,
        bodyText: aviso.bodyText,
        destination: { type: 'PHARMACY_ORDER', id: aviso.orderId },
        // Estado en la clave: cada transición avisa una vez; el reintento de
        // la misma transición no duplica el campanazo.
        debounceKey: `pharmacy:PHARMACY_ORDER:${aviso.orderId}:${aviso.statusCode}`,
        actorUserId: aviso.actorUserId,
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'pharmacy_inventory.order.notification',
          orderId: aviso.orderId,
          statusCode: aviso.statusCode,
          err: error,
        },
        'No se pudo avisar al paciente; la transición ya quedó asentada',
      );
      return { suppressed: false, failed: true };
    }
  }
}
