import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

/** Query de `GET /audit/history/{entity}/{id}` (UC-10-05). */
export class HistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Reconstrucción point-in-time: fila vigente a esta fecha ISO-8601',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  as_of?: string;
}

/** Una revisión en la línea de tiempo. */
export class HistoryRevisionDto {
  @ApiPropertyOptional({ description: 'Número de revisión monotónico' })
  revisionNo?: number;

  @ApiProperty({ description: 'Operación (INSERT/UPDATE/DELETE) como concepto' })
  operationConceptId!: string;

  @ApiPropertyOptional({ description: 'Vigente desde', type: String, format: 'date-time' })
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Vigente hasta', type: String, format: 'date-time' })
  validTo?: Date;

  @ApiPropertyOptional({ description: 'Usuario que efectuó el cambio' })
  changedByUserId?: string;

  @ApiProperty({ description: 'Momento del registro', type: String, format: 'date-time' })
  recordedAt!: Date;

  @ApiProperty({ description: 'Snapshot del estado en esa revisión' })
  dataSnapshot!: unknown;
}

/** Respuesta de la consulta de historial. */
export class HistoryTimelineDto {
  @ApiProperty({ description: 'Entidad consultada' })
  entity!: string;

  @ApiProperty({ description: 'Id del registro' })
  entityId!: string;

  @ApiProperty({ description: 'Nº de revisiones devueltas' })
  count!: number;

  @ApiProperty({ description: 'Revisiones ordenadas cronológicamente', type: [HistoryRevisionDto] })
  revisions!: HistoryRevisionDto[];
}
