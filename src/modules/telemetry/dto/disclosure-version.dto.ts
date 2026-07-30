import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `POST /telemetry/disclosure-versions` (UC-28-03). */
export class CreateDisclosureVersionDto {
  /**
   * Valor de document code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código del documento de disclosure',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  documentCode!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de versión', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({
    description: 'Documento en object storage (file id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del contenido del documento',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;
}

/** Respuesta de una versión de disclosure publicada. */
export class DisclosureVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de document code mantenido por la instancia.
   */
  @ApiProperty()
  documentCode!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}
