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
  @ApiPropertyOptional({ description: 'Tipo de valor (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  valueTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Valor decimal' })
  @IsOptional()
  @IsNumber()
  valueDecimal?: number;

  @ApiPropertyOptional({ description: 'Valor booleano' })
  @IsOptional()
  @IsBoolean()
  valueBoolean?: boolean;

  @ApiPropertyOptional({ description: 'Valor de texto' })
  @IsOptional()
  @IsString()
  valueText?: string;

  @ApiPropertyOptional({ description: 'Valor codificado (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  valueConceptId?: string;

  @ApiPropertyOptional({ description: 'Magnitud de la cantidad' })
  @IsOptional()
  @IsNumber()
  quantityValue?: number;

  @ApiPropertyOptional({ description: 'Unidad de la cantidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  quantityUnitConceptId?: string;
}

/** Componente de una observación (p. ej. sistólica/diastólica). */
export class ObservationComponentInput extends ObservationValueInput {
  @ApiProperty({ description: 'Código del componente (concept id)', format: 'uuid' })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({ description: 'Interpretación (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;
}

/** Ejecutante de la observación. */
export class ObservationPerformerInput {
  @ApiProperty({ description: 'Tipo de ejecutante (concept id)', format: 'uuid' })
  @IsUUID()
  performerTypeConceptId!: string;

  @ApiProperty({ description: 'Id del ejecutante (profesional/dispositivo)', format: 'uuid' })
  @IsUUID()
  performerId!: string;

  @ApiPropertyOptional({ description: 'Rol del ejecutante (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerRoleConceptId?: string;
}

/** Rango de referencia de la observación. */
export class ObservationReferenceRangeInput {
  @ApiPropertyOptional({ description: 'Límite inferior' })
  @IsOptional()
  @IsNumber()
  lowValue?: number;

  @ApiPropertyOptional({ description: 'Límite superior' })
  @IsOptional()
  @IsNumber()
  highValue?: number;

  @ApiPropertyOptional({ description: 'Unidad (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ description: 'Texto libre del rango' })
  @IsOptional()
  @IsString()
  text?: string;
}

/** Cuerpo de `POST /clinical/observations` (UC-08-03). */
export class CreateObservationDto extends ObservationValueInput {
  @ApiProperty({ description: 'Tenant custodio (directory.tenants)', format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ description: 'Paciente (profiles.patient_profiles)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ description: 'Orden de servicio que la origina', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  basedOnServiceRequestId?: string;

  @ApiProperty({ description: 'Código de la observación (concept id)', format: 'uuid' })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({ description: 'Categoría (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({ description: 'Interpretación (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;

  @ApiPropertyOptional({ description: 'Método (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  methodConceptId?: string;

  @ApiPropertyOptional({ description: 'Sitio anatómico (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bodySiteConceptId?: string;

  @ApiPropertyOptional({ description: 'Dispositivo de origen', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceDeviceId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia clínica', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  effectiveStartAt?: string;

  @ApiPropertyOptional({ description: 'Momento de emisión', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional({ type: [ObservationComponentInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationComponentInput)
  components?: ObservationComponentInput[];

  @ApiPropertyOptional({ type: [ObservationPerformerInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationPerformerInput)
  performers?: ObservationPerformerInput[];

  @ApiPropertyOptional({ type: [ObservationReferenceRangeInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObservationReferenceRangeInput)
  referenceRanges?: ObservationReferenceRangeInput[];

  @ApiPropertyOptional({ type: [String], description: 'Notas de la observación' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notes?: string[];
}

/** Cuerpo de `PATCH /clinical/observations/{id}/amend` (UC-08-04). */
export class AmendObservationDto extends ObservationValueInput {
  @ApiProperty({ description: 'Nota que justifica la enmienda' })
  @IsString()
  note!: string;

  @ApiPropertyOptional({ description: 'row_version esperado (bloqueo optimista)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedRowVersion?: number;

  @ApiPropertyOptional({ description: 'Interpretación revisada (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  interpretationConceptId?: string;
}

/** Respuesta de una observación. */
export class ObservationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ type: [String], description: 'Ids de componentes creados' })
  componentIds!: string[];

  @ApiProperty({ description: 'Versión optimista actual' })
  rowVersion!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
