import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, MaxLength } from 'class-validator';

/** Alta de una versión de sistema de códigos (UC-03-02). */
export class CreateCodeSystemVersionDto {
  @ApiProperty({ description: 'Etiqueta de versión (p. ej. 1.0.0)', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  version!: string;

  @ApiPropertyOptional({ description: 'Marca la versión como predeterminada' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/** Respuesta del alta de versión. */
export class CodeSystemVersionResponseDto {
  @ApiProperty({ description: 'Id de la versión creada' })
  id!: string;

  @ApiProperty({ description: 'Etiqueta de versión' })
  version!: string;

  @ApiProperty({ description: 'Estado del ciclo de vida (código de concepto)' })
  state!: string;
}
