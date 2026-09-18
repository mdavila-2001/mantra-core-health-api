import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { QuotationInstallments } from '../../billing/entities';

/** Cuota del plan de pagos a crear (FT-24). */
export interface CreateQuotationInstallmentData {
  /**
   * Cotización dueña de la cuota.
   */
  quotationId: string;
  /**
   * Número de orden de la cuota dentro del plan (1-based).
   */
  installmentNumber: number;
  /**
   * Fecha de vencimiento de la cuota.
   */
  dueDate: Date;
  /**
   * Monto de la cuota, sin interés.
   */
  amount: string;
}

/** Acceso a datos de `billing.quotation_installments`. */
@Injectable()
export class QuotationInstallmentsRepository {
  /** Cuotas de una cotización, en orden. */
  findByQuotationId(
    em: EntityManager,
    quotationId: string,
  ): Promise<QuotationInstallments[]> {
    return em.find(
      QuotationInstallments,
      { quotationId },
      { orderBy: { installmentNumber: 'ASC' } },
    );
  }

  /**
   * Crea todas las cuotas del plan de pagos de una cotización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Cuotas a crear, ya calculadas por el simulador.
   * @returns Las entidades creadas (aún no persistidas; el llamante controla el flush).
   */
  createMany(
    em: EntityManager,
    data: CreateQuotationInstallmentData[],
  ): QuotationInstallments[] {
    return data.map((installment) =>
      em.create(
        QuotationInstallments,
        {
          quotationId: installment.quotationId,
          installmentNumber: installment.installmentNumber,
          dueDate: installment.dueDate,
          amount: installment.amount,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        { partial: true },
      ),
    );
  }
}
