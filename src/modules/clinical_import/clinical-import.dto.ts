import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Campos de texto del `multipart/form-data` que crea un lote. El archivo viaja
 * aparte (`file`). Todos son opcionales A PROPÓSITO a nivel de pipe: la
 * declaración la valida el servicio y contesta con el campo exacto
 * (`DECLARATION_INVALID` + `details.field`), que es lo que la pantalla ancla.
 */
export class CreateClinicalImportDto {
  @ApiProperty({
    description: 'Tipo de registro (`hc-encuentro`, `hc-diagnostico`…)',
  })
  @IsString()
  @MaxLength(64)
  kind!: string;

  @ApiPropertyOptional({
    description: 'Organización de origen de los datos (1–200)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  sourceOrganization?: string;

  @ApiPropertyOptional({
    description: 'Base legal que habilita la carga (3–500)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  legalBasis?: string;

  @ApiPropertyOptional({
    description: 'Fecha de la carga AAAA-MM-DD, de hoy o anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  loadedAt?: string;
}

export class ImportTemplateQueryDto {
  @ApiProperty({ description: 'Tipo de registro' })
  @IsString()
  @MaxLength(64)
  kind!: string;

  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'csv' })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json';
}

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: ['json', 'csv'], default: 'json' })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv';
}
