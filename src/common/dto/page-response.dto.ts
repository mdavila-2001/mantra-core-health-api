import { ApiProperty } from '@nestjs/swagger';

/** Metadatos de paginación de una respuesta de listado. */
export class PageMetaDto {
  /**
   * Valor de page mantenido por la instancia.
   */
  @ApiProperty() page!: number;
  /**
   * Valor de page size mantenido por la instancia.
   */
  @ApiProperty() pageSize!: number;
  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty() total!: number;
  /**
   * Valor de total pages mantenido por la instancia.
   */
  @ApiProperty() totalPages!: number;
}

/**
 * Envoltura genérica de respuesta paginada. Homogeneiza la forma de todo listado
 * (`{ data, meta }`) para que el cliente no tenga que inferir la paginación por
 * heurísticas distintas en cada endpoint.
 */
export class PageResponseDto<T> {
  /**
   * Valor de data mantenido por la instancia.
   */
  @ApiProperty({ isArray: true })
  data: T[];

  /**
   * Valor de meta mantenido por la instancia.
   */
  @ApiProperty({ type: PageMetaDto })
  meta: PageMetaDto;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param data - Valor de data requerido por la operación.
   * @param total - Valor de total requerido por la operación.
   * @param page - Valor de page requerido por la operación.
   * @param pageSize - Valor de page size requerido por la operación.
   */
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
