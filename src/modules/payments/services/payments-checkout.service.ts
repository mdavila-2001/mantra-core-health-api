import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PaymentFlowRepository } from '../repositories';
import { OpenCheckoutSessionDto, CheckoutSessionResponseDto } from '../dto';
import { PaymentsErrorReason } from '../payments.error-reasons';

/**
 * Apertura de sesiones de checkout con contexto de cajero (UC-42-02).
 */
@Injectable()
export class PaymentsCheckoutService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param flowRepo - Valor de flow repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly flowRepo: PaymentFlowRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsCheckoutService.name);
  }

  /**
   * UC-42-02: abre la sesión y mueve la deuda a `in_checkout`.
   *
   * La deuda se bloquea con `FOR UPDATE` porque dos cajeros podrían intentar
   * cobrarla a la vez; el estado `in_checkout` es lo que impide la segunda sesión.
   * Del token solo se persiste su hash: el valor en claro se entrega una única vez
   * en la respuesta y no debe quedar almacenado ni aparecer en logs.
   */
  async openSession(
    dto: OpenCheckoutSessionDto,
    actor: AuthenticatedUser,
  ): Promise<
    CheckoutSessionResponseDto & {
      /**
       * Valor de session token mantenido por la instancia.
       */
      sessionToken: string;
    }
  > {
    // El tenant sale del contexto verificado, no del cuerpo: un `tenantId` del
    // cuerpo que no sea el activo no puede abrir sesiones en nombre de otro.
    const tenantId = requireTenantId();
    if (dto.tenantId !== tenantId) {
      throw new PreconditionFailedException(
        'El tenantId del cuerpo no coincide con el tenant activo',
        undefined,
        PaymentsErrorReason.PAYMENTS_TENANT_MISMATCH,
      );
    }

    this.logger.info(
      {
        operation: 'payments.checkout.open',
        tenantId,
        debtId: dto.paymentDebtId,
      },
      'Opening checkout session',
    );

    return this.em.transactional(async (tx) => {
      // Deuda ajena (otro tenant u otra conexión) = deuda inexistente: mismo
      // 404, mismo mensaje y mismo `reason`, sin `details` que confirmen el UUID.
      const debt = await this.flowRepo.findDebtForUpdate(tx, {
        id: dto.paymentDebtId,
        tenantId,
        gatewayConnectionId: dto.gatewayConnectionId,
      });
      if (!debt) {
        throw new ResourceNotFoundException(
          'Deuda no encontrada',
          undefined,
          PaymentsErrorReason.PAYMENT_DEBT_NOT_FOUND,
        );
      }
      if (dto.paymentIntentId) {
        // La intención opcional debe ser del mismo tenant y conexión; si no, se
        // responde como inexistente.
        const intent = await this.flowRepo.findIntentForCheckout(tx, {
          id: dto.paymentIntentId,
          tenantId,
          gatewayConnectionId: dto.gatewayConnectionId,
        });
        if (!intent) {
          throw new ResourceNotFoundException(
            'Intención de pago no encontrada',
            undefined,
            PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
          );
        }
      }
      if (debt.statusConceptId === CONCEPTS.DEBT_IN_CHECKOUT) {
        throw new PreconditionFailedException(
          'La deuda ya tiene un checkout abierto',
          {
            paymentDebtId: dto.paymentDebtId,
          },
          PaymentsErrorReason.PAYMENT_DEBT_CHECKOUT_ALREADY_OPEN,
        );
      }
      if (debt.statusConceptId === CONCEPTS.DEBT_SETTLED) {
        throw new PreconditionFailedException(
          'La deuda ya está saldada',
          {
            paymentDebtId: dto.paymentDebtId,
          },
          PaymentsErrorReason.PAYMENT_DEBT_ALREADY_SETTLED,
        );
      }

      const sessionToken = randomUUID();
      const session = this.flowRepo.createCheckoutSession(tx, {
        tenantId,
        gatewayConnectionId: dto.gatewayConnectionId,
        paymentDebtId: dto.paymentDebtId,
        paymentIntentId: dto.paymentIntentId,
        sessionTokenHash: this.hashToken(sessionToken),
        redirectUrl: dto.redirectUrl,
        successReturnUrl: dto.successReturnUrl,
        failureReturnUrl: dto.failureReturnUrl,
        expiresAt: new Date(dto.expiresAt),
        statusConceptId: CONCEPTS.CHECKOUT_OPEN,
        openedAt: new Date(),
        actorUserId: actor.id,
      });

      // El contexto de caja solo existe cuando el cobro se hace en mostrador; la
      // UNIQUE sobre la sesión evita que se registren dos contextos para la misma.
      if (dto.cashierUserId || dto.cashRegisterId || dto.siteId) {
        this.flowRepo.createCashierContext(tx, {
          tenantId,
          paymentCheckoutSessionId: session.id,
          cashierUserId: dto.cashierUserId,
          cashRegisterId: dto.cashRegisterId,
          siteId: dto.siteId,
          shiftReference: dto.shiftReference,
        });
      }

      debt.statusConceptId = CONCEPTS.DEBT_IN_CHECKOUT;
      touch(debt, actor.id);

      return {
        id: session.id,
        paymentDebtId: dto.paymentDebtId,
        redirectUrl: dto.redirectUrl,
        expiresAt: dto.expiresAt,
        statusConceptId: CONCEPTS.CHECKOUT_OPEN,
        sessionToken,
      };
    });
  }

  /** SHA-256 del token: la base nunca guarda el secreto en claro. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
