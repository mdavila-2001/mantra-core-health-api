import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Quotations } from '../../billing/entities';
import { createdBy } from '../../../common';

/** Cotización a crear (FT-24). */
export interface CreateQuotationData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador del profesional que arma la cotización.
   */
  createdByPractitionerProfileId: string;
  /**
   * Fecha de atención sobre la que se cotiza.
   */
  attentionDate: Date;
  /**
   * Cita asociada, opcional.
   */
  appointmentId?: string;
  /**
   * Servicio del catálogo cotizado.
   */
  serviceCatalogId: string;
  /**
   * Nombre del servicio, copiado del catálogo al momento de crear la cotización.
   */
  serviceNameSnapshot: string;
  /**
   * Precio ofrecido al paciente.
   */
  offeredPrice: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Cantidad de cuotas del plan de pagos ofrecido.
   */
  paymentPlanInstallmentCount: number;
  /**
   * Anticipo: lo que se paga el día de la atención.
   */
  downPaymentAmount: string;
  /**
   * Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`).
   */
  paymentFrequency: string;
  /**
   * Fecha hasta la que la oferta es válida.
   */
  validUntil: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.quotations`. */
@Injectable()
export class QuotationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Quotations | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Quotations | null> {
    return em.findOne(Quotations, { id });
  }

  /**
   * Cotizaciones de un paciente, más recientes primero, acotadas a las
   * prácticas que el actor alcanza.
   *
   * El acotado va en la consulta y no después de leer: una cotización de una
   * práctica ajena no sale de la base. Con una lista vacía no hay nada que
   * consultar — el servicio no llega hasta acá en ese caso.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuyas cotizaciones se listan.
   * @param practiceIds - Prácticas alcanzables por el actor (no vacía).
   * @returns Las cotizaciones del paciente en esas prácticas.
   */
  findByPatient(
    em: EntityManager,
    patientProfileId: string,
    practiceIds: readonly string[],
  ): Promise<Quotations[]> {
    return em.find(
      Quotations,
      { patientProfileId, practiceId: { $in: [...practiceIds] } },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Quotations`.
   */
  create(em: EntityManager, data: CreateQuotationData): Quotations {
    return em.create(
      Quotations,
      {
        practiceId: data.practiceId,
        patientProfileId: data.patientProfileId,
        createdByPractitionerProfileId: data.createdByPractitionerProfileId,
        attentionDate: data.attentionDate,
        appointmentId: data.appointmentId,
        serviceCatalogId: data.serviceCatalogId,
        serviceNameSnapshot: data.serviceNameSnapshot,
        offeredPrice: data.offeredPrice,
        currencyConceptId: data.currencyConceptId,
        paymentPlanInstallmentCount: data.paymentPlanInstallmentCount,
        downPaymentAmount: data.downPaymentAmount,
        paymentFrequency: data.paymentFrequency,
        validUntil: data.validUntil,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
