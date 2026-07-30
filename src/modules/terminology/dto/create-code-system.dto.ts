import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Alta de un sistema de códigos (UC-03-01). Incluye los datos de la fuente que lo
 * publica: si no existe una fuente con ese `sourceCode` se crea, y si existe se
 * reutiliza.
 */
export class CreateCodeSystemDto {
  /**
   * Valor de internal code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código interno único del sistema de códigos',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  internalCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre legible del sistema de códigos',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  /**
   * Valor de canonical url mantenido por la instancia.
   */
  @ApiProperty({ description: 'URL canónica FHIR del sistema de códigos' })
  @IsString()
  @IsNotEmpty()
  canonicalUrl!: string;

  /**
   * Valor de source code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código de negocio de la fuente que publica el sistema',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourceCode!: string;

  /**
   * Valor de source name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre de la fuente que publica el sistema',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourceName!: string;
}

/** Respuesta del alta de sistema de códigos. */
export class CodeSystemResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id del sistema de códigos creado' })
  id!: string;

  /**
   * Valor de internal code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código interno del sistema de códigos' })
  internalCode!: string;

  /**
   * Identificador asociado a source.
   */
  @ApiProperty({ description: 'Id de la fuente (creada o reutilizada)' })
  sourceId!: string;
}
