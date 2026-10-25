import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope de elementos por página de «quién accedió a mi historia». */
export const MY_DATA_ACCESS_MAX_PAGE_SIZE = 100;
export const MY_DATA_ACCESS_DEFAULT_PAGE_SIZE = 25;

/** Qué es quien accedió respecto del titular. */
export const ACCESSOR_KINDS = ['SELF', 'PRACTITIONER', 'OTHER'] as const;
export type AccessorKind = (typeof ACCESSOR_KINDS)[number];

/** Operaciones que `data_access_log` distingue. */
export const MY_DATA_ACCESS_OPERATIONS = [
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'EXPORT',
] as const;
export type MyDataAccessOperation = (typeof MY_DATA_ACCESS_OPERATIONS)[number];

/**
 * Filtros de `GET /audit/me/data-access`.
 *
 * No hay identificador de paciente, de usuario ni de organización: el sujeto sale de la cuenta de
 * la sesión y el resto de la fila no se filtra por nada que el cliente pueda declarar.
 */
export class MyDataAccessQueryDto {
  @ApiPropertyOptional({
    description: 'Desde (ISO 8601, incluido). Sin él, desde el primer acceso',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Hasta (ISO 8601, excluido)',
    example: '2026-10-25T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Si es `true`, omite los accesos del propio titular y deja sólo los de terceros',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  excludeOwn?: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MY_DATA_ACCESS_MAX_PAGE_SIZE,
    default: MY_DATA_ACCESS_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MY_DATA_ACCESS_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    maxLength: 400,
    description: '`nextCursor` de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  cursor?: string;
}

/** Quién accedió: lo que el titular necesita para reconocerlo, y nada más. */
export class DataAccessorDto {
  @ApiProperty({
    enum: ACCESSOR_KINDS,
    description:
      '`SELF` es el propio titular; `PRACTITIONER`, un profesional de la salud; `OTHER`, cualquier otra cuenta',
  })
  kind!: AccessorKind;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Nombre a mostrar de la persona vinculada a la cuenta; `null` si no tiene o si es el propio titular',
  })
  displayName!: string | null;
}

/** Un acceso a la historia del titular. */
export class MyDataAccessEntryDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador del registro' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  accessedAt!: string;

  @ApiProperty({ type: DataAccessorDto })
  accessor!: DataAccessorDto;

  @ApiProperty({ enum: MY_DATA_ACCESS_OPERATIONS })
  operation!: MyDataAccessOperation;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Tipo de dato al que se accedió (código, p. ej. `DIAGNOSTIC_RESULTS`)',
  })
  resourceType!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Finalidad con que se declaró el acceso (código, p. ej. `TREATMENT`, `PATIENT_ACCESS`)',
  })
  purpose!: string | null;
}

export class MyDataAccessPageDto {
  @ApiProperty({ type: [MyDataAccessEntryDto] })
  items!: MyDataAccessEntryDto[];

  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;

  @ApiProperty()
  limit!: number;
}
