import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { QaLabCollectionsService } from '../services';
import { ListSchedulesQueryDto, TestSchedulePageDto } from '../dto';

/**
 * `GET` de colección de `qa_lab` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('qa-lab-collections')
@ApiBearerAuth()
@Controller()
export class QaLabCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: QaLabCollectionsService) {}

  /** V36-07: listar agendas de qa del tenant. */
  @Get('qa/schedules')
  @Roles('QA_ADMIN', 'QA_ENGINEER')
  @ApiOperation({ summary: 'Listar agendas de QA del tenant' })
  @ApiOkResponse({ type: TestSchedulePageDto })
  listSchedules(
    @Query() query: ListSchedulesQueryDto,
  ): Promise<TestSchedulePageDto> {
    return this.collections.listSchedules(query);
  }
}
