import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

/** Tamaños de página que ofrece la tabla: los mismos tres del pedido. */
export const INSURER_PATIENT_PAGE_SIZES = [10, 25, 50] as const;

/**
 * Filtro por seguro. No es un catálogo del modelo —no se persiste en ninguna
 * columna—: es una pregunta sobre las coberturas de **esta** aseguradora.
 */
export const INSURER_PATIENT_INSURANCE_STATUSES = [
  'ALL',
  'WITH_INSURANCE',
  'NO_INSURANCE',
] as const;
export type InsurerPatientInsuranceStatus =
  (typeof INSURER_PATIENT_INSURANCE_STATUSES)[number];

/** Columnas por las que se puede ordenar con cursor. */
export const INSURER_PATIENT_SORT_FIELDS = [
  'fullName',
  'birthDate',
  'createdAt',
] as const;
export type InsurerPatientSortField =
  (typeof INSURER_PATIENT_SORT_FIELDS)[number];

export const INSURER_PATIENT_SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type InsurerPatientSortDirection =
  (typeof INSURER_PATIENT_SORT_DIRECTIONS)[number];

/** Filtros en POST /insurance/patients/search; nunca determinan el alcance. */
export class InsurerPatientSearchQueryDto {
  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cursor?: string;

  @ApiPropertyOptional({ enum: INSURER_PATIENT_PAGE_SIZES, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(INSURER_PATIENT_PAGE_SIZES)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Nombre, teléfono o correo (contiene, sin tildes).',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Sexo administrativo' })
  @IsOptional()
  @IsUUID()
  genderConceptId?: string;

  @ApiPropertyOptional({
    description: 'Profesión de catálogo o texto libre',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  insuranceCarrierId?: string;

  @ApiPropertyOptional({ example: '1980-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDateFrom?: string;

  @ApiPropertyOptional({ example: '1999-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDateTo?: string;

  @ApiPropertyOptional({
    enum: INSURER_PATIENT_INSURANCE_STATUSES,
    default: 'ALL',
  })
  @IsOptional()
  @IsIn(INSURER_PATIENT_INSURANCE_STATUSES)
  insuranceStatus?: InsurerPatientInsuranceStatus;

  @ApiPropertyOptional({
    enum: INSURER_PATIENT_SORT_FIELDS,
    default: 'fullName',
  })
  @IsOptional()
  @IsIn(INSURER_PATIENT_SORT_FIELDS)
  sortBy?: InsurerPatientSortField;

  @ApiPropertyOptional({
    enum: INSURER_PATIENT_SORT_DIRECTIONS,
    default: 'asc',
  })
  @IsOptional()
  @IsIn(INSURER_PATIENT_SORT_DIRECTIONS)
  sortDirection?: InsurerPatientSortDirection;
}

/** Projection of an authorized insurer; no policy identifiers. */
export class InsurerPatientCarrierDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  name!: string;
}

export class InsurerPatientOptionsDto {
  @ApiProperty({ type: [InsurerPatientCarrierDto] })
  insurers!: InsurerPatientCarrierDto[];
}

export class InsurerPatientMessagingDto {
  @ApiProperty({ enum: ['internal'] })
  channel!: 'internal';
  @ApiProperty()
  available!: boolean;
}

/** Minimum fields required by the patient directory. */
export class InsurerPatientListItemDto {
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;
  @ApiProperty()
  fullName!: string;
  @ApiPropertyOptional({ example: '1990-04-12' })
  birthDate?: string;
  @ApiPropertyOptional()
  age?: number;
  @ApiPropertyOptional()
  phone?: string;
  @ApiPropertyOptional()
  email?: string;
  @ApiPropertyOptional()
  genderCode?: string;
  @ApiPropertyOptional()
  occupationDisplay?: string;
  @ApiProperty({ type: [InsurerPatientCarrierDto] })
  insurers!: InsurerPatientCarrierDto[];
  @ApiProperty({ type: InsurerPatientMessagingDto })
  messaging!: InsurerPatientMessagingDto;
}

export class InsurerPatientListDto {
  @ApiProperty({ type: [InsurerPatientListItemDto] })
  items!: InsurerPatientListItemDto[];
  @ApiProperty()
  total!: number;
  @ApiProperty()
  limit!: number;
  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;
}

export class InsurerPatientConversationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;
  @ApiProperty({ enum: ['internal'] })
  @IsIn(['internal'])
  channel!: 'internal';
}

export class InsurerPatientConversationResponseDto {
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;
}
