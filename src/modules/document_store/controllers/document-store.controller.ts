import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  PageResponseDto,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { DocumentStoreService } from '../services';
import { CollectionNameGuard } from './collection-name.guard';
import {
  CreateFlexibleDocumentDto,
  DocumentResponseDto,
  ListDocumentsQueryDto,
  TenantScopeQueryDto,
  UpdateDocumentDto,
} from '../dto';

/**
 * Módulo 55 — Document Store. CRUD gobernado de documentos flexibles
 * (JSON/semiestructurados) sobre MongoDB, complementario a Postgres. La
 * colección viaja en la ruta y la valida `CollectionNameGuard`; todas las
 * operaciones se acotan por `tenantId`. El borrado es lógico (`deletedAt`).
 */
@ApiTags('document-store')
@ApiBearerAuth()
@UseGuards(CollectionNameGuard)
@ApiParam({ name: 'collection', description: 'Colección lógica de documentos' })
@Controller('document-store/collections/:collection/documents')
export class DocumentStoreController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: DocumentStoreService) {}

  /**
   * Crea create.
   *
   * @param collection - Valor de collection requerido por la operación.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create conforme al contrato `Promise<DocumentResponseDto>`.
   */
  @Post()
  @Roles('STORAGE_ADMIN', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un documento flexible en la colección' })
  create(
    @Param('collection') collection: string,
    @Body() dto: CreateFlexibleDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.service.create(collection, dto, actor);
  }

  /**
   * Obtiene find one.
   *
   * @param collection - Valor de collection requerido por la operación.
   * @param id - Identificador de id.
   * @param query - Valor de query requerido por la operación.
   * @returns Resultado de find one conforme al contrato `Promise<DocumentResponseDto>`.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Leer un documento por id (acotado por tenant)' })
  findOne(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Query() query: TenantScopeQueryDto,
  ): Promise<DocumentResponseDto> {
    return this.service.findOne(collection, id, query.tenantId);
  }

  /**
   * Obtiene list.
   *
   * @param collection - Valor de collection requerido por la operación.
   * @param query - Valor de query requerido por la operación.
   * @returns Resultado de list conforme al contrato `Promise<PageResponseDto<DocumentResponseDto>>`.
   */
  @Get()
  @ApiOperation({ summary: 'Listar documentos del tenant (paginado)' })
  list(
    @Param('collection') collection: string,
    @Query() query: ListDocumentsQueryDto,
  ): Promise<PageResponseDto<DocumentResponseDto>> {
    return this.service.list(collection, query);
  }

  /**
   * Actualiza update.
   *
   * @param collection - Valor de collection requerido por la operación.
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de update conforme al contrato `Promise<DocumentResponseDto>`.
   */
  @Patch(':id')
  @Roles('STORAGE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Actualizar un documento con concurrencia optimista',
  })
  update(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.service.update(collection, id, dto, actor);
  }

  /**
   * Ejecuta la operación soft delete.
   *
   * @param collection - Valor de collection requerido por la operación.
   * @param id - Identificador de id.
   * @param query - Valor de query requerido por la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de soft delete conforme al contrato `Promise<DocumentResponseDto>`.
   */
  @Delete(':id')
  @Roles('STORAGE_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Borrado lógico de un documento (soft-delete)' })
  softDelete(
    @Param('collection') collection: string,
    @Param('id') id: string,
    @Query() query: TenantScopeQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DocumentResponseDto> {
    return this.service.softDelete(collection, id, query.tenantId, actor);
  }
}
