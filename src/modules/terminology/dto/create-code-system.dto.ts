import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Alta de un sistema de códigos (UC-03-01). Incluye los datos de la fuente que lo
 * publica: si no existe una fuente con ese `sourceCode` se crea, y si existe se
 * reutiliza.
 */
export class CreateCodeSystemDto {
  @ApiProperty({
    description: 'Código interno único del sistema de códigos',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  internalCode!: string;

  @ApiProperty({
    description: 'Nombre legible del sistema de códigos',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'URL canónica FHIR del sistema de códigos' })
  @IsString()
  @IsNotEmpty()
  canonicalUrl!: string;

  @ApiProperty({
    description: 'Código de negocio de la fuente que publica el sistema',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sourceCode!: string;

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
  @ApiProperty({ description: 'Id del sistema de códigos creado' })
  id!: string;

  @ApiProperty({ description: 'Código interno del sistema de códigos' })
  internalCode!: string;

  @ApiProperty({ description: 'Id de la fuente (creada o reutilizada)' })
  sourceId!: string;
}
