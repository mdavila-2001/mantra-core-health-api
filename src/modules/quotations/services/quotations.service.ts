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
import { CreateQuotationDto, SimulatePaymentPlanDto } from '../dto';
import type {
  InstallmentPreviewDto,
  QuotationResponseDto,
} from '../dto/quotation-response.dto';
import {
  simulatePaymentPlan as runSimulator,
  type InstallmentPreview,
} from './payment-plan-simulator';

/** Fecha (`date`) como `YYYY-MM-DD`, sin desplazamiento por huso horario. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Convierte la previsualización del simulador (fechas como `Date`, uso
 * interno) a la forma que expone el contrato HTTP (fechas como `string`
 * ISO). Un solo punto de conversión para `/simulate` y `createQuotation`.
 */
export function toInstallmentPreviewDto(
  installments: InstallmentPreview[],
): InstallmentPreviewDto[] {
  return installments.map((installment) => ({
    ...installment,
    dueDate: toIsoDate(installment.dueDate),
  }));
}

/**
 * FT-24 — Creación de cotizaciones: presupuesto ofrecido a un paciente sobre
 * un servicio del catálogo (`billing.service_catalog`), con un plan de pagos
 * simulado (FLAT o FRANCÉS) y las condiciones ofertadas congeladas (snapshot)
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
   * Simulador de financiamiento: calcula la tabla de cuotas sin persistir
   * nada. Función pura por debajo (`payment-plan-simulator.ts`); este método
   * sólo la expone como parte del servicio para que el controller y
   * `createQuotation` compartan la misma firma.
   */
  simulatePaymentPlan(dto: SimulatePaymentPlanDto): InstallmentPreview[] {
    return runSimulator(
      dto.offeredPrice,
      dto.installmentCount,
      dto.interestRatePercent,
      dto.interestCalculationMethod,
      new Date(dto.attentionDate),
    );
  }

  /**
   * Crea una cotización: valida las precondiciones, congela el nombre del
   * servicio del catálogo, corre el simulador y persiste cotización + cuotas
   * en una única transacción.
   *
   * @throws PreconditionFailedException si el actor no tiene perfil
   * profesional, o si `validUntil` no es posterior a `attentionDate`.
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

      const installments = runSimulator(
        dto.offeredPrice,
        dto.paymentPlanInstallmentCount,
        dto.interestRatePercent,
        dto.interestCalculationMethod,
        attentionDate,
      );

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
        interestRatePercent: dto.interestRatePercent,
        interestCalculationMethod: dto.interestCalculationMethod,
        validUntil,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });
      // FK planas: persistir la cotización antes de sus cuotas.
      await tx.flush();

      this.installmentsRepo.createMany(
        tx,
        installments.map((row) => ({
          quotationId: quotation.id,
          installmentNumber: row.installmentNumber,
          dueDate: row.dueDate,
          principalAmount: row.principalAmount,
          interestAmount: row.interestAmount,
          totalAmount: row.totalAmount,
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
    const installments = await this.installmentsRepo.findByQuotationId(
      em,
      id,
    );
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
    | 'interestRatePercent'
    | 'interestCalculationMethod'
    | 'validUntil'
    | 'statusConceptId'
    | 'createdAt'
  >,
  installments: ReadonlyArray<
    | InstallmentPreview
    | Pick<
        QuotationInstallments,
        | 'installmentNumber'
        | 'dueDate'
        | 'principalAmount'
        | 'interestAmount'
        | 'totalAmount'
      >
  >,
): QuotationResponseDto {
  const installmentDtos: InstallmentPreviewDto[] = installments.map(
    (installment) => ({
      installmentNumber: installment.installmentNumber,
      dueDate: toIsoDate(installment.dueDate),
      principalAmount: installment.principalAmount,
      interestAmount: installment.interestAmount,
      totalAmount: installment.totalAmount,
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
    interestRatePercent: quotation.interestRatePercent,
    interestCalculationMethod: quotation.interestCalculationMethod,
    validUntil: toIsoDate(quotation.validUntil),
    statusConceptId: quotation.statusConceptId,
    createdAt: quotation.createdAt,
    installments: installmentDtos,
  };
}
