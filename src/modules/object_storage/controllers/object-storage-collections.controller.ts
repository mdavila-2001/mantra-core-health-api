import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ObjectStorageCollectionsService } from '../services';
import {
  LargePayloadManifestPageDto,
  ListLargePayloadsQueryDto,
  ListUploadsQueryDto,
  MultipartUploadPageDto,
} from '../dto';

/**
 * `GET` de colección de `object_storage` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('object-storage-collections')
@ApiBearerAuth()
@Controller()
export class ObjectStorageCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ObjectStorageCollectionsService) {}

  /** V60-04: listar cargas grandes del tenant. */
  @Get('object-storage/large-payloads')
  @Roles('SYSTEM', 'STORAGE_ADMIN')
  @ApiOperation({ summary: 'Listar cargas grandes del tenant' })
  @ApiOkResponse({ type: LargePayloadManifestPageDto })
  listLargePayloads(
    @Query() query: ListLargePayloadsQueryDto,
  ): Promise<LargePayloadManifestPageDto> {
    return this.collections.listLargePayloads(query);
  }

  /** V60-08, V60-05: listar cargas multiparte del tenant. */
  @Get('object-storage/uploads')
  @Roles('STORAGE_CLIENT', 'SYSTEM', 'STORAGE_ADMIN')
  @ApiOperation({ summary: 'Listar cargas multiparte del tenant' })
  @ApiOkResponse({ type: MultipartUploadPageDto })
  listUploads(
    @Query() query: ListUploadsQueryDto,
  ): Promise<MultipartUploadPageDto> {
    return this.collections.listUploads(query);
  }
}
