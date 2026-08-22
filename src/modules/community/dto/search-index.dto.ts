import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** Petición de reindexado del directorio público. */
export class ReindexRequestDto {
  @ApiPropertyOptional({
    default: true,
    description:
      'Recrear el índice antes de indexar. En `false` sólo se hace upsert, ' +
      'lo que conserva documentos de perfiles que ya no son públicos: usarlo ' +
      'sólo para rellenar, nunca para reconstruir.',
  })
  @IsOptional()
  @IsBoolean()
  recreate?: boolean;
}

/** Resultado de un reindexado. */
export class ReindexResponseDto {
  @ApiProperty({ description: 'Documentos efectivamente indexados' })
  indexed!: number;

  @ApiProperty({ description: 'Perfiles públicos que había que indexar' })
  total!: number;

  @ApiProperty({ description: 'Documentos que el índice confirma tener' })
  confirmed!: number;

  @ApiProperty({ description: 'Si algún lote reportó errores parciales' })
  errors!: boolean;

  @ApiProperty({ description: 'Rótulo legible: «indexados N de N»' })
  summary!: string;
}

/** Estado del índice frente a la base. */
export class SearchIndexHealthDto {
  @ApiProperty({ description: 'Si el cluster de búsqueda responde' })
  available!: boolean;

  @ApiProperty({ description: 'Perfiles públicos en la base' })
  profiles!: number;

  @ApiProperty({
    nullable: true,
    description: 'Documentos en el índice; `null` si el índice no responde',
  })
  documents!: number | null;

  @ApiProperty({
    description:
      'Si el buscador público está sirviéndose del índice (y no del SQL)',
  })
  serving!: boolean;
}
