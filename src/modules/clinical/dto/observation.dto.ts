import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/** Familia de valor común a observación y componente (mutuamente exclusiva). */
class ObservationValueInput {
  /**
   * Identificador asociado a value type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de valor (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  valueTypeConceptId?: string;

  /**
   * Valor de value decimal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor decimal' })
  @IsOptional()
  @IsNumber()
  valueDecimal?: number;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor booleano' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor de texto' })
  @IsOptional()
  @IsString()
  valueText?: string;

  /**
   * Identificador asociado a value concept.
   */
  @ApiPropertyOptional({
    description: 'Valor codificado (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  valueConceptId?: string;

  /**
   * Valor de quantity value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Magnitud de la cantidad' })
  @IsOptional()
  @IsNumber()
  quantityValue?: number;

  /**
   * Identificador asociado a quantity unit concept.
   */
  @ApiPropertyOptional({
    description: 'Unidad de la cantidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  quantityUnitConceptId?: string;
}

/** Componente de una observación (p. ej. sistólica/diastólica). */
export class ObservationComponentInput extends ObservationValueInput {
  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código del componente (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Identificador asociado a interpretation concept.
   */
  @ApiPropertyOptional({
    description: 'Interpretación (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;
}

/** Ejecutante de la observación. */
export class ObservationPerformerInput {
  /**
   * Identificador asociado a performer type concept.
   */
  @ApiProperty({
    description: 'Tipo de ejecutante (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  performerTypeConceptId!: string;

  /**
   * Identificador asociado a performer.
   */
  @ApiProperty({
    description: 'Id del ejecutante (profesional/dispositivo)',
    format: 'uuid',
  })
  @IsUUID()
  performerId!: string;

  /**
   * Identificador asociado a performer role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del ejecutante (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  performerRoleConceptId?: string;
}

/** Rango de referencia de la observación. */
export class ObservationReferenceRangeInput {
  /**
   * Valor de low value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Límite inferior' })
  @IsOptional()
  @IsNumber()
  lowValue?: number;

  /**
   * Valor de high value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Límite superior' })
  @IsOptional()
  @IsNumber()
  highValue?: number;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Valor de text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto libre del rango' })
  @IsOptional()
  @IsString()
  text?: string;
}

/** Cuerpo de `POST /clinical/observations` (UC-08-03). */
export class CreateObservationDto extends ObservationValueInput {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a based on service request.
   */
  @ApiPropertyOptional({
    description: 'Orden de servicio que la origina',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  basedOnServiceRequestId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código de la observación (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a interpretation concept.
   */
  @ApiPropertyOptional({
    description: 'Interpretación (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;

  /**
   * Identificador asociado a method concept.
   */
  @ApiPropertyOptional({ description: 'Método (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @ApiPropertyOptional({
    description: 'Sitio anatómico (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a source device.
   */
  @ApiPropertyOptional({ description: 'Dispositivo de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceDeviceId?: string;

  /**
   * Valor de effective start at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de vigencia clínica',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  effectiveStartAt?: string;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Momento de emisión',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  /**
   * Valor de components mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [ObservationComponentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationComponentInput)
  components?: ObservationComponentInput[];

  /**
   * Valor de performers mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [ObservationPerformerInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationPerformerInput)
  performers?: ObservationPerformerInput[];

  /**
   * Valor de reference ranges mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [ObservationReferenceRangeInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationReferenceRangeInput)
  referenceRanges?: ObservationReferenceRangeInput[];

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Notas de la observación',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];
}

/** Cuerpo de `PATCH /clinical/observations/{id}/amend` (UC-08-04). */
export class AmendObservationDto extends ObservationValueInput {
  /**
   * Valor de note mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nota que justifica la enmienda' })
  @IsString()
  note!: string;

  /**
   * Valor de expected row version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'row_version esperado (bloqueo optimista)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;

  /**
   * Identificador asociado a interpretation concept.
   */
  @ApiPropertyOptional({
    description: 'Interpretación revisada (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;
}

/** Respuesta de una observación. */
export class ObservationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Valor de component ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de componentes creados' })
  componentIds!: string[];

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @ApiProperty({ description: 'Versión optimista actual' })
  rowVersion!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
