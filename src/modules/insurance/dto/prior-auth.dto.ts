import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Ítem de una solicitud de autorización previa (UC-26-04). */
export class PriorAuthItemDto {
  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Servicio solicitado' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pharmacyProductId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticStudyOfferingId?: string;

  /**
   * Valor de requested quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad solicitada', example: '1' })
  @IsOptional()
  @IsNumberString()
  requestedQuantity?: string;

  /**
   * Valor de requested amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto solicitado', example: '250.00' })
  @IsOptional()
  @IsNumberString()
  requestedAmount?: string;
}

/** UC-26-04: solicitar autorización previa con items. */
export class CreatePriorAuthRequestDto {
  /**
   * Identificador asociado a patient coverage.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inventoryReservationId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Receta del pedido vinculado',
  })
  @IsOptional()
  @IsUUID()
  medicationRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Identificador asociado a requesting provider entity.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Entidad prestadora solicitante',
  })
  @IsUUID()
  requestingProviderEntityId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({
    type: [PriorAuthItemDto],
    description: '1..N ítems solicitados',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PriorAuthItemDto)
  items!: PriorAuthItemDto[];
}

/**
 * Decisión de la aseguradora sobre UN ítem de la solicitud (registro de
 * procesos · MÓDULO ASEGURADORA · Recepción de solicitudes de órdenes de
 * Aprobación · 3): APROBADO o NO APROBADO, y si no se aprueba, por qué según
 * la cláusula del contrato. Mismo contrato de campos que `LineAdjudicationDto`
 * del reclamo.
 */
export class ItemDeterminationDto {
  @ApiProperty({ format: 'uuid', description: 'Ítem de la solicitud decidido' })
  @IsUUID()
  priorAuthorizationItemId!: string;

  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  @IsIn(['APPROVED', 'DENIED'])
  decision!: 'APPROVED' | 'DENIED';

  /**
   * Motivo tipificado (concepto de terminology). El catálogo interno todavía
   * no declara miembros (AC-16-8): se acepta y se persiste tal cual.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  denialReasonConceptId?: string;

  /** Cita de la cláusula contractual. **Obligatoria al denegar.** */
  @ApiPropertyOptional({
    maxLength: 255,
    example: 'Cláusula 12.3: medicamento no cubierto en plan ambulatorio',
  })
  @ValidateIf(
    (o: ItemDeterminationDto) =>
      o.decision === 'DENIED' || o.policyClauseReference !== undefined,
  )
  @IsNotEmpty({
    message:
      'La referencia de cláusula contractual es obligatoria al denegar un ítem',
  })
  @IsString()
  @MaxLength(255)
  policyClauseReference?: string;

  /** Justificación circunstanciada, opcional incluso al denegar. */
  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  denialRationale?: string;

  /** Cantidad aprobada; por omisión, la solicitada si se aprueba. */
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  approvedQuantity?: string;

  /** Monto aprobado; por omisión, el solicitado si se aprueba. */
  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;
}

/**
 * UC-26-05: emitir determinación de autorización previa.
 *
 * Dos formas:
 * - **Por ítem** (`items`): cada ítem de la solicitud se decide exactamente
 *   una vez; la decisión global se deriva (todo aprobado → APPROVED, todo
 *   denegado → DENIED, mezcla → PARTIAL). Si además viene `decision`, tiene
 *   que coincidir con la derivada.
 * - **Global** (sin `items`, forma histórica): `decision` es obligatoria.
 */
export class CreateDeterminationDto {
  /**
   * Decisión global. Obligatoria si no vienen `items`.
   */
  @ApiPropertyOptional({ enum: ['APPROVED', 'DENIED', 'PARTIAL'] })
  @ValidateIf(
    (o: CreateDeterminationDto) =>
      o.items === undefined || o.decision !== undefined,
  )
  @IsIn(['APPROVED', 'DENIED', 'PARTIAL'])
  decision?: 'APPROVED' | 'DENIED' | 'PARTIAL';

  /** Decisión por ítem: APROBADO / NO APROBADO con la cláusula. */
  @ApiPropertyOptional({ type: [ItemDeterminationDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDeterminationDto)
  items?: ItemDeterminationDto[];

  /**
   * Valor de approved quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cantidad aprobada' })
  @IsOptional()
  @IsNumberString()
  approvedQuantity?: string;

  /**
   * Valor de approved amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Monto aprobado' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsString()
  validTo?: string;
}

/** Filtro de la bandeja de la aseguradora. */
export class PriorAuthInboxQueryDto {
  /** `PENDING` (enviada o en revisión) o `DETERMINED`. Sin filtro: todas. */
  @ApiPropertyOptional({ enum: ['PENDING', 'DETERMINED'] })
  @IsOptional()
  @IsIn(['PENDING', 'DETERMINED'])
  status?: 'PENDING' | 'DETERMINED';
}

/** Paciente de la solicitud, tal como lo ve la aseguradora. */
export class PriorAuthPatientDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, type: String })
  displayName!: string | null;

  @ApiProperty({ nullable: true, type: String })
  patientCode!: string | null;

  @ApiProperty({ nullable: true, type: String })
  memberIdentifier!: string | null;
}

/** Decisión vigente de un ítem. */
export class PriorAuthItemDecisionDto {
  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  decision!: 'APPROVED' | 'DENIED';

  @ApiProperty({ nullable: true, type: String })
  approvedQuantity!: string | null;

  @ApiProperty({ nullable: true, type: String })
  approvedAmount!: string | null;

  @ApiProperty({ nullable: true, type: String })
  policyClauseReference!: string | null;

  @ApiProperty({ nullable: true, type: String })
  denialRationale!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  decidedAt!: string;
}

/** Un ítem de la solicitud con su decisión vigente, si la hay. */
export class PriorAuthItemViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  sequence!: number;

  /** Nombre legible: producto, estudio o servicio. */
  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true, type: String })
  requestedQuantity!: string | null;

  @ApiProperty({ nullable: true, type: String })
  requestedAmount!: string | null;

  @ApiProperty({ type: PriorAuthItemDecisionDto, nullable: true })
  decision!: PriorAuthItemDecisionDto | null;
}

/** Una fila de la bandeja de solicitudes de aprobación. */
export class PriorAuthListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** `PHARMACY` (receta), `DIAGNOSTIC` (laboratorio/imagen) o `GENERIC`. */
  @ApiProperty({ enum: ['PHARMACY', 'DIAGNOSTIC', 'GENERIC'] })
  origin!: 'PHARMACY' | 'DIAGNOSTIC' | 'GENERIC';

  /** `SUBMITTED`, `IN_REVIEW` o `DETERMINED`. */
  @ApiProperty({ enum: ['SUBMITTED', 'IN_REVIEW', 'DETERMINED'] })
  status!: 'SUBMITTED' | 'IN_REVIEW' | 'DETERMINED';

  /** Decisión global vigente; `null` mientras está pendiente. */
  @ApiProperty({ enum: ['APPROVED', 'DENIED', 'PARTIAL'], nullable: true })
  decision!: 'APPROVED' | 'DENIED' | 'PARTIAL' | null;

  @ApiProperty({ type: PriorAuthPatientDto })
  patient!: PriorAuthPatientDto;

  @ApiProperty({ nullable: true, type: String })
  planName!: string | null;

  @ApiProperty({ nullable: true, type: String })
  currencyCode!: string | null;

  @ApiProperty()
  itemCount!: number;

  @ApiProperty({ nullable: true, type: String })
  totalRequestedAmount!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  submittedAt!: string | null;
}

/** Detalle de la solicitud con sus ítems. */
export class PriorAuthDetailDto extends PriorAuthListItemDto {
  @ApiProperty({ type: [PriorAuthItemViewDto] })
  items!: PriorAuthItemViewDto[];

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  decidedAt!: string | null;
}

/** Bandeja de la aseguradora. */
export class PriorAuthListDto {
  @ApiProperty({ type: [PriorAuthListItemDto] })
  items!: PriorAuthListItemDto[];
}
