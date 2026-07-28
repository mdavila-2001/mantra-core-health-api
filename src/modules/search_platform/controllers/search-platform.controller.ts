import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PreconditionFailedException,
  Roles,
  getCurrentTenantId,
} from '../../../common';
import { SearchIndexService } from '../services';
import {
  DeleteDocumentResponseDto,
  IndexDocumentDto,
  IndexDocumentResponseDto,
  SearchRequestDto,
  SearchResponseDto,
} from '../dto';

/**
 * API gobernada de búsqueda (módulo 57). El `tenantId` se toma del contexto de
 * la petición (cabecera `X-Tenant-Id` ya verificada por el interceptor) y NUNCA
 * del cuerpo, de modo que el aislamiento no depende de lo que envíe el cliente.
 * Fail-closed: sin tenant de contexto se rechaza antes de llegar al servicio.
 */
@ApiTags('search_platform')
@ApiBearerAuth()
@Controller('search')
export class SearchPlatformController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param searchService - Valor de search service requerido por la operación.
   */
  constructor(private readonly searchService: SearchIndexService) {}

  /** Indexa (upsert) un documento en el índice indicado. */
  @Post(':index/documents')
  @Roles('PLATFORM_ADMIN', 'SEARCH_ADMIN', 'SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Indexar un documento',
    description:
      'El servidor sella el documento con el `tenantId` del contexto; el del cuerpo se ignora.',
  })
  async indexDocument(
    @Param('index') index: string,
    @Body() dto: IndexDocumentDto,
  ): Promise<IndexDocumentResponseDto> {
    const tenantId = this.requireTenant();
    const result = await this.searchService.indexDocument(
      index,
      tenantId,
      dto.id,
      dto.document,
    );
    return { index, id: result.id, result: result.result };
  }

  /** Busca en el índice; devuelve aciertos y facetas (con allowlist de campos). */
  @Post(':index/_search')
  @Roles('PLATFORM_ADMIN', 'SEARCH_ADMIN', 'SEARCH_READER', 'SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar documentos',
    description:
      'Búsqueda tipada: texto + filtros/facetas declarados. Se inyecta siempre el filtro de tenant.',
  })
  async search(
    @Param('index') index: string,
    @Body() dto: SearchRequestDto,
  ): Promise<SearchResponseDto> {
    const tenantId = this.requireTenant();
    const result = await this.searchService.search(index, {
      tenantId,
      query: dto.query,
      filters: dto.filters,
      facets: dto.facets,
      from: dto.from,
      size: dto.size,
    });
    return { total: result.total, hits: result.hits, facets: result.facets };
  }

  /** Elimina un documento por id dentro del índice. */
  @Delete(':index/documents/:id')
  @Roles('PLATFORM_ADMIN', 'SEARCH_ADMIN', 'SYSTEM')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un documento' })
  async deleteDocument(
    @Param('index') index: string,
    @Param('id') id: string,
  ): Promise<DeleteDocumentResponseDto> {
    const tenantId = this.requireTenant();
    const result = await this.searchService.deleteDocument(index, tenantId, id);
    return { index, id, deleted: result.deleted };
  }

  /** Exige tenant de contexto (fail-closed). */
  private requireTenant(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new PreconditionFailedException(
        'La operación de búsqueda exige un tenant de contexto (X-Tenant-Id)',
      );
    }
    return tenantId;
  }
}
