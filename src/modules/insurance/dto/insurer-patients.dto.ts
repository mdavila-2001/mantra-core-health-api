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

/** `GET /insurance/patients` — filtros del directorio. Ninguno elige la aseguradora. */
export class InsurerPatientSearchQueryDto {
  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional({ description: 'Cursor opaco de la página anterior' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ enum: INSURER_PATIENT_PAGE_SIZES, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(INSURER_PATIENT_PAGE_SIZES)
  limit?: number;

  @ApiPropertyOptional({
    description:
      'Nombre, teléfono o correo (contiene, sin tildes) o documento de identidad (exacto).',
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
    format: 'uuid',
    description: 'Ocupación del catálogo',
  })
  @IsOptional()
  @IsUUID()
  occupationConceptId?: string;

  @ApiPropertyOptional({ example: '1980-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  birthDateFrom?: string;

  @ApiPropertyOptional({ example: '1999-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
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

/** La cobertura del paciente **con esta aseguradora**; nunca la de otra. */
export class InsurerPatientCoverageDto {
  @ApiProperty({
    description:
      'Si tiene una cobertura vigente con esta aseguradora. `false` ⇒ la pantalla dice «Ninguno».',
  })
  hasActiveCoverage!: boolean;

  @ApiPropertyOptional()
  planName?: string;

  @ApiPropertyOptional()
  policyIdentifier?: string;

  @ApiPropertyOptional()
  memberIdentifier?: string;

  @ApiPropertyOptional({
    enum: ['CURRENT', 'UPCOMING', 'EXPIRED', 'INACTIVE', 'UNKNOWN'],
  })
  validityStatus?: string;
}

/** Una fila del directorio. Datos de contacto y filiación; nada clínico. */
export class InsurerPatientListItemDto {
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional({ description: 'Documento de identidad' })
  documentNumber?: string;

  @ApiPropertyOptional({ example: '1990-04-12' })
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Años cumplidos a la fecha de La Paz' })
  age?: number;

  @ApiPropertyOptional({ description: 'Celular, o el fijo si no hay celular' })
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  genderConceptId?: string;

  @ApiPropertyOptional({
    description:
      'Código del sexo administrativo (`GENDER_FEMALE`…). Se manda el código y no el display: el catálogo lo rotula en inglés técnico y la palabra la pone la pantalla.',
  })
  genderCode?: string;

  @ApiPropertyOptional({ description: 'Del catálogo; si no, el texto libre' })
  occupationDisplay?: string;

  @ApiProperty({ type: InsurerPatientCoverageDto })
  coverage!: InsurerPatientCoverageDto;

  @ApiPropertyOptional({
    description:
      'Slug del perfil público con el que se le puede escribir. Ausente ⇒ todavía no activó la mensajería.',
  })
  communityProfileSlug?: string;
}

/** Página del directorio, por cursor (M34): sin total ni número de página. */
export class InsurerPatientListDto {
  @ApiProperty({ type: [InsurerPatientListItemDto] })
  items!: InsurerPatientListItemDto[];

  @ApiProperty()
  limit!: number;

  @ApiProperty({ type: String, nullable: true })
  nextCursor!: string | null;
}
