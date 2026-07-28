import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /virtual-encounters` (UC-18-12, alta). */
export class CreateVirtualEncounterDto {
  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({ format: 'uuid', description: 'Encuentro clínico (1:1)' })
  @IsUUID()
  encounterId!: string;

  /**
   * Identificador asociado a platform concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Plataforma de telesalud (concept id)',
  })
  @IsOptional()
  @IsUUID()
  platformConceptId?: string;

  /**
   * Valor de meeting url mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URL de la reunión' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  meetingUrl?: string;

  /**
   * Identificador asociado a meeting.
   */
  @ApiPropertyOptional({ description: 'Identificador de la reunión' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  meetingId?: string;
}

/** Cuerpo de `PATCH /virtual-encounters/{id}/end` (UC-18-12, cierre). */
export class EndVirtualEncounterDto {
  /**
   * Identificador asociado a recording file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto de grabación (common.files)',
  })
  @IsOptional()
  @IsUUID()
  recordingFileId?: string;
}

/** Respuesta de una sesión de telesalud. */
export class VirtualEncounterResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({ format: 'uuid' })
  encounterId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado de la sesión (concept id)',
  })
  statusConceptId!: string;
}
