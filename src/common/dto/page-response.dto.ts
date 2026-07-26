import { ApiProperty } from '@nestjs/swagger';

/** Metadatos de paginación de una respuesta de listado. */
export class PageMetaDto {
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

/**
 * Envoltura genérica de respuesta paginada. Homogeneiza la forma de todo listado
 * (`{ data, meta }`) para que el cliente no tenga que inferir la paginación por
 * heurísticas distintas en cada endpoint.
 */
export class PageResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;

  constructor(data: T[], total: number, page: number, pageSize: number) {
    this.data = data;
    this.meta = {
      page,
      pageSize,
      total,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }
}
