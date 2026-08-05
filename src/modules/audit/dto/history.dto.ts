import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Query de `GET /audit/history/{entity}/{id}` (UC-10-05). */
export class HistoryQueryDto {
  /**
   * Valor de as of mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Reconstrucción point-in-time: fila vigente a esta fecha ISO-8601',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  as_of?: string;
}

/** Una revisión en la línea de tiempo. */
export class HistoryRevisionDto {
  /**
   * Valor de revision no mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de revisión monotónico' })
  revisionNo?: number;

  /**
   * Identificador asociado a operation concept.
   */
  @ApiProperty({
    description: 'Operación (INSERT/UPDATE/DELETE) como concepto',
  })
  operationConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde',
    type: String,
    format: 'date-time',
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente hasta',
    type: String,
    format: 'date-time',
  })
  validTo?: Date;

  /**
   * Identificador asociado a changed by user.
   */
  @ApiPropertyOptional({ description: 'Usuario que efectuó el cambio' })
  changedByUserId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Momento del registro',
    type: String,
    format: 'date-time',
  })
  recordedAt!: Date;

  /**
   * Valor de data snapshot mantenido por la instancia.
   */
  @ApiProperty({ description: 'Snapshot del estado en esa revisión' })
  dataSnapshot!: unknown;
}

/** Respuesta de la consulta de historial. */
export class HistoryTimelineDto {
  /**
   * Valor de entity mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidad consultada' })
  entity!: string;

  /**
   * Identificador asociado a entity.
   */
  @ApiProperty({ description: 'Id del registro' })
  entityId!: string;

  /**
   * Valor de count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de revisiones devueltas' })
  count!: number;

  /**
   * Valor de revisions mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Revisiones ordenadas cronológicamente',
    type: [HistoryRevisionDto],
  })
  revisions!: HistoryRevisionDto[];
}
