import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una cuota del plan de pagos, congelada en la cotización. Sin interés. */
export class QuotationInstallmentDto {
  /**
   * Número de orden de la cuota dentro del plan (1-based).
   */
  @ApiProperty()
  installmentNumber!: number;

  /**
   * Fecha de vencimiento de la cuota (ISO).
   */
  @ApiProperty()
  dueDate!: string;

  /**
   * Monto de la cuota.
   */
  @ApiProperty()
  amount!: string;
}

/** Una cotización, con su plan de pagos congelado. */
export class QuotationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiProperty({ format: 'uuid' })
  practiceId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Profesional que armó la cotización.
   */
  @ApiProperty({ format: 'uuid' })
  createdByPractitionerProfileId!: string;

  /**
   * Fecha de atención sobre la que se cotizó (ISO).
   */
  @ApiProperty()
  attentionDate!: string;

  /**
   * Cita asociada, opcional.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  appointmentId?: string;

  /**
   * Servicio del catálogo cotizado.
   */
  @ApiProperty({ format: 'uuid' })
  serviceCatalogId!: string;

  /**
   * Nombre del servicio, congelado al momento de crear la cotización.
   */
  @ApiProperty()
  serviceNameSnapshot!: string;

  /**
   * Precio ofrecido al paciente.
   */
  @ApiProperty()
  offeredPrice!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  currencyConceptId?: string;

  /**
   * Cantidad de cuotas del plan de pagos.
   */
  @ApiProperty()
  paymentPlanInstallmentCount!: number;

  /**
   * Anticipo: lo que se paga el día de la atención.
   */
  @ApiProperty()
  downPaymentAmount!: string;

  /**
   * Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`).
   */
  @ApiProperty()
  paymentFrequency!: string;

  /**
   * Fecha hasta la que la oferta es válida (ISO).
   */
  @ApiProperty()
  validUntil!: string;

  /**
   * Estado de la cotización.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó la cotización.
   */
  @ApiProperty()
  createdAt!: Date;

  /**
   * Cuotas congeladas del plan de pagos.
   */
  @ApiProperty({ type: [QuotationInstallmentDto] })
  installments!: QuotationInstallmentDto[];
}
