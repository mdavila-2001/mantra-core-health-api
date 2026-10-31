import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  ANALYSIS_CATEGORIES,
  type AnalysisCategory,
} from '../service-request-category';
import { ImagingDetailDto } from './service-request-detail.dto';
import {
  MAX_BASED_ON_NOTES,
  ServiceRequestResponseDto,
} from './service-request.dto';

/** Tope de renglones por requisición. */
export const MAX_REQUISITION_ITEMS = 30;

/** Decisión de antiduplicación de UN renglón (mismos campos que el alta individual). */
export class RequisitionDuplicateDecisionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  previousDiagnosticReportId!: string;

  @ApiPropertyOptional({ description: 'Reutilizar el informe previo' })
  @ValidateIf(
    (o: RequisitionDuplicateDecisionDto) => o.reusePreviousReport !== undefined,
  )
  @IsBoolean()
  reusePreviousReport?: boolean;

  @ApiPropertyOptional({ minLength: 20, maxLength: 1000 })
  @ValidateIf(
    (o: RequisitionDuplicateDecisionDto) =>
      o.duplicateOverrideReason !== undefined,
  )
  @IsString()
  @MinLength(20, {
    message: 'La justificación clínica requiere al menos 20 caracteres',
  })
  @MaxLength(1000)
  duplicateOverrideReason?: string;
}

/** Un renglón (un estudio) de la requisición. */
export class RequisitionItemDto {
  @ApiProperty({
    description: 'Estudio pedido (concept id de service-request-code)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  @ApiPropertyOptional({ enum: ANALYSIS_CATEGORIES })
  @IsOptional()
  @IsIn(ANALYSIS_CATEGORIES)
  category?: AnalysisCategory;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({
    description: 'Muestra (specimen-type); sólo laboratorio/patología',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  specimenTypeConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Componentes MARCADOS del panel. Obligatorio y no vacío si el estudio es un panel desplegable',
    type: [String],
    format: 'uuid',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  componentConceptIds?: string[];

  @ApiPropertyOptional({ type: () => ImagingDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImagingDetailDto)
  imaging?: ImagingDetailDto;

  @ApiPropertyOptional({ type: () => RequisitionDuplicateDecisionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequisitionDuplicateDecisionDto)
  duplicateDecision?: RequisitionDuplicateDecisionDto;
}

/** Cuerpo de `POST /clinical/requisitions` (header `Idempotency-Key` opcional). */
export class CreateRequisitionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  custodianTenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  formInstanceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requesterProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  priorityConceptId?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    maxItems: MAX_BASED_ON_NOTES,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_BASED_ON_NOTES)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  basedOnNoteIds?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerSelectionConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  performerPractitionerProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  suggestedPracticeSiteId?: string;

  @ApiProperty({
    type: [RequisitionItemDto],
    minItems: 1,
    maxItems: MAX_REQUISITION_ITEMS,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_REQUISITION_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items!: RequisitionItemDto[];
}

/** Respuesta de `POST /clinical/requisitions`. */
export class RequisitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  requisitionId!: string;

  @ApiProperty({
    description:
      'true si la Idempotency-Key ya había creado esta requisición: se devuelve la existente sin escribir nada',
  })
  replayed!: boolean;

  @ApiProperty({ type: [ServiceRequestResponseDto] })
  items!: ServiceRequestResponseDto[];
}
