import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /virtual-encounters` (UC-18-12, alta). */
export class CreateVirtualEncounterDto {
  @ApiProperty({ format: 'uuid', description: 'Encuentro clínico (1:1)' })
  @IsUUID()
  encounterId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Plataforma de telesalud (concept id)' })
  @IsOptional()
  @IsUUID()
  platformConceptId?: string;

  @ApiPropertyOptional({ description: 'URL de la reunión' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  meetingUrl?: string;

  @ApiPropertyOptional({ description: 'Identificador de la reunión' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  meetingId?: string;
}

/** Cuerpo de `PATCH /virtual-encounters/{id}/end` (UC-18-12, cierre). */
export class EndVirtualEncounterDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Manifiesto de grabación (common.files)' })
  @IsOptional()
  @IsUUID()
  recordingFileId?: string;
}

/** Respuesta de una sesión de telesalud. */
export class VirtualEncounterResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  encounterId!: string;

  @ApiProperty({ format: 'uuid', description: 'Estado de la sesión (concept id)' })
  statusConceptId!: string;
}
