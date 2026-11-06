import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { BULK_IMPORT_FORMATS } from '../bulk-import.constants';

/**
 * Cuerpo de `POST /admin/bulk-imports`.
 *
 * Dos formas, mutuamente excluyentes: `multipart/form-data` con el campo `file`
 * (CSV o JSON, hasta 20 MB) y estos campos como texto, o `application/json`
 * con `rows` (hasta el tope global de 1 MB del cuerpo JSON; para más, archivo).
 *
 * Los campos de declaración dependen del tipo de carga: `reason` para las altas
 * de usuarios; `sourceOrganization`, `legalBasis` y `loadedAt` para la historia
 * clínica. El servicio exige los que corresponden y rechaza los que no.
 */
export class CreateBulkImportDto {
  @ApiProperty({
    description: 'Tipo de carga (ver GET /admin/bulk-imports/templates)',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  kind!: string;

  @ApiPropertyOptional({
    description: 'Motivo del alta (cargas de usuarios)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Organización de origen de los datos (historia clínica)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceOrganization?: string;

  @ApiPropertyOptional({
    description: 'Base legal que habilita la carga (historia clínica)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  legalBasis?: string;

  @ApiPropertyOptional({
    description: 'Fecha de la carga, AAAA-MM-DD (historia clínica)',
    example: '2026-10-31',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  loadedAt?: string;

  @ApiPropertyOptional({
    description:
      'Filas de la carga como objetos con las columnas de la plantilla (alternativa al archivo)',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsOptional()
  // Las filas son datos, no un DTO: la transformación implícita del pipe global
  // las vaciaría (las trataría como instancias sin propiedades declaradas). Se
  // toma el arreglo tal cual vino; cada fila la valida el esquema del tipo.
  @Transform(({ obj }: { obj: { rows?: unknown } }) => obj.rows, {
    toClassOnly: true,
  })
  @IsArray()
  rows?: unknown[];
}

/** Query de `GET /admin/bulk-imports/templates/:kind`. */
export class TemplateQueryDto {
  @ApiPropertyOptional({ enum: BULK_IMPORT_FORMATS, default: 'csv' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  format?: string;
}

/** Query de `GET /admin/bulk-imports/:id/report`. */
export class ReportQueryDto {
  @ApiPropertyOptional({ enum: ['json', 'csv'], default: 'json' })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv';
}

/** Query de `GET /admin/bulk-imports`. */
export class ListBulkImportsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
