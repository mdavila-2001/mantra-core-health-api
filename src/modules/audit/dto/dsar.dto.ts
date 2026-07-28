import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export const DSAR_TYPES = [
  'ACCESS',
  'ERASURE',
  'RECTIFICATION',
  'PORTABILITY',
  'OBJECTION',
] as const;
export const DSAR_TRANSITIONS = [
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
] as const;

/** Cuerpo de `POST /privacy/dsar` (UC-10-08). */
export class CreateDsarDto {
  /**
   * Valor de type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de solicitud del titular',
    enum: DSAR_TYPES,
  })
  @IsIn(DSAR_TYPES)
  type!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiPropertyOptional({
    description: 'Titular de los datos (FK iam.users); por defecto el actor',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Valor de jurisdiction mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción aplicable',
    enum: ['PE', 'EU', 'US'],
  })
  @IsOptional()
  @IsIn(['PE', 'EU', 'US'])
  jurisdiction?: string;
}

/** Cuerpo de `PATCH /privacy/dsar/{id}` (UC-10-08). */
export class UpdateDsarDto {
  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nuevo estado de la máquina DSAR',
    enum: DSAR_TRANSITIONS,
  })
  @IsIn(DSAR_TRANSITIONS)
  status!: string;

  /**
   * Identificador asociado a result file.
   */
  @ApiPropertyOptional({
    description: 'Paquete DSAR resultante (FK common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resultFileId?: string;
}

/** Respuesta de una solicitud DSAR. */
export class DsarResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la solicitud' })
  id!: string;

  /**
   * Identificador asociado a user.
   */
  @ApiProperty({ description: 'Titular de los datos' })
  userId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado actual (concepto)' })
  status!: string;

  /**
   * Valor de type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo (concepto)' })
  type!: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @ApiProperty({ description: 'Versión de fila optimista' })
  rowVersion!: number;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Solicitada el',
    type: String,
    format: 'date-time',
  })
  requestedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Completada el',
    type: String,
    format: 'date-time',
  })
  completedAt?: Date | null;
}
