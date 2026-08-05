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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del concepto dentro de la versión',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  code!: string;

  /**
   * Valor de display mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Texto de presentación del concepto',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  display!: string;

  /**
   * Valor de definition mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Definición larga del concepto' })
  @IsOptional()
  @IsString()
  definition?: string;
}

/** Importación en bloque de conceptos en una versión (UC-03-03). */
export class ImportConceptsDto {
  /**
   * Valor de concepts mantenido por la instancia.
   */
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
  /**
   * Valor de inserted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Conceptos insertados' })
  inserted!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Conceptos omitidos por existir ya en la versión',
  })
  skipped!: number;

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Conceptos recibidos en la petición' })
  total!: number;
}
