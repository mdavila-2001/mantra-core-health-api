import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { quoteOrder } from '../domain/order-quote';
import {
  CenterStudiesRepository,
  toQuotedPart,
} from '../infrastructure/center-studies.repository';
import { OrderPatientRepository } from '../infrastructure/order-patient.repository';

/** Prices one center's panel offering for what the order asks for. */
export type OrderPricer = (
  panelOfferingId: string,
  panelPrice: number | null,
) => Promise<number | null>;

/**
 * The price a patient sees and books for an order (proceso 4.2.d): the whole
 * panel, or only the components the doctor picked. Shared by the booking
 * options and the booking itself, so the quoted and the frozen price agree.
 */
@Injectable()
export class OrderQuoteService {
  constructor(
    private readonly patients: OrderPatientRepository,
    private readonly studies: CenterStudiesRepository,
  ) {}

  /** Reads the order's picked components once; each center is priced on demand. */
  async pricerFor(em: EntityManager, orderId: string): Promise<OrderPricer> {
    const ordered = await this.patients.orderedComponents(em, orderId);
    return async (panelOfferingId, panelPrice) => {
      if (ordered.length === 0) return panelPrice;
      const parts = await this.studies.findParts(em, panelOfferingId);
      return quoteOrder(panelPrice, ordered, parts.map(toQuotedPart));
    };
  }
}
