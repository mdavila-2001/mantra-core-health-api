import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// ---------------------------------------------------------------------------
// UC-53-13 · Cancelación
// ---------------------------------------------------------------------------

/** A quién se atribuye la cancelación. */
export type CancellationCategory = 'PATIENT' | 'FACILITY' | 'CLINICAL';
export const CANCELLATION_CATEGORIES = ['PATIENT', 'FACILITY', 'CLINICAL'] as const;

/** Cuerpo de `POST /procedure-cases/{id}/cancel` (UC-53-13). */
export class CancelCaseDto {
  /**
   * Identificador asociado a cancellation reason concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Motivo de la cancelación' })
  @IsUUID()
  cancellationReasonConceptId!: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiProperty({ enum: CANCELLATION_CATEGORIES })
  @IsIn(CANCELLATION_CATEGORIES)
  category!: CancellationCategory;

  /**
   * Valor de preventable mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Si era evitable; es lo que mide la calidad del proceso',
  })
  @IsBoolean()
  preventable!: boolean;

  /**
   * Valor de explanation text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanationText?: string;

  /**
   * Valor de reschedule required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rescheduleRequired?: boolean;
}

/**
 * Define el contrato validado para cancel case response.
 */
export class CancelCaseResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a cancellation.
   */
  @ApiProperty({ format: 'uuid', description: 'Registro de la cancelación' })
  cancellationId!: string;

  /**
   * Valor de operating room released mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si se liberó el quirófano reservado' })
  operatingRoomReleased!: boolean;
}
