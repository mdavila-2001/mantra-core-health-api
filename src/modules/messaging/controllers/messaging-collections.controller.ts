import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { MessagingCollectionsService } from '../services';
import { ListJobsQueryDto, QueuedJobPageDto } from '../dto';

/**
 * `GET` de colección de `messaging` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('messaging-collections')
@ApiBearerAuth()
@Controller()
export class MessagingCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: MessagingCollectionsService) {}

  /** V35-04: listar trabajos encolados del tenant. */
  @Get('queues/jobs')
  @Roles('SYSTEM', 'MESSAGING_ADMIN')
  @ApiOperation({ summary: 'Listar trabajos encolados del tenant' })
  @ApiOkResponse({ type: QueuedJobPageDto })
  listJobs(@Query() query: ListJobsQueryDto): Promise<QueuedJobPageDto> {
    return this.collections.listJobs(query);
  }
}
