import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceCatalogRepository } from '../../billing/repositories';
import type { Quotations, QuotationInstallments } from '../../billing/entities';
import {
  QuotationInstallmentsRepository,
  QuotationsRepository,
} from '../repositories';
import { CreateQuotationDto } from '../dto';
import type {
  QuotationInstallmentDto,
  QuotationResponseDto,
} from '../dto/quotation-response.dto';
import { assertPaymentPlanClosesOnPrice } from './payment-plan';

/** Fecha (`date`) como `YYYY-MM-DD`, sin desplazamiento por huso horario. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * FT-24 — Creación de cotizaciones: presupuesto ofrecido a un paciente sobre
 * un servicio del catálogo (`billing.service_catalog`), con un plan de pagos
 * flexible **sin interés** (v4.2.18: anticipo y cuotas con fecha y monto
 * propios, que arma quien atiende) y las condiciones ofertadas congeladas (snapshot)
 * para trazabilidad — si el catálogo cambia después, la cotización ya
 * emitida no se ve afectada.
 */
@Injectable()
export class QuotationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param quotationsRepo - Acceso a `billing.quotations`.
   * @param installmentsRepo - Acceso a `billing.quotation_installments`.
   * @param serviceCatalogRepo - Acceso a `billing.service_catalog`, para el snapshot.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly quotationsRepo: QuotationsRepository,
    private readonly installmentsRepo: QuotationInstallmentsRepository,
    private readonly serviceCatalogRepo: ServiceCatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(QuotationsService.name);
  }

  /**
   * Crea una cotización: valida las precondiciones —entre ellas, que anticipo
   * + cuotas cierre con el precio—, congela el nombre del servicio del
   * catálogo y persiste cotización + cuotas en una única transacción.
   *
   * @throws PreconditionFailedException si el actor no tiene perfil
   * profesional, si `validUntil` no es posterior a `attentionDate`, o si el
   * plan de pagos no cierra con el precio (ver `assertPaymentPlanClosesOnPrice`).
   * @throws ResourceNotFoundException si el servicio no existe en el catálogo.
   */
  async createQuotation(
    dto: CreateQuotationDto,
    actor: AuthenticatedUser,
  ): Promise<QuotationResponseDto> {
    // Se copia a una constante porque la narrowing de `actor.practitionerProfileId`
    // no cruza el cierre de `em.transactional` de abajo (TS no la retiene para
    // una propiedad `readonly` de un parámetro capturado por una función anidada).
    const practitionerProfileId = actor.practitionerProfileId;
    if (!practitionerProfileId) {
      throw new PreconditionFailedException(
        'Se requiere un perfil profesional para crear una cotización',
      );
    }

    const attentionDate = new Date(dto.attentionDate);
    const validUntil = new Date(dto.validUntil);
    if (validUntil <= attentionDate) {
      throw new PreconditionFailedException(
        'validUntil debe ser posterior a attentionDate',
        { attentionDate: dto.attentionDate, validUntil: dto.validUntil },
      );
    }

    assertPaymentPlanClosesOnPrice(dto);

    this.logger.info(
      {
        operation: 'quotations.create',
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        serviceCatalogId: dto.serviceCatalogId,
        actorId: actor.id,
      },
      'Creating quotation',
    );

    return this.em.transactional(async (tx) => {
      const service = await this.serviceCatalogRepo.findById(
        tx,
        dto.serviceCatalogId,
      );
      if (service === null) {
        throw new ResourceNotFoundException(
          'Servicio no encontrado en el catálogo',
          { serviceCatalogId: dto.serviceCatalogId },
        );
      }

      const quotation = this.quotationsRepo.create(tx, {
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        createdByPractitionerProfileId: practitionerProfileId,
        attentionDate,
        appointmentId: dto.appointmentId,
        serviceCatalogId: dto.serviceCatalogId,
        // Snapshot: se copia el nombre vigente del catálogo al momento de la
        // creación; si el catálogo cambia después, esta cotización no se ve
        // afectada (trazabilidad de la oferta tal como se presentó).
        serviceNameSnapshot: service.name,
        offeredPrice: dto.offeredPrice,
        currencyConceptId: dto.currencyConceptId,
        paymentPlanInstallmentCount: dto.paymentPlanInstallmentCount,
        downPaymentAmount: dto.downPaymentAmount,
        paymentFrequency: dto.paymentFrequency,
        validUntil,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir la cotización antes de sus cuotas.
      await tx.flush();

      const installments = this.installmentsRepo.createMany(
        tx,
        dto.installments.map((row) => ({
          quotationId: quotation.id,
          installmentNumber: row.installmentNumber,
          dueDate: new Date(row.dueDate),
          amount: row.amount,
        })),
      );

      this.logger.info(
        {
          operation: 'quotations.create',
          quotationId: quotation.id,
          installments: installments.length,
        },
        'Quotation created',
      );
      return toResponseDto(quotation, installments);
    });
  }

  /**
   * Trae una cotización con sus cuotas.
   *
   * @throws ResourceNotFoundException si no existe.
   */
  async getQuotation(id: string): Promise<QuotationResponseDto> {
    const em = this.em.fork();
    const quotation = await this.quotationsRepo.findById(em, id);
    if (quotation === null) {
      throw new ResourceNotFoundException('Cotización no encontrada', { id });
    }
    const installments = await this.installmentsRepo.findByQuotationId(em, id);
    return toResponseDto(quotation, installments);
  }

  /** Lista las cotizaciones de un paciente, más recientes primero. */
  async listQuotationsByPatient(
    patientProfileId: string,
  ): Promise<QuotationResponseDto[]> {
    const em = this.em.fork();
    const quotations = await this.quotationsRepo.findByPatient(
      em,
      patientProfileId,
    );
    return Promise.all(
      quotations.map(async (quotation) => {
        const installments = await this.installmentsRepo.findByQuotationId(
          em,
          quotation.id,
        );
        return toResponseDto(quotation, installments);
      }),
    );
  }
}

/** Traduce cotización + cuotas a su forma pública de transporte. */
function toResponseDto(
  quotation: Pick<
    Quotations,
    | 'id'
    | 'practiceId'
    | 'patientProfileId'
    | 'createdByPractitionerProfileId'
    | 'attentionDate'
    | 'appointmentId'
    | 'serviceCatalogId'
    | 'serviceNameSnapshot'
    | 'offeredPrice'
    | 'currencyConceptId'
    | 'paymentPlanInstallmentCount'
    | 'downPaymentAmount'
    | 'paymentFrequency'
    | 'validUntil'
    | 'statusConceptId'
    | 'createdAt'
  >,
  installments: ReadonlyArray<
    Pick<QuotationInstallments, 'installmentNumber' | 'dueDate' | 'amount'>
  >,
): QuotationResponseDto {
  const installmentDtos: QuotationInstallmentDto[] = installments.map(
    (installment) => ({
      installmentNumber: installment.installmentNumber,
      dueDate: toIsoDate(installment.dueDate),
      amount: installment.amount,
    }),
  );

  return {
    id: quotation.id,
    practiceId: quotation.practiceId,
    patientProfileId: quotation.patientProfileId,
    createdByPractitionerProfileId: quotation.createdByPractitionerProfileId,
    attentionDate: toIsoDate(quotation.attentionDate),
    appointmentId: quotation.appointmentId,
    serviceCatalogId: quotation.serviceCatalogId,
    serviceNameSnapshot: quotation.serviceNameSnapshot,
    offeredPrice: quotation.offeredPrice,
    currencyConceptId: quotation.currencyConceptId,
    paymentPlanInstallmentCount: quotation.paymentPlanInstallmentCount,
    downPaymentAmount: quotation.downPaymentAmount,
    paymentFrequency: quotation.paymentFrequency,
    validUntil: toIsoDate(quotation.validUntil),
    statusConceptId: quotation.statusConceptId,
    createdAt: quotation.createdAt,
    installments: installmentDtos,
  };
}
