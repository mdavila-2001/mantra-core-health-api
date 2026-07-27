import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
  MaxLength,
} from 'class-validator';

/** Un concepto individual dentro de una importación en bloque. */
export class ImportConceptItemDto {
  @ApiProperty({
    description: 'Código del concepto dentro de la versión',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  code!: string;

  @ApiProperty({
    description: 'Texto de presentación del concepto',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  display!: string;

  @ApiPropertyOptional({ description: 'Definición larga del concepto' })
  @IsOptional()
  @IsString()
  definition?: string;
}

/** Importación en bloque de conceptos en una versión (UC-03-03). */
export class ImportConceptsDto {
  @ApiProperty({
    type: [ImportConceptItemDto],
    description: 'Conceptos a importar',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImportConceptItemDto)
  concepts!: ImportConceptItemDto[];
}

/** Resultado de la importación en bloque. */
export class ImportConceptsResponseDto {
  @ApiProperty({ description: 'Conceptos insertados' })
  inserted!: number;

  @ApiProperty({
    description: 'Conceptos omitidos por existir ya en la versión',
  })
  skipped!: number;

  @ApiProperty({ description: 'Conceptos recibidos en la petición' })
  total!: number;
}
