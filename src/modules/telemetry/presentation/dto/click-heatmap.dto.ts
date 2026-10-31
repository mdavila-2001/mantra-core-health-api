import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PORTAL_CODES,
  type PortalCode,
} from '../../application/services/telemetry-analytics.service';

/** Segmentos de pantalla que el cliente manda en `tamano_pantalla`. */
export const SCREEN_SIZES = ['movil', 'tableta', 'escritorio'] as const;
export type ScreenSize = (typeof SCREEN_SIZES)[number];

/** Query de `GET /admin/analytics/heatmap`. `route` es obligatoria: un mapa es de UNA pantalla. */
export class ClickHeatmapQueryDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 300,
    description:
      'Plantilla de ruta, p. ej. /patients/:id (la misma que `routeTemplate` del evento).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  route!: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: to − 7 días. Máximo 92 días.',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Por defecto: ahora',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: PORTAL_CODES })
  @IsOptional()
  @IsIn(PORTAL_CODES)
  portal?: PortalCode;

  @ApiPropertyOptional({
    enum: SCREEN_SIZES,
    description:
      'Segmenta las celdas y los elementos por tamaño de pantalla; `byScreenSize` no se filtra.',
  })
  @IsOptional()
  @IsIn(SCREEN_SIZES)
  screenSize?: ScreenSize;
}
