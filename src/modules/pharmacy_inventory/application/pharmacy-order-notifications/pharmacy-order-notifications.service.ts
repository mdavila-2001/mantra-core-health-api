import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { PharmacyNotificationResult } from '../ports/in-app-notification.port';
import { NotifyPharmacyOrderUseCase } from './notify-pharmacy-order.use-case';

/** Fachada pública de avisos para pedidos y prescripciones. */
@Injectable()
export class PharmacyOrderNotificationsService {
  constructor(
    private readonly notifyOrder: NotifyPharmacyOrderUseCase,
    logger: PinoLogger,
  ) {
    logger.setContext(PharmacyOrderNotificationsService.name);
  }

  orderUnderReview(
    orderId: string,
    patientId: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.orderUnderReview(orderId, patientId, actorId);
  }

  orderConfirmed(
    orderId: string,
    patientId: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.orderConfirmed(orderId, patientId, actorId);
  }

  orderReady(
    orderId: string,
    patientId: string,
    actorId: string,
    pickupCode?: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.orderReady(orderId, patientId, actorId, pickupCode);
  }

  substitutionsProposed(
    orderId: string,
    patientId: string,
    count: number,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.substitutionsProposed(
      orderId,
      patientId,
      count,
      actorId,
    );
  }

  orderExpired(
    orderId: string,
    patientId: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.orderExpired(orderId, patientId, actorId);
  }

  dispensedToPrescriber(
    orderId: string,
    requestId: string,
    prescriberId: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.dispensedToPrescriber(
      orderId,
      requestId,
      prescriberId,
      actorId,
    );
  }

  expiredToPrescriber(
    orderId: string,
    requestId: string,
    prescriberId: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.expiredToPrescriber(
      orderId,
      requestId,
      prescriberId,
      actorId,
    );
  }

  orderRejected(
    orderId: string,
    patientId: string,
    reason: string,
    actorId: string,
  ): Promise<PharmacyNotificationResult> {
    return this.notifyOrder.orderRejected(orderId, patientId, reason, actorId);
  }
}
