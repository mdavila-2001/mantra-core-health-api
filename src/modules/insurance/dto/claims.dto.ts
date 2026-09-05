import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Línea de un reclamo (UC-26-06). */
export class ClaimLineDto {
  /**
   * Valor de line sequence mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Secuencia única dentro del reclamo',
    example: 1,
  })
  @IsInt()
  @Min(1)
  lineSequence!: number;

  /**
   * Identificador asociado a service concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceConceptId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  quantity?: string;

  /**
   * Valor de billed amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Monto facturado', example: '100.00' })
  @IsNumberString()
  billedAmount!: string;

  /**
   * Documento clínico que respalda el ítem, como texto.
   *
   * `insurance_claim_lines.supporting_clinical_reference` existe en el modelo
   * y **ningún endpoint podía escribirla**: la columna quedaba siempre nula,
   * así que el ítem no tenía forma de decir de qué atención sale. Es la única
   * referencia disponible para la solicitud de imagen, la receta y «otro
   * procedimiento», que no tienen clave foránea propia.
   *
   * Es un `varchar` **sin integridad referencial**: la lectura lo devuelve con
   * el tipo de documento sin declarar, y la pantalla dice que no está
   * registrado en vez de adivinarlo.
   */
  @ApiPropertyOptional({ maxLength: 200, example: 'ENC-2026-00412' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  supportingClinicalReference?: string;

  /**
   * Valor de patient responsibility amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Responsabilidad del paciente',
    example: '20.00',
  })
  @IsOptional()
  @IsNumberString()
  patientResponsibilityAmount?: string;
}

/** UC-26-06: enviar reclamo con líneas (837). */
export class CreateClaimDto {
  /**
   * Identificador asociado a insurance carrier.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  insuranceCarrierId!: string;

  /**
   * Identificador asociado a patient coverage.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientCoverageId!: string;

  /**
   * Identificador asociado a billing provider entity.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad facturadora' })
  @IsUUID()
  billingProviderEntityId!: string;

  /**
   * Valor de claim identifier mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MaxLength(80)
  claimIdentifier!: string;

  /**
   * Identificador asociado a prior authorization request.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Autorización previa vinculada',
  })
  @IsOptional()
  @IsUUID()
  priorAuthorizationRequestId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({ type: [ClaimLineDto], description: '1..N líneas' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ClaimLineDto)
  lines!: ClaimLineDto[];
}

/** Adjudicación de una línea (UC-26-07). */
export class LineAdjudicationDto {
  /**
   * Identificador asociado a insurance claim line.
   */
  @ApiProperty({ format: 'uuid', description: 'Línea del reclamo adjudicada' })
  @IsUUID()
  insuranceClaimLineId!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  @IsIn(['APPROVED', 'DENIED'])
  decision!: 'APPROVED' | 'DENIED';

  /**
   * Motivo catalogado por el que se denegó esta línea.
   *
   * `claim_line_adjudications.reason_concept_id` existe en el modelo desde
   * siempre y **ningún endpoint podía escribirlo**: la columna quedaba nula, y
   * por eso la columna «Motivo» del detalle sale vacía en todos los rechazos.
   * Esto abre la vía de escritura; el **contenido** del catálogo es otra cosa.
   *
   * Justin decidió (2026-09-04) que los motivos salen de un **catálogo interno
   * único de MANTRA**, no de la aseguradora ni de uno por tenant. Ese catálogo
   * **todavía no declara miembros** —la terminología sólo trae el concepto de
   * arranque, sin lista—, y acuñar códigos «plausibles» está prohibido. Hasta
   * que exista, el campo se acepta y se persiste tal cual: es un `uuid` de
   * `terminology.catalog_concepts` y quien lo envía responde por él (AC-16-8).
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Motivo catalogado de la denegación (concepto de terminology). El ' +
      'catálogo interno todavía no declara sus miembros — AC-16-8.',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de approved amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  approvedAmount?: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  patientAmount?: string;

  /**
   * Valor de denied amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  deniedAmount?: string;
}

/** UC-26-07: adjudicar reclamo por línea (835). */
export class CreateAdjudicationDto {
  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ enum: ['APPROVED', 'DENIED'] })
  @IsIn(['APPROVED', 'DENIED'])
  outcome!: 'APPROVED' | 'DENIED';

  /**
   * Texto de la disposición, tal cual lo emitió la aseguradora.
   *
   * `claim_adjudication_versions.disposition_text` existe en el modelo y
   * **ningún endpoint podía escribirlo**: la columna quedaba siempre nula, así
   * que el único lugar donde una aseguradora explica su decisión no tenía
   * entrada. Es el texto que la pantalla del reclamo muestra junto al
   * dictamen; sin él, un rechazo llega con un concepto y sin motivo redactado.
   *
   * Es **de la versión entera**, no del ítem: el motivo particular de un ítem
   * va en `claim_line_adjudications.reason_concept_id`, que es un concepto y no
   * texto libre.
   */
  @ApiPropertyOptional({
    maxLength: 4000,
    example: 'Prestaciones cubiertas por el plan familiar.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  dispositionText?: string;

  /**
   * Valor de total approved amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  totalApprovedAmount?: string;

  /**
   * Valor de total patient amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '20.00' })
  @IsOptional()
  @IsNumberString()
  totalPatientAmount?: string;

  /**
   * Valor de total denied amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  totalDeniedAmount?: string;

  /**
   * Valor de line adjudications mantenido por la instancia.
   */
  @ApiProperty({
    type: [LineAdjudicationDto],
    description: 'Una por línea del reclamo',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineAdjudicationDto)
  lineAdjudications!: LineAdjudicationDto[];
}

/** UC-26-08: publicar EOB para el paciente. */
export class PublishEobDto {
  /**
   * Identificador asociado a document record.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Documento generado (object storage)',
  })
  @IsOptional()
  @IsUUID()
  documentRecordId?: string;
}

/** UC-26-10: registrar reversión de reclamo. */
export class CreateReversalDto {
  /**
   * Identificador asociado a reversed adjudication version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión de adjudicación a revertir',
  })
  @IsUUID()
  reversedAdjudicationVersionId!: string;

  /**
   * Valor de reversal amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '80.00' })
  @IsOptional()
  @IsNumberString()
  reversalAmount?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

/** UC-26-11: abrir disputa sobre adjudicación. */
export class CreateDisputeDto {
  /**
   * Identificador asociado a claim adjudication version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión de adjudicación disputada',
  })
  @IsOptional()
  @IsUUID()
  claimAdjudicationVersionId?: string;

  /**
   * Valor de initiated by mantenido por la instancia.
   */
  @ApiProperty({
    enum: ['PROVIDER', 'PATIENT'],
    description: 'Parte que inicia',
  })
  @IsIn(['PROVIDER', 'PATIENT'])
  initiatedBy!: 'PROVIDER' | 'PATIENT';

  /**
   * Identificador asociado a initiated by entity.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  initiatedByEntityId?: string;

  /**
   * Valor de filing deadline mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'Fecha límite de presentación',
  })
  @IsOptional()
  @IsString()
  filingDeadline?: string;
}
