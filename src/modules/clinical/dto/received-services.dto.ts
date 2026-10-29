import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Tipos de servicio que la API distingue hoy. El valor sale del concepto del value
 * set `vs_received_service_type`; un concepto que esta lista no conoce se informa
 * como `OTHER` y el cliente lo dibuja con su etiqueta, sin romper.
 */
export const RECEIVED_SERVICE_TYPES = [
  'INTERVENTION',
  'VACCINATION',
  'OTHER',
] as const;
export type ReceivedServiceType = (typeof RECEIVED_SERVICE_TYPES)[number];

/** Lo que costó un servicio, como lo registró facturación. */
export class ReceivedServiceCostDto {
  /** Importe decimal exacto; nunca un número de coma flotante. */
  @ApiProperty({ type: String, example: '350.00' })
  amount!: string;

  /** Código de moneda (`BOB`, `USD`), o `null` si el cargo no lo declara. */
  @ApiProperty({ type: String, nullable: true, example: 'BOB' })
  currencyCode!: string | null;

  /** De dónde sale el importe: la línea de factura enlazada o la suma de los cargos del caso. */
  @ApiProperty({ enum: ['INVOICE_LINE', 'CHARGE_ITEMS'] })
  source!: 'INVOICE_LINE' | 'CHARGE_ITEMS';
}

/** Un servicio que el paciente recibió. */
export class ReceivedServiceItemDto {
  /** Identificador del servicio recibido. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Tipo de servicio: intervención médica, vacunación u otro. */
  @ApiProperty({ enum: RECEIVED_SERVICE_TYPES })
  type!: ReceivedServiceType;

  /** Concepto del tipo, para resolver su etiqueta en terminología. */
  @ApiProperty({ format: 'uuid' })
  typeConceptId!: string;

  /** Qué se hizo: el código del procedimiento, de la vacuna o del tipo de caso. */
  @ApiProperty({ format: 'uuid' })
  serviceConceptId!: string;

  /** Estado del servicio. */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Cuándo se realizó. */
  @ApiProperty({ type: String, format: 'date-time' })
  performedAt!: Date;

  /** Profesional que lo realizó. */
  @ApiPropertyOptional({ format: 'uuid' })
  performerProfileId?: string;

  /**
   * Nombre del profesional, ya resuelto: el paciente no puede leer el padrón de
   * profesionales, así que no podría resolverlo desde `performerProfileId`.
   */
  @ApiPropertyOptional()
  performerName?: string;

  /** Sede donde se realizó. */
  @ApiPropertyOptional({ format: 'uuid' })
  practiceSiteId?: string;

  /** Nombre de la sede, ya resuelto. */
  @ApiPropertyOptional()
  practiceSiteName?: string;

  /** Atención en la que ocurrió. */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /** Resultado del servicio, como concepto. */
  @ApiPropertyOptional({ format: 'uuid' })
  outcomeConceptId?: string;

  /** Nota o resultado en texto libre que dejó quien lo realizó. */
  @ApiPropertyOptional()
  resultText?: string;

  /** Costo registrado. `null` si no hay cobro registrado o si quien pide no ve importes. */
  @ApiProperty({ type: ReceivedServiceCostDto, nullable: true })
  cost!: ReceivedServiceCostDto | null;
}

/** Servicios recibidos de un paciente. */
export class PatientReceivedServicesResponseDto {
  /** Paciente de quien se lee. */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /** Servicios, el más reciente primero. */
  @ApiProperty({ type: [ReceivedServiceItemDto] })
  items!: ReceivedServiceItemDto[];

  /** Tope aplicado a la lista. */
  @ApiProperty({ description: 'Tope aplicado a la lista' })
  limit!: number;

  /** `true` si hay más servicios de los que el tope dejó pasar. */
  @ApiProperty()
  truncated!: boolean;

  /**
   * Si quien pide ve importes. Solo los ve el titular o quien lo representa: el
   * personal clínico lee el servicio sin el dinero. Con `false`, todo `cost` es
   * `null` y no significa «sin cobro».
   */
  @ApiProperty()
  costsVisible!: boolean;
}
