import type { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/** Metadatos de paginación de una respuesta de listado. */
export class PageMetaDto {
  /**
   * Valor de page mantenido por la instancia.
   */
  @ApiProperty({ description: 'Página devuelta (1-based)' }) page!: number;
  /**
   * Valor de page size mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tamaño de página pedido' }) pageSize!: number;
  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Total de filas que cumplen los filtros' })
  total!: number;
  /**
   * Valor de total pages mantenido por la instancia.
   */
  @ApiProperty({ description: 'Total de páginas con ese tamaño' })
  totalPages!: number;
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

/**
 * Esquema OpenAPI de una página de `item`, con el mismo `{ data, meta }` que
 * {@link PageResponseDto}.
 *
 * `PageResponseDto<T>` es genérico y el genérico se borra en tiempo de
 * ejecución: el contrato publicaba `data` como un arreglo de objetos sin forma.
 * Esta clase lo fija por recurso, para que el cliente generado sepa qué trae
 * cada fila. El nombre del esquema se pasa explícito porque dos clases
 * anónimas colisionarían en `components.schemas`.
 *
 * @param item - DTO de una fila.
 * @param name - Nombre del esquema en el contrato (p. ej. `GeofencePageDto`).
 * @returns Clase con los decoradores de Swagger de la página.
 */
export function pageResponseOf<T>(
  item: Type<T>,
  name: string,
): Type<PageResponseDto<T>> {
  class Page {
    @ApiProperty({ type: () => [item] })
    data!: T[];

    @ApiProperty({ type: () => PageMetaDto })
    meta!: PageMetaDto;
  }
  Object.defineProperty(Page, 'name', { value: name });
  return Page;
}
