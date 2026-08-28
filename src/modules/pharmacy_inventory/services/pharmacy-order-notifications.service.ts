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

  /**
   * «Tu pedido está listo»: la reserva corre de nuevo por 48 horas.
   *
   * El código de retiro viaja acá y en la vista del pedido de su dueño — y en
   * ningún otro lado (contrato v4.2.1): no es un secreto criptográfico, es la
   * prueba de posesión con la que se retira en el mostrador.
   */
  async orderReady(
    orderId: string,
    patientProfileId: string,
    actorUserId: string,
    pickupCode?: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido está listo para retirar',
      bodyText: pickupCode
        ? `Podés pasar a retirarlo por la sede con el código ${pickupCode}. La reserva se renovó por 48 horas.`
        : 'Podés pasar a retirarlo por la sede. La reserva se renovó por 48 horas.',
      orderId,
      statusCode: 'PINV_ORDER_LISTO_PARA_RETIRO',
      actorUserId,
    });
  }

  /** «Te proponen un genérico»: la decisión es de la persona (FAR-I2). */
  async substitutionsProposed(
    orderId: string,
    patientProfileId: string,
    proposalCount: number,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'La farmacia te propone una alternativa',
      bodyText:
        proposalCount === 1
          ? 'La farmacia propone un genérico para un medicamento de tu pedido. Podés aceptarlo o preferir el original.'
          : `La farmacia propone genéricos para ${proposalCount} medicamentos de tu pedido. Podés aceptarlos o preferir los originales.`,
      orderId,
      statusCode: 'PINV_ORDER_ACEPTACION_PENDIENTE',
      actorUserId,
    });
  }

  /** «Tu pedido venció»: la reserva se liberó sin retiro. */
  async orderExpired(
    orderId: string,
    patientProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPatient(patientProfileId, {
      subject: 'Tu pedido venció',
      bodyText:
        'Pasaron 48 horas sin retiro y la reserva se liberó. Podés volver a pedirlo cuando quieras.',
      orderId,
      statusCode: 'PINV_ORDER_VENCIDO',
      actorUserId,
    });
  }

  /**
   * El cierre del bucle de FAR-E3: la receta se dispensó y quien recetó se
   * entera sin ir a buscarlo. Navega a la RECETA (el prescriptor no puede
   * abrir el pedido de farmacia ajeno: para terceros es un 404).
   */
  async dispensedToPrescriber(
    orderId: string,
    medicationRequestId: string,
    prescriberProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPerson(prescriberProfileId, {
      subject: 'Una receta tuya fue dispensada',
      bodyText:
        'El paciente retiró en farmacia la medicación que recetaste. El pedido quedó completo.',
      destination: { type: 'PRESCRIPTION', id: medicationRequestId },
      debounceKey: `pharmacy:PHARMACY_ORDER:${orderId}:PINV_ORDER_RETIRADO:prescriber`,
      logContext: { orderId, statusCode: 'PINV_ORDER_RETIRADO' },
      actorUserId,
    });
  }

  /**
   * La otra mitad de la regla del bucle (FAR-E3): el pedido VENCIÓ sin retiro
   * y quien recetó se entera de que la medicación NO se dispensó — «receta
   * sin retiro es una tarea abierta». Mismo destino que el cierre: la receta.
   */
  async expiredToPrescriber(
    orderId: string,
    medicationRequestId: string,
    prescriberProfileId: string,
    actorUserId: string,
  ): Promise<EmitInAppResult> {
    return this.emitToPerson(prescriberProfileId, {
      subject: 'Tu paciente no retiró la medicación',
      bodyText:
        'El pedido de farmacia venció sin retiro y la reserva se liberó. La receta sigue sin dispensarse.',
      destination: { type: 'PRESCRIPTION', id: medicationRequestId },
      debounceKey: `pharmacy:PHARMACY_ORDER:${orderId}:PINV_ORDER_VENCIDO:prescriber`,
      logContext: { orderId, statusCode: 'PINV_ORDER_VENCIDO' },
      actorUserId,
    });
  }

  /**
   * «Tu pedido fue rechazado», con el motivo en el cuerpo.
   *
   * Desde v4.2.1 el motivo también se persiste en el pedido
   * (`rejection_reason_text`): este aviso es la copia inmediata, no la única.
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
    return this.emitToPerson(patientProfileId, {
      subject: aviso.subject,
      bodyText: aviso.bodyText,
      destination: { type: 'PHARMACY_ORDER', id: aviso.orderId },
      // Estado en la clave: cada transición avisa una vez; el reintento de
      // la misma transición no duplica el campanazo.
      debounceKey: `pharmacy:PHARMACY_ORDER:${aviso.orderId}:${aviso.statusCode}`,
      logContext: { orderId: aviso.orderId, statusCode: aviso.statusCode },
      actorUserId: aviso.actorUserId,
    });
  }

  /**
   * Resuelve la cuenta de una persona y emite. Vale para el paciente y para
   * el prescriptor: los subtipos de `profiles` comparten `profile_id` = id de
   * la persona (la misma regla que usa `ClinicalNotificationsService`). Una
   * persona sin cuenta activa no es un error: no hay bandeja a la que avisar.
   */
  private async emitToPerson(
    profileId: string,
    aviso: {
      /** Título corto del aviso. */
      subject: string;
      /** Cuerpo de una línea. */
      bodyText: string;
      /** A qué objeto navega la campana. */
      destination: { type: 'PHARMACY_ORDER' | 'PRESCRIPTION'; id: string };
      /** Clave del rebote: la misma transición no duplica el campanazo. */
      debounceKey: string;
      /** Ids para el log estructurado. */
      logContext: Record<string, unknown>;
      /** Quién provocó el hecho. */
      actorUserId: string;
    },
  ): Promise<EmitInAppResult> {
    try {
      const em = this.em.fork();
      const link = await this.accountLinks.findActiveByPerson(em, profileId);
      if (!link) {
        this.logger.info(
          {
            operation: 'pharmacy_inventory.order.notification',
            ...aviso.logContext,
          },
          'La persona no tiene cuenta activa: no hay bandeja donde avisar',
        );
        return { suppressed: false };
      }

      return await this.notifications.emitInApp({
        recipientUserId: link.userId,
        category: 'CLINICAL',
        subject: aviso.subject,
        bodyText: aviso.bodyText,
        destination: aviso.destination,
        debounceKey: aviso.debounceKey,
        actorUserId: aviso.actorUserId,
      });
    } catch (error) {
      this.logger.error(
        {
          operation: 'pharmacy_inventory.order.notification',
          ...aviso.logContext,
          err: error,
        },
        'No se pudo avisar; la transición ya quedó asentada',
      );
      return { suppressed: false, failed: true };
    }
  }
}
