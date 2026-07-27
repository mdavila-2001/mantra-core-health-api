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
  @ApiProperty({
    description: 'Código del documento de disclosure',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  documentCode!: string;

  @ApiPropertyOptional({ description: 'Número de versión', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;

  @ApiPropertyOptional({
    description: 'Jurisdicción (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Documento en object storage (file id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  documentCode!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty()
  createdAt!: Date;
}
